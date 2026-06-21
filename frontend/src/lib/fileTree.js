/**
 * Turn a flat list of relative paths into a nested folder/file tree.
 *
 * Input:  ["src/App.jsx", "src/lib/api.js", "index.html"]
 * Output: sorted tree of { name, path, type: "dir"|"file", children? }
 */
export function buildTree(paths) {
  const root = { name: "", path: "", type: "dir", children: new Map() };

  for (const raw of paths) {
    const parts = raw.split("/").filter(Boolean);
    let node = root;
    let acc = "";

    parts.forEach((part, i) => {
      acc = acc ? `${acc}/${part}` : part;
      const isFile = i === parts.length - 1;

      if (!node.children.has(part)) {
        node.children.set(part, {
          name: part,
          path: acc,
          type: isFile ? "file" : "dir",
          children: isFile ? null : new Map(),
        });
      }
      node = node.children.get(part);
    });
  }

  return finalize(root).children;
}

function finalize(node) {
  if (node.type === "file") return node;

  const children = [...node.children.values()].map(finalize).sort((a, b) => {
    // directories first, then alphabetical
    if (a.type !== b.type) return a.type === "dir" ? -1 : 1;
    return a.name.localeCompare(b.name);
  });

  return { ...node, children };
}

/** File-extension → short language tag for the highlighter + UI. */
export function langOf(path = "") {
  const ext = path.split(".").pop()?.toLowerCase();
  switch (ext) {
    case "jsx":
    case "js":
    case "mjs":
    case "cjs":
      return "jsx";
    case "ts":
    case "tsx":
      return "tsx";
    case "css":
      return "css";
    case "html":
      return "markup";
    case "json":
      return "json";
    case "md":
      return "markdown";
    default:
      return "jsx";
  }
}
