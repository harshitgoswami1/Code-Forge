import {
  Check,
  FilePlus2,
  FileText,
  FolderTree,
  Loader2,
  PencilLine,
  TriangleAlert,
} from "lucide-react";

const TOOL_META = {
  list_files: { icon: FolderTree, verb: "Scanning project" },
  read_files: { icon: FileText, verb: "Reading files" },
  update_files: { icon: PencilLine, verb: "Editing files" },
  create_file: { icon: FilePlus2, verb: "Creating files" },
  create_files: { icon: FilePlus2, verb: "Creating files" },
};

export default function ActivityFeed({ activity, streaming }) {
  if (activity.length === 0 && !streaming) return null;

  return (
    <div className="border-t border-line bg-void/40 px-4 py-3">
      <div className="mb-2 flex items-center gap-2">
        <span className="label">Agent activity</span>
        {streaming && (
          <span className="h-1.5 w-1.5 rounded-full bg-signal fg-blink" />
        )}
      </div>

      <ol className="space-y-1.5">
        {activity.map((row) => {
          const meta = TOOL_META[row.tool] || {
            icon: FileText,
            verb: row.tool,
          };
          const Icon = meta.icon;
          return (
            <li
              key={row.id}
              className="fg-rise flex items-start gap-2.5 text-[12.5px]"
            >
              <StateGlyph state={row.state} Icon={Icon} />
              <span className="min-w-0 flex-1">
                <span className="text-ink">{meta.verb}</span>
                {row.detail && (
                  <span className="mono ml-1.5 truncate text-ink-faint">
                    {row.detail}
                  </span>
                )}
              </span>
            </li>
          );
        })}
        {streaming && activity.every((a) => a.state !== "running") && (
          <li className="flex items-center gap-2.5 text-[12.5px] text-ink-faint">
            <Loader2 size={14} className="fg-spin text-signal" />
            <span className="mono">thinking…</span>
          </li>
        )}
      </ol>
    </div>
  );
}

function StateGlyph({ state, Icon }) {
  if (state === "running")
    return <Loader2 size={14} className="mt-0.5 fg-spin text-signal" />;
  if (state === "error")
    return <TriangleAlert size={14} className="mt-0.5 text-rose" />;
  if (state === "done")
    return (
      <span className="mt-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-signal/15">
        <Check size={10} className="text-signal" strokeWidth={3} />
      </span>
    );
  return <Icon size={14} className="mt-0.5 text-ink-faint" />;
}
