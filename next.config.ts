import type { NextConfig } from "next";

// Static export for GitHub Pages. The site is served from
// https://<user>.github.io/groundwork/, so production assets and routes
// need the /groundwork base path. Local `next dev` keeps the bare root.
const isProd = process.env.NODE_ENV === "production";
const repo = "groundwork";

const basePath = isProd ? `/${repo}` : "";

const nextConfig: NextConfig = {
  output: "export",
  basePath,
  // Exposed to the client so the PWA wiring (manifest link, apple-touch icon,
  // service-worker registration + scope) targets the right prefix in both
  // `next dev` (bare root) and the GitHub Pages deploy (/groundwork).
  env: { NEXT_PUBLIC_BASE_PATH: basePath },
  // Emit a folder-with-index.html per route so GitHub Pages resolves
  // /categories/algorithms/sliding-window/ reliably.
  trailingSlash: true,
  images: { unoptimized: true },
  turbopack: {
    rules: {
      "*.py": {
        loaders: ["raw-loader"],
        as: "*.js",
      },
    },
  },
};

export default nextConfig;
