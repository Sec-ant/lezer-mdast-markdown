# lezer-mdast-markdown

A Markdown parser for [Lezer](https://lezer.codemirror.net/), designed for [CodeMirror 6](https://codemirror.net/6/).

## Overview

This parser bridges Markdown editing in CodeMirror 6 with the rich [mdast](https://github.com/syntax-tree/mdast) (Markdown Abstract Syntax Tree) ecosystem. By leveraging [mdast-util-from-markdown](https://github.com/syntax-tree/mdast-util-from-markdown) for parsing and converting the result to Lezer's tree format, it enables consistent tooling across editing, rendering, and linting workflows.

**Key motivation**: Reuse existing mdast plugins instead of reimplementing the same functionality for different Markdown representations. This means editors, static site generators, and linters can share the same extension ecosystem, providing a unified experience when working with Markdown.

The default parser supports CommonMark only. Additional syntax (GFM, frontmatter, math, directives, etc.) can be added through micromark and mdast extensions.

> **Note**: If you need an incremental parser with better performance characteristics, consider using [@lezer/markdown](https://github.com/lezer-parser/markdown) and [@codemirror/lang-markdown](https://github.com/codemirror/lang-markdown) instead. This project prioritizes mdast ecosystem integration over incremental parsing performance.

## Key Features

- **CommonMark Compliance**: Passes all 652 [CommonMark specification](https://spec.commonmark.org/) tests
- **Extensible**: Support for GFM, YAML frontmatter, math, and other mdast extensions
- **Property Preservation**: MDAST node attributes (heading levels, code languages, link URLs, etc.) are preserved as Lezer NodeProps
- **Type Safe**: Full TypeScript support with proper type inference
- **Ecosystem Integration**: Works with the rich mdast plugin ecosystem

## Installation

```bash
npm install lezer-mdast-markdown
```

## Basic Usage

### As CodeMirror 6 Language

The default setup provides CommonMark support:

```typescript
import { markdown } from "lezer-mdast-markdown";
import { EditorView, basicSetup } from "codemirror";

const view = new EditorView({
  extensions: [basicSetup, markdown()],
  parent: document.body,
});
```

For GFM support, pass the extensions:

```typescript
import { markdown } from "lezer-mdast-markdown";
import { gfm } from "micromark-extension-gfm";
import { gfmFromMarkdown } from "mdast-util-gfm";
import { EditorView, basicSetup } from "codemirror";

const view = new EditorView({
  extensions: [
    basicSetup,
    markdown({
      extensions: [gfm()],
      mdastExtensions: [gfmFromMarkdown()],
    }),
  ],
  parent: document.body,
});
```

### Direct Parser Usage

```typescript
import { parser } from "lezer-mdast-markdown";

const tree = parser.parse("# Hello World\n\nThis is **bold** text.");
console.log(tree.toString());
```

## Property Preservation

MDAST node attributes are preserved as Lezer NodeProps and can be accessed programmatically:

````typescript
import { parser, depthProp, langProp } from "lezer-mdast-markdown";

const tree = parser.parse("# Heading\n\n```js\ncode\n```");

tree.iterate({
  enter(node) {
    // Access heading depth
    if (node.name === "Heading") {
      const depth = node.tree?.prop(depthProp);
      console.log("Heading level:", depth); // 1
    }

    // Access code block language
    if (node.name === "Code") {
      const lang = node.tree?.prop(langProp);
      console.log("Language:", lang); // 'js'
    }
  },
});
````

### Available Properties

All properties are exported as NodeProp instances and can be reused in custom extensions:

- `depthProp`: Heading level (1-6)
- `langProp`: Code block language
- `metaProp`: Code block metadata
- `orderedProp`: List ordered state
- `startProp`: List start number
- `spreadProp`: List/item spread status
- `checkedProp`: Task list item checked state (GFM)
- `alignProp`: Table column alignments (GFM)
- `urlProp`: Link/image URL
- `titleProp`: Link/image title
- `identifierProp`: Link/image reference identifier
- `labelProp`: Link/image reference label

## Extension Support

The default parser supports **CommonMark specification only**. Additional Markdown syntax can be added through the mdast extension ecosystem.

Extensions fall into two categories based on whether you need to define custom node properties:

### Extensions with Pre-defined Node Types

These extensions have node types and properties already defined in this package (matching the mdast specification). You only need to load the micromark extensions.

#### GitHub Flavored Markdown (GFM)

The most commonly used extension. Adds tables, strikethrough, task lists, and autolinks:

```typescript
import { createParser } from "lezer-mdast-markdown";
import { gfm } from "micromark-extension-gfm";
import { gfmFromMarkdown } from "mdast-util-gfm";

const parser = createParser({
  extensions: [gfm()],
  mdastExtensions: [gfmFromMarkdown()],
});

// Parse GFM syntax
const tree = parser.parse(`
| Column 1 | Column 2 |
| -------- | -------- |
| Cell 1   | Cell 2   |

- [x] Task 1
- [ ] Task 2

~~strikethrough~~
`);
```

**Install GFM packages:**

```bash
npm install micromark-extension-gfm mdast-util-gfm
```

#### YAML Frontmatter

Commonly used in static site generators:

```typescript
import { createParser } from "lezer-mdast-markdown";
import { frontmatter } from "micromark-extension-frontmatter";
import { frontmatterFromMarkdown } from "mdast-util-frontmatter";

const parser = createParser({
  extensions: [frontmatter(["yaml"])],
  mdastExtensions: [frontmatterFromMarkdown(["yaml"])],
});

const tree = parser.parse(`---
title: My Document
---

# Content`);
```

### Extensions Requiring Custom Node Properties

For extensions not covered by mdast's standard types, you need to define custom node properties using `customMaps`:

#### Math Extension Example

```typescript
import { createParser, metaProp } from "lezer-mdast-markdown";
import type { NodePropMaps } from "lezer-mdast-markdown";
import { math } from "micromark-extension-math";
import { mathFromMarkdown } from "mdast-util-math";

const parser = createParser({
  extensions: [math()],
  mdastExtensions: [mathFromMarkdown()],
  customMaps: {
    // Reuse built-in metaProp for block math
    Math: { meta: metaProp },
    InlineMath: {},
  } satisfies NodePropMaps,
});

const tree = parser.parse(`Inline: $E = mc^2$

Block:
$$
\\int_{-\\infty}^{\\infty} e^{-x^2} dx = \\sqrt{\\pi}
$$`);
```

**Install math packages:**

```bash
npm install micromark-extension-math mdast-util-math
```

#### Directive Extension Example

```typescript
import { createParser } from "lezer-mdast-markdown";
import type { NodePropMaps } from "lezer-mdast-markdown";
import { NodeProp } from "@lezer/common";
import { directive } from "micromark-extension-directive";
import { directiveFromMarkdown } from "mdast-util-directive";

// Define custom properties for directive nodes
const directiveNameProp = new NodeProp<string>({ perNode: true });

const parser = createParser({
  extensions: [directive()],
  mdastExtensions: [directiveFromMarkdown()],
  customMaps: {
    TextDirective: {
      name: directiveNameProp,
    },
  } satisfies NodePropMaps,
});

const tree = parser.parse(":emoji[😊]");
```

**Install directive packages:**

```bash
npm install micromark-extension-directive mdast-util-directive
```

## Architecture

### Design Philosophy

This parser bridges Markdown editing with the mdast ecosystem:

1. **Parse with mdast-util-from-markdown**: Use the well-tested, spec-compliant mdast parser
2. **Transform to Lezer Tree**: Convert the MDAST to Lezer's tree structure
3. **Preserve Semantics**: Maintain node attributes as Lezer NodeProps

By leveraging the mdast ecosystem, we get:

- **Plugin Reusability**: Same extensions work across editors, renderers, and linters
- **Proven Correctness**: 100% CommonMark spec compliance
- **Unified Experience**: Consistent tooling for editing, rendering, and linting workflows
- **Rich Ecosystem**: Access to the extensive collection of mdast and micromark plugins
- **Easier Maintenance**: Updates and bug fixes come from upstream mdast packages

This design prioritizes specification compliance and ecosystem integration. For typical document editing scenarios, the performance is sufficient and the benefits of unified tooling outweigh the trade-offs.

## Testing

The parser is tested against:

- 652 CommonMark specification examples
- GitHub Flavored Markdown extensions (tables, strikethrough, task lists, autolinks)
- YAML frontmatter support
- Math extensions (inline and block)
- Property preservation
- Extension API

Total: 743 passing tests

## API Reference

### `markdown(config?)`

Creates a CodeMirror 6 language extension with CommonMark support. Pass `config` with extensions for GFM or other syntax.

**Parameters:**

- `config`: Optional parser configuration (same as `createParser` options)

**Returns:** `LanguageSupport`

### `parser`

Default parser instance with CommonMark support only.

### `createParser(options)`

Creates a custom parser instance with extended functionality.

**Options:**

- `extensions`: micromark syntax extensions
- `mdastExtensions`: mdast conversion extensions
- `customMaps`: Custom node property mappings (type: `NodePropMaps`)

### `collectProps(node, customMaps?)`

Collects properties from an MDAST node based on built-in and optional custom property mappings.

**Parameters:**

- `node`: MDAST node
- `customMaps`: Optional custom property mappings

**Returns:** Record of property values

### `collectNodeProps(node, customMaps?)`

Collects properties from a Lezer tree cursor node.

**Parameters:**

- `node`: Object with `type` (NodeType) and `tree` (Tree)
- `customMaps`: Optional custom property mappings

**Returns:** Record of property values

## Performance Considerations

This parser is optimized for correctness rather than incremental parsing. For most documents (< 10,000 lines), parsing performance is imperceptible. For very large documents, consider:

- Splitting into multiple files
- Using virtual scrolling for rendering
- Implementing custom caching strategies

## Contributing

Contributions are welcome! Please ensure:

- All tests pass (`pnpm test`)
- Code follows the existing style (`pnpm check`)
- TypeScript types are properly maintained

## License

MIT

## Related Projects

- [CodeMirror 6](https://codemirror.net/6/) - The extensible code editor
- [Lezer](https://lezer.codemirror.net/) - Incremental parser system
- [mdast](https://github.com/syntax-tree/mdast) - Markdown Abstract Syntax Tree
- [micromark](https://github.com/micromark/micromark) - CommonMark-compliant markdown parser
