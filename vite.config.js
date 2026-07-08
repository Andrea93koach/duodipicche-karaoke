import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// GitHub Pages project site: served from https://<user>.github.io/duodipicche-karaoke/
export default defineConfig({
  plugins: [react()],
  base: "/duodipicche-karaoke/",
});
