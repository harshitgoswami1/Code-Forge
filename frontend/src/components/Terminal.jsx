import { useEffect, useRef, useState } from "react";
import { Terminal as Xterm } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import { io } from "socket.io-client";
import "@xterm/xterm/css/xterm.css";
import { TerminalSquare, Trash2, Wifi, WifiOff } from "lucide-react";

// Terminal-blueprint theme, matched to the code viewer palette.
const XTERM_THEME = {
  background: "#0c0d10",
  foreground: "#e8e9ec",
  cursor: "#caff4d",
  cursorAccent: "#0c0d10",
  selectionBackground: "#2a2e36",
  black: "#1a1d23",
  red: "#ff5470",
  green: "#caff4d",
  yellow: "#ff9d6b",
  blue: "#5ac8fa",
  magenta: "#c98bff",
  cyan: "#5ac8fa",
  white: "#e8e9ec",
  brightBlack: "#5b626d",
  brightRed: "#ff6a3d",
  brightGreen: "#caff4d",
  brightYellow: "#ffb37a",
  brightBlue: "#7cd6ff",
  brightMagenta: "#d6a5ff",
  brightCyan: "#7cd6ff",
  brightWhite: "#ffffff",
};

export default function Terminal({ agentUrl, active }) {
  const mountRef = useRef(null);
  const termRef = useRef(null);
  const fitRef = useRef(null);
  const socketRef = useRef(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!agentUrl || !mountRef.current) return;

    const term = new Xterm({
      cursorBlink: true,
      fontFamily:
        'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
      fontSize: 13,
      lineHeight: 1.2,
      theme: XTERM_THEME,
      allowProposedApi: true,
    });
    const fit = new FitAddon();
    term.loadAddon(fit);
    term.open(mountRef.current);
    fit.fit();
    termRef.current = term;
    fitRef.current = fit;

    // socket.io to the per-sandbox agent (CORS origin: *).
    // Default transports: polling first, then upgrade to websocket — most
    // compatible through the nginx ingress / router.
    const socket = io(agentUrl, { reconnectionAttempts: 5 });
    socketRef.current = socket;

    socket.on("connect", () => setConnected(true));
    socket.on("disconnect", () => setConnected(false));
    socket.on("connect_error", (err) => {
      setConnected(false);
      console.error("[terminal] socket connect_error:", err?.message, err);
    });
    socket.on("terminal-output", (data) => term.write(data));

    // keystrokes → agent PTY
    const onData = term.onData((data) => socket.emit("terminal-input", data));

    // keep PTY/viewport in sync on container resize
    const ro = new ResizeObserver(() => {
      try {
        fit.fit();
      } catch {
        /* element not visible yet */
      }
    });
    ro.observe(mountRef.current);

    return () => {
      ro.disconnect();
      onData.dispose();
      socket.disconnect();
      term.dispose();
      termRef.current = null;
      socketRef.current = null;
      fitRef.current = null;
    };
  }, [agentUrl]);

  // terminal is opened while hidden (always-mounted); when its tab becomes
  // active it has real dimensions → refit and grab keyboard focus.
  useEffect(() => {
    if (!active) return;
    const id = setTimeout(() => {
      try {
        fitRef.current?.fit();
      } catch {
        /* not laid out yet */
      }
      termRef.current?.focus();
    }, 0);
    return () => clearTimeout(id);
  }, [active]);

  const clear = () => termRef.current?.clear();

  if (!agentUrl) {
    return (
      <div className="flex h-full flex-col items-center justify-center bg-base text-center">
        <TerminalSquare size={26} className="text-ink-faint" />
        <p className="mt-3 text-[13px] text-ink-faint">
          No sandbox — start a session to open a shell
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col bg-base">
      <div className="flex h-9 shrink-0 items-center justify-between border-b border-line bg-panel px-3">
        <span className="flex items-center gap-1.5 text-ink-faint">
          <TerminalSquare size={13} />
          <span className="mono text-[12px] text-ink-dim">workspace shell</span>
        </span>
        <div className="flex items-center gap-3">
          <span
            className={`flex items-center gap-1.5 label ${
              connected ? "text-signal" : "text-ink-faint"
            }`}
          >
            {connected ? <Wifi size={12} /> : <WifiOff size={12} />}
            {connected ? "connected" : "offline"}
          </span>
          <button
            onClick={clear}
            title="Clear terminal"
            className="flex h-6 w-6 items-center justify-center rounded-md text-ink-faint transition hover:bg-raised hover:text-ink"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      <div
        ref={mountRef}
        onClick={() => termRef.current?.focus()}
        className="min-h-0 flex-1 overflow-hidden p-2"
      />
    </div>
  );
}
