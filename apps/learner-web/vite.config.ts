import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import { resolve } from "node:path";

// GitHub Pages serves this app at /MediPrompt/, not /. The base path must match
// the deployment subpath so generated asset URLs, the manifest, and the service
// worker scope resolve correctly. Override with VITE_BASE_PATH for other hosts.
const base = process.env.VITE_BASE_PATH ?? "/MediPrompt/";

export default defineConfig({
  base,
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
      "@content": resolve(__dirname, "../../content"),
    },
  },
  plugins: [
    react(),
    {
      name: "development-style-csp",
      apply: "serve",
      transformIndexHtml(html) {
        // Vite injects imported CSS as <style> during local development. Relax
        // style-src only for the dev server; production emits an external CSS
        // asset and validate-build.mjs continues to reject unsafe-inline.
        return html.replace(
          "style-src 'self';",
          "style-src 'self' 'unsafe-inline';",
        );
      },
    },
    {
      name: "strip-duplicate-ort-wasm",
      apply: "build",
      enforce: "post",
      generateBundle(_, bundle) {
        // @huggingface/transformers references the ORT wasm via a bundled URL,
        // so Rollup emits a hashed copy into assets/. We override
        // env.backends.onnx.wasm.wasmPaths to models/ort/ (copied from
        // node_modules by copy:model-runtime) before any pipeline is created,
        // so the bundled copy is never fetched — drop it to avoid shipping
        // the same 21 MB twice.
        for (const [name, chunk] of Object.entries(bundle)) {
          if (chunk.type === "asset" && /ort-wasm.*\.wasm$/.test(name)) {
            delete bundle[name];
          }
        }
      },
    },
    VitePWA({
      // Custom service worker: same-origin GET only, atomic install, owned-cache cleanup.
      strategies: "injectManifest",
      srcDir: "src/sw",
      filename: "sw.ts",
      // App.tsx owns registration/update prompting; avoid a second injected registrar.
      injectRegister: false,
      registerType: "prompt",
      injectManifest: {
        globPatterns: ["**/*.{js,css,html,svg,json,webmanifest,woff2}"],
        maximumFileSizeToCacheInBytes: 2 * 1024 * 1024,
      },
      manifest: {
        name: "MediPrompt",
        short_name: "MediPrompt",
        description:
          "Privacy-first speaking-practice tool for medical students.",
        start_url: `${base}`,
        scope: `${base}`,
        display: "standalone",
        background_color: "#07171a",
        theme_color: "#07171a",
        icons: [
          {
            src: `${base}icon.svg`,
            sizes: "any",
            type: "image/svg+xml",
            purpose: "any",
          },
        ],
      },
      devOptions: { enabled: false },
    }),
  ],
  build: {
    target: "es2022",
    sourcemap: false,
  },
  worker: {
    // The transcription worker is created with { type: "module" } and must ship
    // as an ES module; same-origin output keeps worker-src 'self' intact.
    format: "es",
  },
});
