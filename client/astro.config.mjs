// @ts-check
import { defineConfig } from "astro/config";

import node from "@astrojs/node";

// https://astro.build/config
export default defineConfig({
  output: "server",
  image: {
    // Allow the image service to optimise remote images from the backend
    remotePatterns: [{ protocol: "https" }],
  },
  adapter: node({
    mode: "standalone",
  }),
  experimental: {
    clientPrerender: true,
  },
  vite: {
    resolve: {
      alias: {
        "@layouts": "/src/layouts",
        "@components": "/src/components",
        "@lib": "/src/lib",
      },
    },
  },
});
