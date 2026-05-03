import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "https://bazm-e-paigham-fsd.onrender.com",
        changeOrigin: true
      }
    }
  }
});
