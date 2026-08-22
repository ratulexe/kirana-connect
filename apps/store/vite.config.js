import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// Store Portal runs on 5174 by convention: 5173 consumer, 5174 store,
// 5175 reserved for the future admin panel, 5000 the shared Express API.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: { port: 5174 },
  preview: { port: 5174 },
});
