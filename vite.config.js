// vite.config.js
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath, URL } from "node:url";

export default defineConfig({
  plugins: [react()],
  base: "./",
  resolve: {
    alias: {
      "@": path.resolve(fileURLToPath(new URL("./", import.meta.url)), "./src"),
      "@components": path.resolve(
        fileURLToPath(new URL("./", import.meta.url)),
        "./src/components",
      ),
      "@pages": path.resolve(
        fileURLToPath(new URL("./", import.meta.url)),
        "./src/pages",
      ),
      "@services": path.resolve(
        fileURLToPath(new URL("./", import.meta.url)),
        "./src/services",
      ),
      "@stores": path.resolve(
        fileURLToPath(new URL("./", import.meta.url)),
        "./src/stores",
      ),
      "@hooks": path.resolve(
        fileURLToPath(new URL("./", import.meta.url)),
        "./src/hooks",
      ),
      "@utils": path.resolve(
        fileURLToPath(new URL("./", import.meta.url)),
        "./src/utils",
      ),
      "@security": path.resolve(
        fileURLToPath(new URL("./", import.meta.url)),
        "./src/security",
      ),
      "@database": path.resolve(
        fileURLToPath(new URL("./", import.meta.url)),
        "./src/database",
      ),
    },
  },
  server: {
    port: 5173,
    strictPort: true,
  },
  build: {
    outDir: "dist",
    sourcemap: true,
  },
});
