import { sveltekit } from "@sveltejs/kit/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig, searchForWorkspaceRoot } from "vite";

export default defineConfig({
  plugins: [tailwindcss(), sveltekit()],
  server: {
    port: 5173,
    fs: {
      allow: [searchForWorkspaceRoot(process.cwd())],
    },
    proxy: {
      "/api": {
        target: "http://localhost:8080",
        changeOrigin: true,
      },
    },
  },
});
