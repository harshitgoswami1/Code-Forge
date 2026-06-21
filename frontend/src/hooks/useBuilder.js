import { useCallback, useReducer, useRef } from "react";
import {
  startSandbox,
  invokeAI,
  listFiles,
  readFiles,
} from "../lib/api.js";

/* ── reducer ─────────────────────────────────────────────────────────── */

const initial = {
  session: null, // { sandboxId, previewUrl, agentUrl }
  status: "idle", // idle | starting | streaming | done | error
  messages: [], // { id, role: "user"|"assistant", content }
  activity: [], // { id, tool, state: "running"|"done"|"error", message, count }
  files: [], // flat relative paths
  contents: {}, // { path: content }
  openFile: null,
  previewNonce: 0, // bump → iframe remount
  error: null,
};

let _id = 0;
const nextId = () => `${Date.now().toString(36)}-${_id++}`;

/**
 * The backend stringifies the LLM's final message. It is usually a content
 * block array like `[{"type":"text","text":"..."}]`; unwrap to readable text.
 */
function readableMessage(raw) {
  if (typeof raw !== "string") return String(raw ?? "");
  const trimmed = raw.trim();
  if (!trimmed.startsWith("[") && !trimmed.startsWith("{")) return raw;
  try {
    const parsed = JSON.parse(trimmed);
    const blocks = Array.isArray(parsed) ? parsed : [parsed];
    const text = blocks
      .map((b) => (typeof b === "string" ? b : b?.text ?? ""))
      .filter(Boolean)
      .join("\n")
      .trim();
    return text || raw;
  } catch {
    return raw;
  }
}

function reducer(state, action) {
  switch (action.type) {
    case "STARTING":
      return { ...state, status: "starting", error: null };

    case "SESSION":
      return { ...state, session: action.session };

    case "USER_MSG":
      return {
        ...state,
        messages: [
          ...state.messages,
          { id: nextId(), role: "user", content: action.content },
        ],
      };

    case "STREAM_BEGIN":
      return { ...state, status: "streaming", activity: [], error: null };

    case "TOOL_EVENT": {
      const ev = action.event;
      const detail =
        ev.fileCount != null
          ? `${ev.fileCount} file(s)`
          : (ev.files || ev.updatedFiles || ev.createdFiles || [])
              .slice(0, 3)
              .join(", ");
      if (ev.status === "start") {
        return {
          ...state,
          activity: [
            ...state.activity,
            {
              id: nextId(),
              tool: ev.tool,
              state: "running",
              message: ev.message || "",
              detail,
            },
          ],
        };
      }
      // complete | error → resolve the last running row for this tool
      const activity = [...state.activity];
      for (let i = activity.length - 1; i >= 0; i--) {
        if (activity[i].tool === ev.tool && activity[i].state === "running") {
          activity[i] = {
            ...activity[i],
            state: ev.status === "error" ? "error" : "done",
            message: ev.message || activity[i].message,
            detail: detail || activity[i].detail,
          };
          break;
        }
      }
      return { ...state, activity };
    }

    case "ASSISTANT_MSG":
      return {
        ...state,
        messages: [
          ...state.messages,
          {
            id: nextId(),
            role: "assistant",
            content: readableMessage(action.content),
          },
        ],
      };

    case "STREAM_DONE":
      return { ...state, status: "done" };

    case "FILES":
      return { ...state, files: action.files };

    case "CONTENTS":
      return { ...state, contents: { ...state.contents, ...action.contents } };

    case "OPEN_FILE":
      return { ...state, openFile: action.path };

    case "RELOAD_PREVIEW":
      return { ...state, previewNonce: state.previewNonce + 1 };

    case "ERROR":
      return { ...state, status: "error", error: action.message };

    default:
      return state;
  }
}

/* ── hook ────────────────────────────────────────────────────────────── */

export function useBuilder() {
  const [state, dispatch] = useReducer(reducer, initial);
  const abortRef = useRef(null);
  const sessionRef = useRef(null);

  const refreshFiles = useCallback(async (agentUrl, keepOpen) => {
    try {
      const files = await listFiles(agentUrl);
      dispatch({ type: "FILES", files });
      if (keepOpen && files.includes(keepOpen)) {
        const contents = await readFiles(agentUrl, [keepOpen]);
        dispatch({ type: "CONTENTS", contents });
      }
    } catch {
      /* non-fatal: file panel just stays stale */
    }
  }, []);

  const runPrompt = useCallback(
    async (prompt, session) => {
      dispatch({ type: "USER_MSG", content: prompt });
      dispatch({ type: "STREAM_BEGIN" });

      const controller = new AbortController();
      abortRef.current = controller;

      try {
        await invokeAI(
          { prompt, sandboxId: session.sandboxId, signal: controller.signal },
          (event) => {
            switch (event.type) {
              case "connected":
                break;
              case "tool":
                dispatch({ type: "TOOL_EVENT", event });
                break;
              case "message":
                if (event.content)
                  dispatch({ type: "ASSISTANT_MSG", content: event.content });
                break;
              case "error":
                dispatch({ type: "ERROR", message: event.message });
                break;
              case "done":
                dispatch({ type: "STREAM_DONE" });
                break;
              default:
                break;
            }
          }
        );
        dispatch({ type: "STREAM_DONE" });
      } catch (err) {
        if (err.name !== "AbortError")
          dispatch({ type: "ERROR", message: err.message });
        return;
      }

      // settle: refresh file list, re-read open file, reload preview
      const open = openRef.current;
      await refreshFiles(session.agentUrl, open);
      dispatch({ type: "RELOAD_PREVIEW" });
    },
    [refreshFiles]
  );

  // track open file without re-creating runPrompt
  const openRef = useRef(null);
  openRef.current = state.openFile;

  /** Start a fresh sandbox and immediately run the first prompt. */
  const start = useCallback(
    async (firstPrompt) => {
      dispatch({ type: "STARTING" });
      try {
        const session = await startSandbox();
        sessionRef.current = session;
        dispatch({ type: "SESSION", session });
        await refreshFiles(session.agentUrl, null);
        await runPrompt(firstPrompt, session);
      } catch (err) {
        dispatch({ type: "ERROR", message: err.message });
      }
    },
    [refreshFiles, runPrompt]
  );

  /** Send a follow-up prompt on the existing session. */
  const sendPrompt = useCallback(
    (prompt) => {
      const session = sessionRef.current;
      if (!session || state.status === "streaming") return;
      runPrompt(prompt, session);
    },
    [runPrompt, state.status]
  );

  /** Open a file in the viewer, lazily reading its content. */
  const selectFile = useCallback(
    async (path) => {
      dispatch({ type: "OPEN_FILE", path });
      const session = sessionRef.current;
      if (!session || state.contents[path] != null) return;
      try {
        const contents = await readFiles(session.agentUrl, [path]);
        dispatch({ type: "CONTENTS", contents });
      } catch {
        /* ignore read error */
      }
    },
    [state.contents]
  );

  const reloadPreview = useCallback(
    () => dispatch({ type: "RELOAD_PREVIEW" }),
    []
  );

  return {
    ...state,
    start,
    sendPrompt,
    selectFile,
    reloadPreview,
  };
}
