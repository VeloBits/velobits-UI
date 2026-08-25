---
'@velobitsio/ui': minor
---

`CodeBlock` can now show the same code in several languages, chosen from a
dropdown, and the language set is open for consumers to extend.

Pass `variants` , either `{ ts: '…', js: '…' }` or an array carrying
pre-highlighted `html` , and the block grows a language `<select>`. **The first
variant is the default**, so a block keeps the language it was written in without
anyone declaring that anywhere. One variant renders no control at all, and a block
with no `variants` is byte-identical to before, down to the class string.

The languages themselves are data. `CODE_LANGUAGES` ships TypeScript, JavaScript,
CSS, JSON, Bash, HTML and Markdown; `registerCodeLanguages` adds any others, each
with its own `label`, `shortLabel`, `accent` (any CSS colour, painted on the
control) and `className`. Registering a language does not conjure code in it , a
block offers a language only when it was given a variant for that language, which
is what stops a selector offering Vue and then showing React.

Every switch is reported as `onLanguageChange(language, { blockId })`, in
controlled **and** uncontrolled mode. That pairing is deliberate: a page holds many
blocks, so a bare `(language)` callback cannot be reduced into anything, and firing
in both modes means a consumer can mirror the value into a store today and adopt
`selectedLanguage` later without converting the call site first.

A dropdown rather than a segmented row because the language set is open-ended: a
segmented control spends horizontal space per option, so it is comfortable at two
languages and eats the code's first line at four. It is the system's own
`NativeSelect`, which also means the platform supplies the keyboard, mobile gets
the OS picker, and an `<option>`'s text can simply be "TypeScript" , the segmented
version had to show "TS" with the full word appended in an `sr-only` span to keep
the accessible name containing the visible text (WCAG 2.5.3).

`code-block` therefore gains `native-select` as a registry dependency, and ships a
second file, `lib/code-languages.ts`.
