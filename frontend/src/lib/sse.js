/**
 * Parse a Server-Sent-Events stream that arrives over a POST response.
 *
 * The backend (ai-orchestration /api/ai/invoke) writes frames as
 * `data: ${JSON.stringify(event)}\n\n`, so we cannot use the browser
 * `EventSource` API (GET-only). Instead we read the response body
 * ourselves, buffer bytes, split on the blank-line frame delimiter and
 * JSON-parse each `data:` payload.
 *
 * @param {Response} response  fetch() response with a readable body
 * @param {(event: object) => void} onEvent  called once per parsed event
 */
export async function parseSSEStream(response, onEvent) {
  if (!response.body) {
    throw new Error("Response has no readable body");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      // Frames are separated by a blank line. Tolerate \r\n as well.
      let sep;
      while ((sep = findFrameBreak(buffer)) !== -1) {
        const rawFrame = buffer.slice(0, sep.index);
        buffer = buffer.slice(sep.index + sep.length);
        emitFrame(rawFrame, onEvent);
      }
    }

    // Flush any trailing frame without a terminating blank line.
    if (buffer.trim()) emitFrame(buffer, onEvent);
  } finally {
    reader.releaseLock();
  }
}

function findFrameBreak(buffer) {
  const lf = buffer.indexOf("\n\n");
  const crlf = buffer.indexOf("\r\n\r\n");
  if (lf === -1 && crlf === -1) return -1;
  if (crlf === -1 || (lf !== -1 && lf < crlf)) return { index: lf, length: 2 };
  return { index: crlf, length: 4 };
}

function emitFrame(rawFrame, onEvent) {
  // A frame may contain multiple `data:` lines per the SSE spec; join them.
  const dataLines = rawFrame
    .split(/\r?\n/)
    .filter((line) => line.startsWith("data:"))
    .map((line) => line.slice(5).trimStart());

  if (dataLines.length === 0) return;

  const payload = dataLines.join("\n");
  try {
    onEvent(JSON.parse(payload));
  } catch {
    // Non-JSON keep-alive / comment — ignore.
  }
}
