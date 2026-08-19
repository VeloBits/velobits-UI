# skills/

The agent-facing half of the documentation. One directory per skill, in the
Anthropic skill format: a `SKILL.md` with YAML frontmatter, plus `references/`
files it points at for the detail.

```
skills/velobits-ui/
├── SKILL.md                       the entry point, read first, always loaded
└── references/
    ├── frameworks.md              per-framework setup
    ├── shadcn-registry.md         the CLI and the registry
    ├── npm-packages.md            the three packages
    └── design-rules.md            tokens, glass, contrast, motion
```

## Why here and not in `.claude/skills/`

`.gitignore` ignores `.claude*`, so a skill authored there would not be committed.
This is the source; `.claude/skills/velobits-ui/` is where it lands in a
**consumer's** repo.

## How it ships

`scripts/build-docs-data.ts` does two things with this tree on every docs build:

1. Copies it into `apps/docs/public/skills/`, so the docs origin serves the files
   directly at `https://ui.velobits.dev/skills/velobits-ui/SKILL.md`, which is what
   the `curl` install and any agent with web access reads.
2. Compiles it into `apps/docs/public/r/skill.json`, a `registry:file` item whose
   targets are `.claude/skills/velobits-ui/…`, so
   `npx shadcn@latest add https://ui.velobits.dev/r/skill.json` installs it into a
   project.

It also fails the build if `SKILL.md` links a reference file that does not exist, or
if a reference file exists that `SKILL.md` never points at. A skill whose pointers
dangle sends an agent to invent the answer instead, which is worse than not shipping
one.

The compiled item is deliberately **not** in `registry/registry.ts`: it is not a
component, it has no source file in `registry/velobits/`, and every item in that
list gets a documentation page and a place in the sidebar. `/docs/skill` is its page
instead.

## Editing it

Same rules as the docs prose, and one more: this is read by a model with no
conversation to ask questions in, so prefer the imperative, name the symptom next to
every rule, and keep `SKILL.md` short enough to be worth loading in full. Detail goes
in a reference file.
