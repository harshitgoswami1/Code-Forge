import { useState } from "react";
import { Code2, Columns2, Monitor, Radio, TerminalSquare } from "lucide-react";
import ChatPanel from "./ChatPanel.jsx";
import FileExplorer from "./FileExplorer.jsx";
import CodeViewer from "./CodeViewer.jsx";
import PreviewPane from "./PreviewPane.jsx";
import Terminal from "./Terminal.jsx";

const VIEWS = [
  { id: "split", label: "Split", icon: Columns2 },
  { id: "code", label: "Code", icon: Code2 },
  { id: "preview", label: "Preview", icon: Monitor },
  { id: "terminal", label: "Terminal", icon: TerminalSquare },
];

export default function AppShell(b) {
  const [view, setView] = useState("split");
  const streaming = b.status === "streaming";
  const openContent = b.openFile ? b.contents[b.openFile] : null;

  const showCode = view === "code" || view === "split";
  const showPreview = view === "preview" || view === "split";
  const showTerminal = view === "terminal";

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      {/* ── top bar ─────────────────────────────────────────────── */}
      <header className="flex h-12 shrink-0 items-center justify-between border-b border-line bg-panel px-4">
        <div className="flex items-center gap-2.5">
          <span className="flex h-6 w-6 items-center justify-center rounded-md bg-signal text-void">
            <Code2 size={15} strokeWidth={2.5} />
          </span>
          <span className="font-mono text-[15px] font-semibold tracking-tight text-ink">
            FORGE
          </span>
          <span className="label hidden sm:inline">AI code builder</span>
        </div>

        <div className="flex items-center gap-3">
          <StatusPill status={b.status} />
          <SandboxTag id={b.session?.sandboxId} />
        </div>
      </header>

      {/* ── body ────────────────────────────────────────────────── */}
      <div className="flex min-h-0 flex-1">
        {/* chat */}
        <aside className="w-[360px] shrink-0 border-r border-line">
          <ChatPanel
            messages={b.messages}
            activity={b.activity}
            status={b.status}
            error={b.error}
            onSend={b.sendPrompt}
          />
        </aside>

        {/* file explorer */}
        <aside className="w-[220px] shrink-0 border-r border-line">
          <FileExplorer
            files={b.files}
            openFile={b.openFile}
            onSelect={b.selectFile}
            busy={streaming}
          />
        </aside>

        {/* work area */}
        <main className="flex min-w-0 flex-1 flex-col">
          <div className="flex h-9 shrink-0 items-center gap-1 border-b border-line bg-panel px-2">
            {VIEWS.map((v) => {
              const Icon = v.icon;
              const active = view === v.id;
              return (
                <button
                  key={v.id}
                  onClick={() => setView(v.id)}
                  className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[12px] transition ${
                    active
                      ? "bg-raised text-ink"
                      : "text-ink-faint hover:text-ink-dim"
                  }`}
                >
                  <Icon size={13} />
                  {v.label}
                </button>
              );
            })}
          </div>

          <div className="relative flex min-h-0 flex-1">
            {!showTerminal && showCode && (
              <div
                className={`min-w-0 ${showPreview ? "w-1/2 border-r border-line" : "flex-1"}`}
              >
                <CodeViewer
                  path={b.openFile}
                  content={openContent}
                  streaming={streaming}
                />
              </div>
            )}
            {!showTerminal && showPreview && (
              <div className={`min-w-0 ${showCode ? "w-1/2" : "flex-1"}`}>
                <PreviewPane
                  previewUrl={b.session?.previewUrl}
                  nonce={b.previewNonce}
                  onReload={b.reloadPreview}
                  streaming={streaming}
                />
              </div>
            )}
            {/* terminal stays mounted so the shell session + socket persist
                across view switches; only its visibility toggles */}
            <div
              className={`absolute inset-0 ${showTerminal ? "" : "hidden"}`}
            >
              <Terminal agentUrl={b.session?.agentUrl} active={showTerminal} />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

function StatusPill({ status }) {
  const map = {
    streaming: { dot: "bg-signal fg-blink", text: "building", cls: "text-signal" },
    starting: { dot: "bg-sky fg-blink", text: "starting", cls: "text-sky" },
    done: { dot: "bg-signal", text: "ready", cls: "text-ink-dim" },
    error: { dot: "bg-rose", text: "error", cls: "text-rose" },
    idle: { dot: "bg-ink-faint", text: "idle", cls: "text-ink-faint" },
  };
  const s = map[status] || map.idle;
  return (
    <span className="flex items-center gap-1.5">
      <Radio size={12} className={s.cls} />
      <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
      <span className={`label ${s.cls}`}>{s.text}</span>
    </span>
  );
}

function SandboxTag({ id }) {
  if (!id) return null;
  return (
    <span className="mono hidden rounded-md border border-line bg-base px-2 py-1 text-[10px] text-ink-faint md:inline">
      {id.slice(0, 8)}
    </span>
  );
}
