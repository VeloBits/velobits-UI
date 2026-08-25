---
'@velobitsio/ui': minor
---

`CommandDialog` now forwards cmdk's root props to the palette it renders, plus
four warnings for traps that were real and undocumented.

```tsx
// Neither of these reached the palette before.
<CommandDialog open={open} onOpenChange={setOpen} filter={scoreBySlug} />
<CommandDialog open={open} onOpenChange={setOpen} shouldFilter={false} />
```

`CommandDialog` renders two roots — Radix's `Dialog.Root` and cmdk's `Command` —
and only one of them could take the rest spread. It took the dialog, so a cmdk
prop landed on `Dialog.Root`, which destructures six props and drops the rest:
no throw, no warning, and a custom `filter` that never runs. Written as a
literal it was a type error rather than a silent no-op, so what this fixes is
both the missing capability and the quiet failure for JavaScript consumers,
spread-widened call sites, and values widened to `string`.

`filter`, `shouldFilter`, `value`, `onValueChange`, `defaultValue`, `loop`,
`disablePointerSelection`, `vimBindings` and `label` are now named on
`CommandDialogProps` and routed to the palette. A test compares that list
against cmdk's root declaration as a **set**, so an added root prop in a future
cmdk fails by name instead of silently landing on the dialog. `asChild` is
cmdk's tenth root prop and is deliberately not routed. Additive — no call site
changes.

**Four documented traps**, each now also asserted by a test rather than only
described:

- **`Spinner` inside a control needs `label={null}`.** The default `label` is an
  `aria-label`, and an `aria-label` on a child is concatenated into the
  accessible name of the control containing it, so `<Button><Spinner />Saving…`
  announces as "Loading Saving…" — leading with the least useful word and
  restating what the visible label already says. Nothing catches it: it renders
  correctly and axe has no rule against a `status` inside a `button`. The three
  examples in the docs that had this bug are fixed.
- **`Button` defaults to `secondary`, not `primary`.** Deliberate, and the
  opposite of shadcn/ui, whose default variant is named `default`. The trap is
  sharper than it looks: **cva does not fall back to `defaultVariants` for an
  unrecognised value**, only for `undefined`. So `variant="default"` emits no
  fill and no border at all — a transparent button — and `size="default"` emits
  no height or padding. TypeScript rejects the literal; a widened `string` gets
  through in silence.
- **`--primary` is not a text colour**, said where a consumer will actually read
  it: the dark half of `tokens.css` had no warning, and the `--color-primary`
  shadcn bridge — the line that makes `text-primary` a real utility — had none
  beside it. The `velobits-theme` item also claimed blanket contrast
  verification without saying `--primary` is gated as a **fill**. The figure
  quoted since launch was stale in twelve files: it is 3.86:1 on the page, not
  3.90:1, and 4.01:1 in dark, so the rule holds in both themes. On a non-text
  graphic `--primary` remains legitimate — 1.4.11 asks 3:1 of an icon.
- **`StatusChip` uppercases a `children` override too.** `Rolling out` paints as
  `ROLLING OUT`. Easy to miss because the override was designed for a
  percentage, and digits cannot reveal a text-transform.
  `className="normal-case"` is the escape.

Finally, the `@velobitsio/ui/form` subpath — the one component with no route
into the barrel, and so the one with no second chance if its entry breaks — is
now exercised by a consumer suite that resolves it through the published
`exports` map and renders a real form against the built artifact. `apps/docs`
also declares `react-hook-form` instead of relying on hoisting.
