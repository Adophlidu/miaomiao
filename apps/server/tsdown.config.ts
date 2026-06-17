import { defineConfig } from "tsdown";

export default defineConfig({
  entry: "./src/index.ts",
  format: "esm",
  platform: "node",
  outDir: "./dist",
  clean: true,
  // Bundle ALL deps so dist/index.mjs is self-contained (deployable with just
  // `node index.mjs`, no node_modules). node: builtins stay external (platform: node).
  noExternal: [/.*/],
});
