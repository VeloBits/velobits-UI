import type { MDXComponents } from 'mdx/types';

import { MdxToc } from '@/components/mdx-toc';

/**
 * MDX element overrides, plus the shell every guide page sits in.
 *
 * Deliberately thin on the element side: the guides are prose, and prose that
 * needs a component per element is a sign the design system should own the
 * pattern instead. The `wrapper` is the exception and does real work — it is
 * what gives every `.mdx` file under `app/docs/` the same two-column shell as the
 * component pages without each one importing a layout.
 */
export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    wrapper: ({ children }) => (
      <div className="xl:grid xl:grid-cols-[minmax(0,1fr)_14rem] xl:gap-10">
        <main id="main" className="min-w-0 max-w-3xl py-8 pb-24">
          {children}
        </main>
        <aside className="hidden xl:sticky xl:top-14 xl:block xl:h-[calc(100dvh-3.5rem)] xl:overflow-y-auto xl:py-8">
          <MdxToc />
        </aside>
      </div>
    ),
    h1: (props) => <h1 className="mt-2 mb-3 text-3xl font-semibold tracking-tight" {...props} />,
    // `scroll-mt-24` clears the sticky header when a jump link lands, and matches
    // the fold line `DocsToc` uses to decide which entry is current.
    h2: (props) => (
      <h2
        className="mt-10 mb-3 scroll-mt-24 border-b border-border pb-2 text-xl font-semibold"
        {...props}
      />
    ),
    h3: (props) => <h3 className="mt-8 mb-2 scroll-mt-24 text-base font-semibold" {...props} />,
    p: (props) => <p className="my-3 leading-7 text-muted-foreground" {...props} />,
    ul: (props) => (
      <ul className="my-3 list-disc space-y-1 ps-6 text-muted-foreground" {...props} />
    ),
    ol: (props) => (
      <ol className="my-3 list-decimal space-y-1 ps-6 text-muted-foreground" {...props} />
    ),
    a: (props) => <a className="text-link underline underline-offset-4" {...props} />,
    strong: (props) => <strong className="font-semibold text-fg" {...props} />,
    blockquote: (props) => (
      <blockquote
        className="my-4 border-s-2 border-border ps-4 text-muted-foreground italic"
        {...props}
      />
    ),
    code: (props) => (
      <code
        className="rounded-sm border border-border bg-bg2 px-1 py-0.5 font-mono text-[0.85em]"
        {...props}
      />
    ),
    pre: (props) => (
      <pre
        // Focusable because it scrolls: code does not wrap, so this is a scroll
        // container by construction, and one a keyboard user cannot reach is 2.1.1.
        tabIndex={0}
        className="my-4 overflow-x-auto rounded-lg border border-border bg-bg2 p-4 text-sm [&_code]:border-0 [&_code]:bg-transparent [&_code]:p-0"
        {...props}
      />
    ),
    table: (props) => (
      <div className="my-4 overflow-x-auto">
        <table className="w-full border-collapse text-sm" {...props} />
      </div>
    ),
    th: (props) => (
      <th className="border-b border-border px-3 py-2 text-start font-semibold" {...props} />
    ),
    td: (props) => (
      <td className="border-b border-border px-3 py-2 align-top text-muted-foreground" {...props} />
    ),
    ...components,
  };
}
