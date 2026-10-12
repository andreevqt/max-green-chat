import path from "node:path";
import { fileURLToPath, URL } from "node:url";

const sourceRoot = fileURLToPath(new URL("../../src", import.meta.url));
const layers = ["app", "pages", "widgets", "features", "entities", "shared"];

function describeFile(filename) {
  const parts = path.relative(sourceRoot, filename).split(path.sep);
  const layer = parts[0];
  const rank = layers.indexOf(layer);
  const slice =
    layer === "app" || layer === "shared" ? layer : `${layer}/${parts[1]}`;
  return { parts, layer, rank, slice };
}

function isPublicEntry({ parts, layer }) {
  const withoutExtension = parts.map((part) =>
    part.replace(/\.[cm]?[jt]sx?$/, ""),
  );
  if (layer === "shared") {
    // Small libraries are single-file APIs such as shared/lib/date.ts.
    const depth = parts[1] === "lib" ? 3 : 2;
    return (
      parts.length <= depth ||
      (parts.length === depth + 1 && withoutExtension.at(-1) === "index")
    );
  }
  return (
    parts.length === 2 ||
    (parts.length === 3 && withoutExtension[2] === "index")
  );
}

export default {
  meta: { name: "fsd-boundaries" },
  rules: {
    imports: {
      meta: {
        type: "problem",
        schema: [],
        messages: {
          layer:
            "FSD: {{from}} cannot import {{to}}. Depend only on lower layers or the current slice.",
          publicApi:
            "FSD: access {{slice}} through its public API, not internal files.",
          alias: "FSD: use @/ aliases for imports across slices.",
          relative:
            "FSD: use relative imports inside the current slice to avoid public API cycles.",
          outside:
            "FSD: application modules must remain inside src's FSD layers.",
        },
      },
      create(context) {
        const filename = context.filename;
        const current = describeFile(filename);
        function check(node) {
          const value = node.source?.value;
          if (
            typeof value !== "string" ||
            (!value.startsWith("@/") && !value.startsWith("."))
          )
            return;
          const target = describeFile(
            value.startsWith("@/")
              ? path.resolve(sourceRoot, value.slice(2))
              : path.resolve(path.dirname(filename), value),
          );
          const report = (messageId, data = {}) =>
            context.report({ node: node.source, messageId, data });
          if (target.rank < 0) return report("outside");
          if (current.slice === target.slice) {
            if (
              value.startsWith("@/") &&
              current.layer !== "shared" &&
              current.layer !== "app"
            )
              report("relative");
            return;
          }
          if (target.rank <= current.rank)
            return report("layer", { from: current.slice, to: target.slice });
          if (!value.startsWith("@/")) return report("alias");
          if (!isPublicEntry(target))
            report("publicApi", { slice: target.slice });
        }
        return {
          ImportDeclaration: check,
          ExportNamedDeclaration: check,
          ExportAllDeclaration: check,
          ImportExpression: check,
        };
      },
    },
  },
};
