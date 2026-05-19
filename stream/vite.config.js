import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const securityHeaders = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "SAMEORIGIN",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=()",
};

export default defineConfig({
  plugins: [react()],
  server: {
    host: "0.0.0.0",
    port: 3000,
    strictPort: true,
    open: true,
    headers: securityHeaders,
  },
  preview: {
    host: "0.0.0.0",
    port: 3000,
    strictPort: true,
    headers: securityHeaders,
  },
  build: {
    outDir: "dist",
    sourcemap: false,
  },
});
