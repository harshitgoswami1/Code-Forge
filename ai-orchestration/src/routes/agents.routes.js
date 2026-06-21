import { Router } from "express";
import { createCodeAgent } from "../agents/code.agent.js";

const agentRouter = Router();

agentRouter.post("/invoke", async (req, res) => {
    // SSE headers
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    res.flushHeaders();

    // Track whether the client has disconnected.
    // NOTE: listen on `res`, not `req` — on a POST, `req`'s "close" fires when
    // the request body finishes being read (right after express.json()), which
    // would mark us closed before streaming even starts.
    let closed = false;

    res.on("close", () => {
        closed = true;
    });

    // Helper to send SSE events
    const send = (event) => {
        if (closed) return;

        res.write(`data: ${JSON.stringify(event)}\n\n`);
    };

    // Notify the client that the stream is ready
    send({
        type: "connected",
    });

    try {
        const { prompt, sandboxId } = req.body;

        if (!prompt || typeof prompt !== "string") {
            send({
                type: "error",
                message: "Field 'prompt' is required and must be a string",
            });

            return res.end();
        }

        if (!sandboxId || typeof sandboxId !== "string") {
            send({
                type: "error",
                message: "Field 'sandboxId' is required and must be a string",
            });

            return res.end();
        }

        const baseUrl = `http://sandbox-service-${sandboxId}:3000`;
        const agent = createCodeAgent(baseUrl);

        // Stream with custom mode so tools' config.writer(...) events flow out,
        // and values mode so we can grab the final assistant message.
        const stream = await agent.stream(
            {
                messages: [{ role: "user", content: prompt }],
            },
            {
                streamMode: ["custom", "values"],
            }
        );

        let finalState;

        for await (const [mode, data] of stream) {
            if (closed) break;

            if (mode === "custom") {
                // Tool events emitted via config.writer inside the tools.
                send(data);
            } else if (mode === "values") {
                finalState = data;
            }
        }

        const messages = finalState?.messages ?? [];
        const last = messages[messages.length - 1];
        const content = last?.content;

        send({
            type: "message",
            content:
                typeof content === "string"
                    ? content
                    : JSON.stringify(content ?? ""),
        });

        send({
            type: "done",
        });

        res.end();
    } catch (error) {
        console.error(error);

        send({
            type: "error",
            message: error?.message ?? "Internal server error",
        });

        res.end();
    }
});

export default agentRouter;