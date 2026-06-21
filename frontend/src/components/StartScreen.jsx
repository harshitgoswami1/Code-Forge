import { useState } from "react";
import { ArrowRight, Loader2, Sparkles } from "lucide-react";

const SUGGESTIONS = [
  "A pricing page with three tiers and a monthly/yearly toggle",
  "A kanban board with draggable cards and dark mode",
  "A landing page for a coffee roaster, warm and editorial",
  "A dashboard with stat cards and a recent-activity feed",
];

export default function StartScreen({ onStart, status, error }) {
  const [value, setValue] = useState("");
  const busy = status === "starting";

  const submit = () => {
    const text = value.trim();
    if (!text || busy) return;
    onStart(text);
  };

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6">
      {/* corner brackets / blueprint frame */}
      <Brackets />

      <div className="relative z-10 w-full max-w-2xl">
        <div className="fg-rise mb-10 flex items-center justify-center gap-3">
          <span className="label">AI · CODE · BUILDER</span>
        </div>

        <h1
          className="fg-rise text-center leading-[0.92] text-ink"
          style={{ animationDelay: "60ms" }}
        >
          <span className="block font-serif text-[clamp(3rem,9vw,6.5rem)] tracking-tight">
            Speak it.
          </span>
          <span className="block font-serif italic text-[clamp(3rem,9vw,6.5rem)] tracking-tight text-signal">
            Watch it build.
          </span>
        </h1>

        <p
          className="fg-rise mx-auto mt-7 max-w-md text-center text-ink-dim"
          style={{ animationDelay: "120ms" }}
        >
          Describe an interface in plain language. A live React sandbox spins
          up and an agent writes the code while you watch — file by file, in
          real time.
        </p>

        <div
          className="fg-rise mt-10"
          style={{ animationDelay: "180ms" }}
        >
          <div className="group relative rounded-xl border border-line-bright bg-panel/80 backdrop-blur transition focus-within:border-signal/60">
            <textarea
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) submit();
              }}
              placeholder="Build me a…"
              rows={3}
              disabled={busy}
              className="w-full resize-none bg-transparent px-5 py-4 text-[15px] text-ink outline-none placeholder:text-ink-faint"
            />
            <div className="flex items-center justify-between border-t border-line px-4 py-2.5">
              <span className="label">⌘ + ⏎ to launch</span>
              <button
                onClick={submit}
                disabled={busy || !value.trim()}
                className="group/btn flex items-center gap-2 rounded-lg bg-signal px-4 py-2 text-[13px] font-semibold text-void transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {busy ? (
                  <>
                    <Loader2 size={15} className="fg-spin" />
                    Spinning up sandbox…
                  </>
                ) : (
                  <>
                    <Sparkles size={15} />
                    Launch build
                    <ArrowRight
                      size={15}
                      className="transition group-hover/btn:translate-x-0.5"
                    />
                  </>
                )}
              </button>
            </div>
          </div>

          {error && (
            <p className="mono mt-3 text-[12px] text-rose">⚠ {error}</p>
          )}

          <div className="mt-6 flex flex-wrap gap-2">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                disabled={busy}
                onClick={() => setValue(s)}
                className="rounded-full border border-line bg-raised/50 px-3 py-1.5 text-[12px] text-ink-dim transition hover:border-line-bright hover:text-ink disabled:opacity-40"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function Brackets() {
  const arm = "absolute h-10 w-10 border-signal/30";
  return (
    <>
      <span className={`${arm} left-6 top-6 border-l border-t`} />
      <span className={`${arm} right-6 top-6 border-r border-t`} />
      <span className={`${arm} bottom-6 left-6 border-b border-l`} />
      <span className={`${arm} bottom-6 right-6 border-b border-r`} />
    </>
  );
}
