# lezer-commonmark

[![npm](https://img.shields.io/npm/v/lezer-commonmark)](https://www.npmjs.com/package/lezer-commonmark) [![npm bundle size](https://img.shields.io/bundlephobia/minzip/lezer-commonmark)](https://www.npmjs.com/package/lezer-commonmark) [![license](https://img.shields.io/npm/l/lezer-commonmark)](./LICENSE)

一个基于 [Lezer](https://lezer.codemirror.net/) + micromark external tokenizer 的 **CommonMark 解析器**（进行中 WIP）。目标：

1. 语义与 micromark 完全一致（块级 + 行内）
2. 通过官方 CommonMark 测试套件
3. 支持增量解析与 CodeMirror 生态集成
4. 提供语法高亮与类型安全的树遍历 API

## Install

```bash
pnpm add lezer-commonmark
```

## Development

这个项目使用 `unplugin-lezer/vite` 来处理语法文件。开发时的常用命令：

```bash
git clone https://github.com/Sec-ant/lezer-commonmark
cd lezer-commonmark
pnpm install

# 开发时生成 grammar 文件（运行测试或脚本前需要）
npm run dev:grammar

# 运行测试
npm test

# 构建（自动处理 grammar）
npm run build

# 清理生成的开发文件
npm run clean:grammar
```

更多构建说明请参考 [GRAMMAR_BUILD.md](./GRAMMAR_BUILD.md)。

## Features

- CommonMark 块级元素：段落、标题、分隔线、引用、代码块、列表（进行中）
- 行内元素：强调、链接、图片、代码片段、自动链接（逐步实现）
- 与 micromark 同步的 external tokenizer 映射；无重复实现状态机
- 增量解析（Lezer LR） + 可扩展（后续 GFM 扩展）

## Usage

### Basic

```ts
import { parser } from "lezer-commonmark";

const tree = parser.parse(`# Hello\n\nSome *text*.`);
console.log(tree.toString());
```

### With CodeMirror

```ts
import { parser } from "lezer-commonmark";
import { LRLanguage } from "@codemirror/language";

export const commonmarkLanguage = LRLanguage.define({
  parser,
  languageData: { name: "markdown" },
});
```

### Tree Navigation

```ts
import { parser, headingLine, paragraphText } from "lezer-commonmark";

const tree = parser.parse(`# Title\n\nParagraph`);
tree.iterate({
  enter(node) {
    if (node.type.id === headingLine) {
      console.log("Heading span:", node.from, node.to);
    }
    if (node.type.id === paragraphText) {
      console.log("Paragraph:", node.from, node.to);
    }
  },
});
```

### Error Handling

```ts
import { parser } from "lezer-commonmark";

const tree = parser.parse("> quote\n\n---");
tree.iterate({
  enter(n) {
    if (n.type.isError) console.warn("Error span", n.from, n.to);
  },
});
```

## API

### Exports

- `parser` - Lezer parser 实例
- Grammar terms - 语法节点 / token 的常量（TypeScript id）
  - （后续）高亮与 GFM 扩展将追加导出

### Types

```ts
parser.parse(input: string, fragments?: TreeFragment[], ranges?: {from: number, to: number}[]): Tree
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. 添加或调整 CommonMark fixture（放入 `tests/fixtures/`）
4. Ensure tests pass
5. Submit a pull request

## License

MIT
