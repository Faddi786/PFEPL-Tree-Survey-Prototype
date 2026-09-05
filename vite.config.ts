import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // Cloudflare quick tunnels (*.trycloudflare.com)
    allowedHosts: [".trycloudflare.com"],
  },
});
