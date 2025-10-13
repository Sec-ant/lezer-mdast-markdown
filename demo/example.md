---
title: Markdown Demo
description: Comprehensive example showcasing CommonMark and GFM features
author: lezer-mdast-markdown
tags: [markdown, parser, demo]
---

# lezer-mdast-markdown Demo

A **Markdown** parser for [Lezer](https://lezer.codemirror.net/) leveraging the mdast ecosystem.

## CommonMark Features

### Emphasis and Strong

This text has _emphasis_ and **strong emphasis**, as well as **_both_**.

You can also use _underscores_ for emphasis and **double underscores** for strong.

### Code

Inline code: `const x = 42;`

Code block with language:

```javascript
function greet(name) {
  return `Hello, ${name}!`;
}
```

### Lists

Unordered list:

- First item
- Second item
  - Nested item
  - Another nested

Ordered list starting at 5:

5. Fifth item
6. Sixth item
7. Seventh item

### Links and Images

[Link with title](https://example.com "Example Domain")

![Alt text](https://via.placeholder.com/150 "Image title")

Reference-style link: [reference][ref]

[ref]: https://example.com "Reference Link"

### Blockquotes

> This is a blockquote.
>
> It can span multiple paragraphs.

### Headings

# Heading 1

## Heading 2

### Heading 3

#### Heading 4

##### Heading 5

###### Heading 6

### Horizontal Rule

---

### HTML

<div>
  <p>Raw HTML is supported</p>
</div>

## GFM Features

### Autolink Literals

www.example.com, https://example.com, and contact@example.com.

### Footnote

A note[^1] with footnote reference.

[^1]: Big note with detailed explanation.

### Strikethrough

~one~ or ~~two~~ tildes for strikethrough.

### Table

| Feature    | Status | Priority | Notes               |
| ---------- | :----: | -------: | :------------------ |
| CommonMark |   ✓    |     High | Full compliance     |
| GFM        |   ✓    |     High | Tables, tasks, etc  |
| Props      |   ✓    |   Medium | Preserve attributes |

### Task List

- [ ] Todo item
- [x] Completed item
- [ ] Another todo
  - [x] Nested completed
  - [ ] Nested todo

## Math (Extension)

Math support is provided as an extension using `micromark-extension-math`.

### Inline Math

The quadratic formula is $x = \frac{-b \pm \sqrt{b^2 - 4ac}}{2a}$ and Euler's identity is $e^{i\pi} + 1 = 0$.

You can also use multiple dollars: $$E = mc^2$$ for inline math.

### Block Math

The Pythagorean theorem:

$$
a^2 + b^2 = c^2
$$

Maxwell's equations:

$$
\nabla \times \vec{\mathbf{B}} -\, \frac1c\, \frac{\partial\vec{\mathbf{E}}}{\partial t} = \frac{4\pi}{c}\vec{\mathbf{j}}
$$

---

_This sample demonstrates property preservation: headings have depth, code blocks have languages, lists have start numbers, and more._
