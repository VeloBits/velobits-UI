import createMDX from '@next/mdx';

/** @type {import('next').NextConfig} */
const nextConfig = {
  pageExtensions: ['ts', 'tsx', 'md', 'mdx'],
  // The workspace packages are shipped as ESM+CJS with `dist/` types, so Next
  // needs no transpilePackages entry — but it DOES need them built first, which
  // turbo's `dependsOn: ["^build"]` guarantees.
  outputFileTracingRoot: new URL('../../', import.meta.url).pathname,
  async headers() {
    return [
      {
        // The shadcn CLI fetches these cross-origin from a consumer's machine.
        source: '/r/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Cache-Control', value: 'public, max-age=0, must-revalidate' },
        ],
      },
    ];
  },
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
  },
})(nextConfig);
