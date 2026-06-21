import { useEffect, useRef, useState } from "react";
import { ArrowUp, Loader2 } from "lucide-react";
import ActivityFeed from "./ActivityFeed.jsx";

export default function ChatPanel({
  messages,
  activity,
  status,
  error,
  onSend,
}) {
  const [value, setValue] = useState("");
  const streaming = status === "streaming";
  const scrollRef = useRef(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, activity]);

  const submit = () => {
    const text = value.trim();
    if (!text || streaming) return;
    onSend(text);
    setValue("");
  };

  return (
    <div className="flex h-full flex-col bg-panel">
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4">
        <div className="space-y-3">
          {messages.map((m) => (
            <Message key={m.id} role={m.role} content={m.content} />
          ))}
          {error && (
            <div className="rounded-lg border border-rose/40 bg-rose/10 px-3 py-2 text-[12.5px] text-rose">
              <span className="mono">⚠ {error}</span>
            </div>
          )}
        </div>
      </div>

      <ActivityFeed activity={activity} streaming={streaming} />

      <div className="border-t border-line p-3">
        <div className="rounded-lg border border-line-bright bg-base transition focus-within:border-signal/50">
          <textarea
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                submit();
              }
            }}
            rows={2}
            disabled={streaming}
            placeholder={streaming ? "Agent is working…" : "Ask for a change…"}
            className="w-full resize-none bg-transparent px-3 py-2.5 text-[13.5px] text-ink outline-none placeholder:text-ink-faint disabled:opacity-50"
          />
          <div className="flex items-center justify-between px-3 pb-2">
            <span className="label">⏎ send · ⇧⏎ newline</span>
            <button
              onClick={submit}
              disabled={streaming || !value.trim()}
              className="flex h-7 w-7 items-center justify-center rounded-md bg-signal text-void transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-30"
            >
              {streaming ? (
                <Loader2 size={14} className="fg-spin" />
              ) : (
                <ArrowUp size={15} strokeWidth={2.5} />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Message({ role, content }) {
  if (role === "user") {
    return (
      <div className="fg-rise flex justify-end">
        <div className="max-w-[88%] rounded-xl rounded-br-sm border border-line-bright bg-raised px-3.5 py-2.5 text-[13.5px] text-ink">
          {content}
        </div>
      </div>
    );
  }
  return (
    <div className="fg-rise">
      <div className="mb-1 flex items-center gap-1.5">
        <span className="h-1.5 w-1.5 rounded-full bg-signal" />
        <span className="label">Agent</span>
      </div>
      <div className="whitespace-pre-wrap text-[13.5px] leading-relaxed text-ink-dim">
        {content}
      </div>
    </div>
  );
}
