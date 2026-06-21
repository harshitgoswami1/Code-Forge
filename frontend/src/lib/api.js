import { parseSSEStream } from "./sse.js";

/**
 * Backend client for the AI code-builder.
 *
 * Two classes of calls:
 *  - `/api/*` → routed through the Vite dev proxy to the ingress (:80).
 *  - `{agentUrl}/*` → the per-sandbox agent, hit DIRECTLY from the browser
 *    (subdomain like `<id>.agent.localhost` resolves to 127.0.0.1; the
 *    agent serves CORS `origin: *`).
 */

async function jsonOrThrow(res, context) {
  if (!res.ok) {
    let detail = "";
    try {
      detail = await res.text();
    } catch {
      /* ignore */
    }
    throw new Error(`${context} failed (${res.status}) ${detail}`.trim());
  }
  return res.json();
}

/** POST /api/sandbox/start → { sandboxId, previewUrl, agentUrl } */
export async function startSandbox() {
  const res = await fetch("/api/sandbox/start", { method: "POST" });
  const data = await jsonOrThrow(res, "Start sandbox");
  return {
    sandboxId: data.sandbox,
    previewUrl: data.previewUrl,
    agentUrl: data.agentUrl,
  };
}

/**
 * POST /api/ai/invoke — opens the SSE stream and forwards each parsed
 * event to `onEvent`. Resolves when the stream ends.
 *
 * @param {{prompt: string, sandboxId: string, signal?: AbortSignal}} params
 * @param {(event: object) => void} onEvent
 */
export async function invokeAI({ prompt, sandboxId, signal }, onEvent) {
  const res = await fetch("/api/ai/invoke", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "text/event-stream" },
    body: JSON.stringify({ prompt, sandboxId }),
    signal,
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Invoke AI failed (${res.status}) ${detail}`.trim());
  }

  await parseSSEStream(res, onEvent);
}

/** GET {agentUrl}/list-files → string[] of relative paths */
export async function listFiles(agentUrl) {
  const res = await fetch(`${agentUrl}/list-files`);
  const data = await jsonOrThrow(res, "List files");
  return data.files ?? [];
}

/**
 * GET {agentUrl}/read-files?files=a,b
 * Backend returns [{ "/path": content }, ...]; normalise to { path: content }
 * with leading slashes stripped.
 */
export async function readFiles(agentUrl, paths) {
  if (!paths || paths.length === 0) return {};
  const query = encodeURIComponent(paths.join(","));
  const res = await fetch(`${agentUrl}/read-files?files=${query}`);
  const data = await jsonOrThrow(res, "Read files");
  const out = {};
  for (const entry of data.files ?? []) {
    for (const [key, value] of Object.entries(entry)) {
      out[key.replace(/^\//, "")] = value;
    }
  }
  return out;
}

/** POST {agentUrl}/create-files  body { files: [{file, content}] } */
export async function createFiles(agentUrl, files) {
  const res = await fetch(`${agentUrl}/create-files`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ files }),
  });
  return jsonOrThrow(res, "Create files");
}

/** PATCH {agentUrl}/update-files  body { updates: [{file, content}] } */
export async function updateFiles(agentUrl, updates) {
  const res = await fetch(`${agentUrl}/update-files`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ updates }),
  });
  return jsonOrThrow(res, "Update files");
}
