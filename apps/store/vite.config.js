import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// Store Portal runs on 5174 by convention: 5173 consumer, 5174 store,
// 5175 reserved for the future admin panel, 5000 the shared Express API.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  // strictPort matters: VITE_AUTH_REDIRECT_URL points Supabase at 5174, so a
  // silent fallback to 5175 would send every confirmation link to whatever
  // else is on 5174. Fail loudly instead.
  server: { port: 5174, strictPort: true },
  preview: { port: 5174, strictPort: true },
});
