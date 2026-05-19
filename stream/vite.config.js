import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const securityHeaders = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "SAMEORIGIN",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=()",
};

export default defineConfig({
  plugins: [react()],
  resolve: {
    // Force one React module graph to avoid duplicate hook contexts during HMR/prebundle.
    alias: {
      react: path.resolve(__dirname, "node_modules/react"),
      "react-dom": path.resolve(__dirname, "node_modules/react-dom"),
    },
    dedupe: ["react", "react-dom", "react-router", "react-router-dom"],
  },
  server: {
    host: "localhost",
    port: 3000,
    strictPort: false,
    open: false,
    headers: securityHeaders,
  },
  preview: {
    host: "localhost",
    port: 3000,
    strictPort: false,
    headers: securityHeaders,
  },
  build: {
    outDir: "dist",
    sourcemap: false,
    minify: "terser",
  },
});
