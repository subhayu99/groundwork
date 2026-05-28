import type { NextConfig } from "next";

// Static export for GitHub Pages. The site is served from
// https://<user>.github.io/groundwork/, so production assets and routes
// need the /groundwork base path. Local `next dev` keeps the bare root.
const isProd = process.env.NODE_ENV === "production";
const repo = "groundwork";

const nextConfig: NextConfig = {
  output: "export",
  basePath: isProd ? `/${repo}` : "",
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
