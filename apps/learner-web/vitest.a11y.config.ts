import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { resolve } from "node:path";

// a11y smoke tests live in files named `*.a11y.test.tsx` and run under jsdom.
// Real 200% zoom and screen-reader verification is a manual v0.7 audit.
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
      "@content": resolve(__dirname, "../../content"),
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.a11y.test.tsx"],
  },
});
