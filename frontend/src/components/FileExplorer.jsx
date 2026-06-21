import { useMemo, useState } from "react";
import {
  ChevronRight,
  FileCode2,
  FileJson,
  FileText,
  FileType2,
  Folder,
  FolderOpen,
  RefreshCw,
} from "lucide-react";
import { buildTree } from "../lib/fileTree.js";

function iconFor(name) {
  const ext = name.split(".").pop()?.toLowerCase();
  if (["jsx", "tsx", "js", "ts", "mjs", "cjs"].includes(ext)) return FileCode2;
  if (ext === "json") return FileJson;
  if (["css", "scss"].includes(ext)) return FileType2;
  return FileText;
}

export default function FileExplorer({ files, openFile, onSelect, busy }) {
  const tree = useMemo(() => buildTree(files), [files]);

  return (
    <div className="flex h-full flex-col bg-panel">
      <div className="flex h-9 shrink-0 items-center justify-between border-b border-line px-3">
        <span className="label">Files</span>
        <span className="flex items-center gap-2">
          <span className="mono text-[10px] text-ink-faint">{files.length}</span>
          {busy && <RefreshCw size={11} className="fg-spin text-signal" />}
        </span>
      </div>
      <div className="flex-1 overflow-y-auto py-2">
        {tree.length === 0 ? (
          <p className="px-3 text-[12px] text-ink-faint">No files yet…</p>
        ) : (
          tree.map((node) => (
            <Node
              key={node.path}
              node={node}
              depth={0}
              openFile={openFile}
              onSelect={onSelect}
            />
          ))
        )}
      </div>
    </div>
  );
}

function Node({ node, depth, openFile, onSelect }) {
  const [open, setOpen] = useState(depth < 1);
  const pad = { paddingLeft: `${depth * 12 + 10}px` };

  if (node.type === "dir") {
    return (
      <div>
        <button
          onClick={() => setOpen((o) => !o)}
          style={pad}
          className="flex w-full items-center gap-1.5 py-1 pr-2 text-left text-[12.5px] text-ink-dim transition hover:bg-raised hover:text-ink"
        >
          <ChevronRight
            size={12}
            className={`shrink-0 transition-transform ${open ? "rotate-90" : ""}`}
          />
          {open ? (
            <FolderOpen size={13} className="shrink-0 text-ink-faint" />
          ) : (
            <Folder size={13} className="shrink-0 text-ink-faint" />
          )}
          <span className="truncate">{node.name}</span>
        </button>
        {open &&
          node.children.map((child) => (
            <Node
              key={child.path}
              node={child}
              depth={depth + 1}
              openFile={openFile}
              onSelect={onSelect}
            />
          ))}
      </div>
    );
  }

  const Icon = iconFor(node.name);
  const active = openFile === node.path;
  return (
    <button
      onClick={() => onSelect(node.path)}
      style={pad}
      className={`group flex w-full items-center gap-1.5 py-1 pr-2 text-left text-[12.5px] transition ${
        active
          ? "bg-signal/10 text-ink"
          : "text-ink-dim hover:bg-raised hover:text-ink"
      }`}
    >
      <span className="w-3 shrink-0" />
      <Icon
        size={13}
        className={`shrink-0 ${active ? "text-signal" : "text-ink-faint"}`}
      />
      <span className="truncate">{node.name}</span>
      {active && (
        <span className="ml-auto h-1.5 w-1.5 shrink-0 rounded-full bg-signal" />
      )}
    </button>
  );
}
