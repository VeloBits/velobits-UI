import type { MDXComponents } from 'mdx/types';

/**
 * MDX element overrides. Deliberately thin: the docs are prose, and prose that
 * needs a component per element is a sign the design system should own the
 * pattern instead.
 */
export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    h1: (props) => <h1 className="mt-8 mb-3 text-3xl font-semibold tracking-tight" {...props} />,
    h2: (props) => <h2 className="mt-8 mb-3 text-xl font-semibold" {...props} />,
    h3: (props) => <h3 className="mt-6 mb-2 text-base font-semibold" {...props} />,
    p: (props) => <p className="my-3 leading-7 text-muted-foreground" {...props} />,
    ul: (props) => <ul className="my-3 list-disc space-y-1 ps-6" {...props} />,
    ol: (props) => <ol className="my-3 list-decimal space-y-1 ps-6" {...props} />,
    a: (props) => <a className="text-link underline underline-offset-4" {...props} />,
    code: (props) => (
      <code
        className="rounded-sm border border-border bg-bg2 px-1 py-0.5 font-mono text-[0.85em]"
        {...props}
      />
    ),
    pre: (props) => (
      <pre
        className="my-4 overflow-x-auto rounded-lg border border-border bg-bg2 p-4 text-sm"
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
    td: (props) => <td className="border-b border-border px-3 py-2 align-top" {...props} />,
    ...components,
  };
}
