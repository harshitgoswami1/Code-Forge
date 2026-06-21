import { ExternalLink, Globe, RotateCw } from "lucide-react";

export default function PreviewPane({ previewUrl, nonce, onReload, streaming }) {
  return (
    <div className="flex h-full flex-col bg-base">
      <div className="flex h-9 shrink-0 items-center gap-2 border-b border-line bg-panel px-3">
        <span className="flex items-center gap-1.5 text-ink-faint">
          <Globe size={13} />
        </span>
        <div className="flex min-w-0 flex-1 items-center rounded-md border border-line bg-base px-2.5 py-1">
          <span className="mono truncate text-[11px] text-ink-dim">
            {previewUrl}
          </span>
        </div>
        <button
          onClick={onReload}
          title="Reload preview"
          className="flex h-6 w-6 items-center justify-center rounded-md text-ink-faint transition hover:bg-raised hover:text-ink"
        >
          <RotateCw size={13} />
        </button>
        <a
          href={previewUrl}
          target="_blank"
          rel="noreferrer"
          title="Open in new tab"
          className="flex h-6 w-6 items-center justify-center rounded-md text-ink-faint transition hover:bg-raised hover:text-ink"
        >
          <ExternalLink size={13} />
        </a>
      </div>

      <div className="relative flex-1 bg-white">
        {streaming && (
          <div className="absolute left-0 right-0 top-0 z-10 h-0.5 overflow-hidden">
            <div className="h-full w-1/3 bg-signal" style={{ animation: "fg-sweep 1.1s ease-in-out infinite" }} />
          </div>
        )}
        <iframe
          key={nonce}
          src={previewUrl}
          title="Live preview"
          className="h-full w-full border-0"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
        />
      </div>
    </div>
  );
}
