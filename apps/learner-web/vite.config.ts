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
    VitePWA({
      // Custom service worker: same-origin GET only, atomic install, owned-cache cleanup.
      strategies: "injectManifest",
      srcDir: "src/sw",
      filename: "sw.ts",
      // App.tsx owns registration/update prompting; avoid a second injected registrar.
      injectRegister: false,
      registerType: "prompt",
      injectManifest: {
        globPatterns: ["**/*.{js,css,html,svg,json,webmanifest}"],
        maximumFileSizeToCacheInBytes: 2 * 1024 * 1024,
      },
      manifest: {
        name: "MediPrompt",
        short_name: "MediPrompt",
        description:
          "Privacy-first speaking-practice tool for medical students. First playable (v0.2).",
        start_url: `${base}`,
        scope: `${base}`,
        display: "standalone",
        background_color: "#F4EFE6",
        theme_color: "#14524D",
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
});
