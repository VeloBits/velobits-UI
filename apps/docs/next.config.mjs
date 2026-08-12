import createMDX from '@next/mdx';

/**
 * ## One build, one origin
 *
 * `ui.velobits.dev` is two things at the same host: the documentation, and the
 * registry the shadcn CLI fetches from `/r/*.json`. `output: 'export'` is what
 * makes that a single artefact — `next build` writes `out/`, and `public/r/*.json`
 * is copied into it verbatim, so the docs and the machine-readable half ship
 * together or not at all. There is no arrangement where one is stale.
 *
 * The workspace packages are shipped as ESM+CJS with `dist/` types, so Next needs
 * no `transpilePackages` entry — but it DOES need them built first, which turbo's
 * `dependsOn: ["^build"]` guarantees.
 *
 * @type {import('next').NextConfig}
 */
const nextConfig = {
  output: 'export',
  pageExtensions: ['ts', 'tsx', 'md', 'mdx'],
  /*
   * `/docs/components/button/` → `out/docs/components/button/index.html` rather
   * than `button.html`. Every static host serves a directory index without
   * configuration; `.html`-suffix resolution is a per-host rewrite rule, which is
   * exactly the kind of thing that works on the CDN it was tested on and 404s on
   * the next one.
   */
  trailingSlash: true,
  /*
   * The default loader needs a server, which a static export does not have.
   * Nothing here is a photograph — the icon is an SVG and the component previews
   * are live DOM — so no optimisation is being given up.
   */
  images: { unoptimized: true },
  /*
   * There is deliberately NO `headers()` block. Next lists it as unsupported
   * under `output: 'export'` and errors on it in dev, so the CORS rule that used
   * to live here now sits in `public/_headers`, copied into `out/` and read by
   * the host.
   *
   * Worth recording, because the comment that used to be here had it backwards:
   * the shadcn CLI is a Node process and CORS never applied to it. The header is
   * for browser-based consumers — v0 and anything else fetching a registry item
   * from a page — which is a real case, just not the one it claimed.
   */
};

export default createMDX({
  options: {
    /*
     * Named as a STRING, not as an imported function reference.
     *
     * Next 16 builds with Turbopack, which serialises loader options to send
     * them across a process boundary. An imported plugin function is not
     * serialisable, and the error points at the loader rather than the plugin:
     * "does not have serializable options". Turbopack resolves string-named
     * plugins itself.
     */
    remarkPlugins: [['remark-gfm', {}]],
    /*
     * Heading ids, so "On this page" has something to link to and a copied
     * deep link survives. Named as a string for the same serialisation reason as
     * the remark plugin above — which is also why the table of contents on a
     * guide page is scanned from the DOM rather than collected by a local remark
     * plugin: Turbopack cannot carry a function across the loader boundary, so
     * "write a tiny plugin that exports the headings" is not available here.
     */
    rehypePlugins: [['rehype-slug', {}]],
  },
})(nextConfig);
