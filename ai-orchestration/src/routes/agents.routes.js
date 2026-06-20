import { Router } from "express";
import { createCodeAgent } from "../agents/code.agent.js";

const agentRouter = Router();

const sendEvent = (res, event, data) => {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
};

agentRouter.post("/invoke", async (req, res) => {
    const { prompt, sandboxId } = req.body;

    if (!prompt || typeof prompt !== "string") {
        return res.status(400).json({ error: "Field 'prompt' is required and must be a string" });
    }
    if (!sandboxId || typeof sandboxId !== "string") {
        return res.status(400).json({ error: "Field 'sandboxId' is required and must be a string" });
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    req.on('close', () => res.end());

    try {
        const baseUrl = `http://sandbox-service-${sandboxId}:3000`;
        const agent = createCodeAgent(baseUrl);

        const eventStream = agent.streamEvents(
            { messages: [{ role: "user", content: prompt }] },
            { version: "v2" }
        );

        for await (const event of eventStream) {
            switch (event.event) {
                case "on_chat_model_stream": {
                    const token = event.data?.chunk?.content;
                    if (token) sendEvent(res, "token", { token });
                    break;
                }
                case "on_tool_start":
                    sendEvent(res, "tool_start", { name: event.name, input: event.data?.input });
                    break;
                case "on_tool_end":
                    sendEvent(res, "tool_end", { name: event.name, output: event.data?.output });
                    break;
                case "on_chain_end":
                    if (event.name === "LangGraph") {
                        const msgs = event.data?.output?.messages;
                        const last = msgs?.[msgs.length - 1];
                        if (last?.content) sendEvent(res, "done", { message: last.content });
                    }
                    break;
            }
        }

        sendEvent(res, "end", {});
    } catch (error) {
        console.error("Error invoking agent:", error);
        sendEvent(res, "error", { message: error.message ?? "Internal server error" });
    } finally {
        res.end();
    }
});

export default agentRouter;
