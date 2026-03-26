// @ts-check
import { defineConfig } from "astro/config";

import node from "@astrojs/node";

// https://astro.build/config
export default defineConfig({
  output: "server",
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
