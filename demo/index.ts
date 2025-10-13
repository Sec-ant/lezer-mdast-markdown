/// <reference types="vite/client" />

import { EditorState } from "@codemirror/state";
import { EditorView, type ViewUpdate } from "@codemirror/view";
import { vscodeLight } from "@uiw/codemirror-theme-vscode";
import { basicSetup } from "codemirror";
import type {} from "mdast";
import { frontmatterFromMarkdown } from "mdast-util-frontmatter";
import { gfmFromMarkdown } from "mdast-util-gfm";
import { mathFromMarkdown } from "mdast-util-math";
import { frontmatter } from "micromark-extension-frontmatter";
import { gfm } from "micromark-extension-gfm";
import { math } from "micromark-extension-math";
import {
  collectNodeProps,
  createParser,
  markdown,
  metaProp,
  type NodePropMaps,
} from "../src/index";
import initialDoc from "./example.md?raw";

const PARSER_OPTIONS = {
  extensions: [gfm(), frontmatter(["yaml"]), math()],
  mdastExtensions: [
    gfmFromMarkdown(),
    frontmatterFromMarkdown(["yaml"]),
    mathFromMarkdown(),
  ],
  nodeProps: {
    Math: {
      meta: metaProp,
    },
    InlineMath: {},
  },
};

// Create parser with GFM, Frontmatter, and Math support
const parser = createParser(PARSER_OPTIONS);

// Custom props config for math extension (PascalCase keys, Record format)
const customPropsConfig: NodePropMaps = {
  Math: { meta: metaProp },
  InlineMath: {},
};

// Store node positions for interaction
let nodePositions: Array<{ element: HTMLElement; from: number; to: number }> =
  [];
let editorView: EditorView | null = null;
let isTreeClick = false; // Flag to prevent feedback loop

// Update parser info function
function updateParserInfo(view: EditorView) {
  editorView = view;
  const doc = view.state.doc.toString();
  const tree = parser.parse(doc);

  const info = {
    "Document Length": doc.length,
    "Tree Length": tree.length,
    "Top Node": tree.topNode.name,
  };

  // Build tree visualization
  const container = document.createElement("div");
  nodePositions = [];
  let depth = 0;

  tree.iterate({
    enter(node) {
      const line = document.createElement("div");
      line.className = "tree-line";

      // Collect props from the tree node
      let propsStr = "";

      if (node.tree) {
        const props = collectNodeProps(node, customPropsConfig);

        if (Object.keys(props).length > 0) {
          propsStr = ` ${JSON.stringify(props)}`;
        }
      }

      line.textContent = `${"  ".repeat(depth)}${node.type.name} [${node.from}-${node.to}]${propsStr}`;

      // Store position for click handler
      const nodeFrom = node.from;

      // Click to jump to position in editor
      line.onclick = () => {
        if (!editorView) return;

        isTreeClick = true; // Set flag to prevent feedback
        document.querySelectorAll(".tree-line.active").forEach((el) => {
          el.classList.remove("active");
        });
        line.classList.add("active");

        editorView.dispatch({
          selection: { anchor: nodeFrom }, // Just set cursor at start position
          effects: EditorView.scrollIntoView(nodeFrom, { y: "center" }),
        });
        editorView.focus(); // Focus the editor

        // Reset flag after a short delay
        setTimeout(() => {
          isTreeClick = false;
        }, 100);
      };

      container.appendChild(line);
      nodePositions.push({ element: line, from: node.from, to: node.to });
      depth++;
    },
    leave() {
      depth--;
    },
  });

  const infoElement = document.getElementById("info");
  if (infoElement) {
    infoElement.innerHTML = `<div class="info-header">${Object.entries(info)
      .map(([k, v]) => `${k}: ${v}`)
      .join("\n")}\n\nSyntax Tree:</div>`;
    infoElement.appendChild(container);
  }
}

// Create CodeMirror editor with GFM, Frontmatter, and Math support
const startState = EditorState.create({
  doc: initialDoc,
  extensions: [
    basicSetup,
    markdown(PARSER_OPTIONS),
    vscodeLight,
    EditorView.updateListener.of((update: ViewUpdate) => {
      if (update.docChanged) {
        updateParserInfo(update.view);
      }
      // Highlight corresponding tree node when cursor moves
      if (update.selectionSet && !isTreeClick) {
        const pos = update.state.selection.main.head;
        // Find the smallest node containing the cursor
        const node = nodePositions
          .filter((n) => pos >= n.from && pos <= n.to)
          .sort((a, b) => a.to - a.from - (b.to - b.from))[0];
        if (node) {
          document.querySelectorAll(".tree-line.active").forEach((el) => {
            el.classList.remove("active");
          });
          node.element.classList.add("active");
          node.element.scrollIntoView({ block: "center" });
        }
      }
    }),
  ],
});

const editorElement = document.getElementById("editor");
if (!editorElement) {
  throw new Error("Editor element not found");
}

const view = new EditorView({
  state: startState,
  parent: editorElement,
});

// Initial update
updateParserInfo(view);
