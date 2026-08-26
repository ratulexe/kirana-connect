import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// Portal runs on 5176 by convention: 5173 consumer, 5174 store, 5175 admin,
// 5176 portal, 5000 the shared Express API.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  // strictPort: fail loudly if 5176 is occupied rather than silently moving
  // to another port and quietly breaking the documented local URLs.
  server: { port: 5176, strictPort: true },
  preview: { port: 5176, strictPort: true },
});
