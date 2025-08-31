**CRITICAL - Before ending your turn**

[ENFORCED - HIGHEST PRIORITY]

AUTONOMOUS CONTINUATION RULES:

1. Do not stop and do not ask the user whether to continue after completing a single sub-step or checkpoint.
2. After updating or displaying the todo list, IMMEDIATELY proceed to the next actionable todo item and attempt it. Displaying the todo list is a progress log, not a decision point.
3. Only pause and explicitly ask the user for direction when you encounter a real BLOCKER. A BLOCKER is defined as one of:
   - You require user credentials, secrets, or permissions that you do not possess.
   - The next action would have irreversible side-effects or could cause data loss without explicit user consent.
   - The available information and tools cannot resolve an ambiguity and a user decision is required to proceed.
4. If paused for a BLOCKER, state succinctly:
   - What is blocked and why;
   - Exactly what information, permission, or choice you need from the user;
   - Two concise next-action options the user can pick from.
5. For multi-step tasks, if a todo item is large, split it into sub-steps and continue executing sub-steps without asking for confirmation after each sub-step.
6. Maintain brief progress narration: after each sub-step, give one short sentence of progress and then continue to the next sub-step. Do not end your turn with an open-ended "Shall I continue?" or similar prompts unless blocked.
7. Treat "displaying the updated todo list" as audit information only; do not use it as a cue to yield control.
8. In all cases, prioritize completing the user's original intent autonomously and only yield when a BLOCKER (as above) occurs.

These rules override any softer conversational guidance in this prompt. If any instruction conflicts with these rules, follow these rules.

# Development Guidelines

## Core Principles

- **Incremental progress** - Small changes that compile and pass tests
- **Learn from existing code** - Study patterns before implementing new approaches
- **Clear intent over clever code** - Choose boring, obvious solutions
- **Quality equals functionality** - Code quality is as important as features

## Development Workflow

### When Stuck (Max 3 Attempts)

1. Document what failed and why
2. Research 2-3 similar implementations in codebase
3. Question abstraction level - can this be simpler?
4. Try different angle (library/pattern) or reassess
5. Workaround using simplified assumptions is never the solution.

### Code Standards

- Single responsibility per function/class
- Avoid premature abstractions
- If you need to explain it, it's too complex
- Use existing patterns and libraries when possible

## React Guidelines

**Hook Usage**:

- `useCallback`: Cache functions for child components
- `useMemo`: Cache computed values (derived state)
- Check existing validation/parsing patterns before writing new ones

**Performance**: Consider reference stability for downstream memoization

## Quality Checklist

**Never**:

- Bypass commit hooks (`--no-verify`)
- Disable tests instead of fixing them
- Commit non-compiling code
- Use `any` to bypass TypeScript
- Confuse `useCallback` (functions) and `useMemo` (values)

**Always**:

- Check existing code for similar patterns first
- Commit incrementally with working code
- Clear TypeScript and ESLint errors before completion
- Learn from existing implementations
- Verify with existing code before making assumptions

## Personal Preferences

- Answer and communicate in Chinese, comment in English
- Use exported types over type aliases
- Prefer `interface` over `type` for object shapes
- Avoid primitive wrapper types (`String`, `Number`, `Boolean`) for casting
- Explicit comparisons over implicit checks (e.g., `value !== null` vs `if (value)`)
- Watch for zero-valued enums as they can be falsy
- Check existing alternatives in codebase first
- Prefer `es-toolkit` over `lodash`
- Choose lightweight, actively maintained libraries
- Avoid heavy dependencies despite popularity
- Follow existing patterns and conventions
- Utilize VS Code language server for TypeScript/ESLint checks
- Comments should describe current state and relationships, not historical changes
- One utility function per file, filename matches function name, use named exports, no barrel files
- Don't extract unnecessary utils if logic is already inline elsewhere (increases understanding cost)
- Use existing library functions (`es-toolkit`) instead of creating custom ones for common operations
- When migrating solutions, completely eliminate old approach without adaptation layers
- Solve TypeScript type problems head-on, don't escape or simplify around constraints
- When changing instructions: keep it simple, avoid excessive bullet points and sub-headings, add concise points directly under existing sections
- Fix problems directly instead of working around them, don't be afraid of tackling complexity
