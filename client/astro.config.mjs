// @ts-check
import { defineConfig } from 'astro/config';
import bun from 'astro-bun';

// https://astro.build/config
export default defineConfig({
  output: 'server',
  adapter: bun(),
});
