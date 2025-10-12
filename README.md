# lezer-markdown

A Markdown parser for [Lezer](https://lezer.codemirror.net/), designed for [CodeMirror 6](https://codemirror.net/6/).

## Overview

This parser provides Markdown support for CodeMirror 6, implementing the CommonMark and GitHub Flavored Markdown (GFM) specifications. It leverages [mdast-util-from-markdown](https://github.com/syntax-tree/mdast-util-from-markdown) for parsing and converts the resulting [MDAST](https://github.com/syntax-tree/mdast) (Markdown Abstract Syntax Tree) to Lezer's tree format. This approach ensures 100% specification compliance while maintaining compatibility with the Lezer parsing system.

## Key Features

- **Full Specification Compliance**: Passes all [CommonMark specification](https://spec.commonmark.org/) tests
- **GFM Support**: Built-in support for GitHub Flavored Markdown extensions (tables, strikethrough, task lists, autolinks)
- **Property Preservation**: MDAST node attributes (heading levels, code languages, link URLs, etc.) are preserved as Lezer NodeProps
- **Extensible**: Clean API for adding support for custom Markdown extensions (directives, MDX, etc.)
- **Type Safe**: Full TypeScript support with proper type inference

## Installation

```bash
npm install lezer-markdown
```

## Basic Usage

### As CodeMirror 6 Language

```typescript
import { markdown } from "lezer-markdown";
import { EditorView, basicSetup } from "codemirror";

const view = new EditorView({
  extensions: [basicSetup, markdown()],
  parent: document.body,
});
```

### Direct Parser Usage

```typescript
import { parser } from "lezer-markdown";

const tree = parser.parse("# Hello World\n\nThis is **bold** text.");
console.log(tree.toString());
```

## Property Preservation

MDAST node attributes are preserved as Lezer NodeProps and can be accessed programmatically:

````typescript
import { parser, depthProp, langProp } from "lezer-markdown";

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

The parser can be extended to support custom Markdown syntax through the mdast extension ecosystem:

```typescript
import { createParser } from "lezer-markdown";
import type { NodePropMaps } from "lezer-markdown";
import { NodeProp } from "@lezer/common";
import { directive } from "micromark-extension-directive";
import { directiveFromMarkdown } from "mdast-util-directive";

// Define custom properties
const directiveNameProp = new NodeProp<string>({ perNode: true });

// Create extended parser with custom property mappings
const parser = createParser({
  extensions: [directive()],
  mdastExtensions: [directiveFromMarkdown()],
  customMaps: {
    TextDirective: {
      name: directiveNameProp,
    },
  } satisfies NodePropMaps,
});

// Parse directive syntax
const tree = parser.parse(":emoji[😊]");
```

### Built-in Extensions

#### YAML Frontmatter

The parser includes built-in support for YAML frontmatter (commonly used in static site generators):

```typescript
import { createParser } from "lezer-markdown";
import { frontmatter } from "micromark-extension-frontmatter";
import { frontmatterFromMarkdown } from "mdast-util-frontmatter";

const parser = createParser({
  extensions: [frontmatter(["yaml"])],
  mdastExtensions: [frontmatterFromMarkdown(["yaml"])],
});

const tree = parser.parse(`---
title: My Document
author: John Doe
---

# Content here`);
```

#### Math Extensions

Math support (inline: `$...$`, block: `$$...$$`) can be added as an extension:

```typescript
import { createParser, metaProp } from "lezer-markdown";
import type { NodePropMaps } from "lezer-markdown";
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

// Parse math syntax
const tree = parser.parse(`Inline: $E = mc^2$

Block:
$$
\\int_{-\\infty}^{\\infty} e^{-x^2} dx = \\sqrt{\\pi}
$$`);
```

**Note**: Math extensions require additional packages:

```bash
npm install micromark-extension-math mdast-util-math
```

The test suite includes 32 math test cases extracted from micromark-extension-math.

## Architecture

### Design Philosophy

This parser takes a different approach from traditional Lezer parsers:

1. **Parse with mdast-util-from-markdown**: Use the well-tested, spec-compliant mdast parser
2. **Transform to Lezer Tree**: Convert the MDAST to Lezer's tree structure
3. **Preserve Semantics**: Maintain node attributes as Lezer NodeProps

This design prioritizes correctness and maintainability over incremental parsing performance. For typical document editing scenarios, the performance is sufficient and the benefits of guaranteed spec compliance outweigh the trade-offs.

### Why Not Pure Lezer Grammar?

Writing a complete, correct Markdown parser (especially one that fully implements CommonMark and GFM specifications) using Lezer's grammar system is extremely challenging due to:

- Complex context-dependent parsing rules (e.g., list item parsing)
- Precedence and delimiter matching (emphasis, links)
- HTML block detection rules
- Line-ending normalization

By leveraging the mdast ecosystem, we get:

- Proven correctness (100% spec compliance)
- Compatibility with the rich mdast plugin ecosystem
- Easier maintenance and updates

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

Creates a CodeMirror 6 language extension with Markdown support (CommonMark + GFM).

**Parameters:**

- `config`: Optional parser configuration

**Returns:** `LanguageSupport`

### `parser`

Default parser instance with Markdown support (CommonMark + GFM specifications).

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
