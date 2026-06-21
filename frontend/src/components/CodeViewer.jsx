import { useState } from "react";
import { Highlight } from "prism-react-renderer";
import { Check, Clipboard, FileCode2 } from "lucide-react";
import { langOf } from "../lib/fileTree.js";

// Terminal-blueprint theme for prism-react-renderer
const theme = {
  plain: { color: "#e8e9ec", backgroundColor: "transparent" },
  styles: [
    { types: ["comment", "prolog", "doctype", "cdata"], style: { color: "#5b626d", fontStyle: "italic" } },
    { types: ["punctuation"], style: { color: "#7c8593" } },
    { types: ["tag", "operator", "keyword", "selector"], style: { color: "#caff4d" } },
    { types: ["function", "class-name", "attr-name"], style: { color: "#5ac8fa" } },
    { types: ["string", "char", "attr-value", "inserted"], style: { color: "#ff9d6b" } },
    { types: ["number", "boolean", "constant", "symbol"], style: { color: "#ff6a3d" } },
    { types: ["variable", "property"], style: { color: "#e8e9ec" } },
    { types: ["deleted"], style: { color: "#ff5470" } },
  ],
};

export default function CodeViewer({ path, content, streaming }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    if (content == null) return;
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    } catch {
      /* clipboard unavailable */
    }
  };

  if (!path) {
    return (
      <div className="flex h-full flex-col items-center justify-center bg-base text-center">
        <FileCode2 size={26} className="text-ink-faint" />
        <p className="mt-3 text-[13px] text-ink-faint">
          Select a file to view its source
        </p>
        {streaming && (
          <p className="mono mt-1 text-[11px] text-signal-dim">
            agent is writing files…
          </p>
        )}
      </div>
    );
  }

  const code = content ?? "";
  const loading = content == null;

  return (
    <div className="flex h-full flex-col bg-base">
      <div className="flex h-9 shrink-0 items-center justify-between border-b border-line bg-panel px-3">
        <span className="mono truncate text-[12px] text-ink-dim">{path}</span>
        <button
          onClick={copy}
          className="flex items-center gap-1.5 text-[11px] text-ink-faint transition hover:text-ink"
        >
          {copied ? (
            <>
              <Check size={12} className="text-signal" /> copied
            </>
          ) : (
            <>
              <Clipboard size={12} /> copy
            </>
          )}
        </button>
      </div>

      <div className="relative flex-1 overflow-auto">
        {loading ? (
          <p className="mono p-4 text-[12px] text-ink-faint">loading…</p>
        ) : (
          <Highlight theme={theme} code={code} language={langOf(path)}>
            {({ className, style, tokens, getLineProps, getTokenProps }) => (
              <pre
                className={`${className} mono p-4 text-[12.5px] leading-[1.65]`}
                style={{ ...style, background: "transparent" }}
              >
                {tokens.map((line, i) => {
                  const lineProps = getLineProps({ line });
                  return (
                    <div
                      key={i}
                      {...lineProps}
                      className={`${lineProps.className} table-row`}
                    >
                      <span className="table-cell select-none pr-4 text-right text-ink-faint/50">
                        {i + 1}
                      </span>
                      <span className="table-cell">
                        {line.map((token, key) => (
                          <span key={key} {...getTokenProps({ token })} />
                        ))}
                      </span>
                    </div>
                  );
                })}
              </pre>
            )}
          </Highlight>
        )}
      </div>
    </div>
  );
}
