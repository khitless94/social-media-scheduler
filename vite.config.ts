import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    strictPort: true,
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  define: {
    // Ensure production URLs are used in production builds
    __PRODUCTION_URL__: mode === 'production'
      ? '"https://scribe-schedule-labs.vercel.app"'
      : '"http://localhost:8080"',
  },
  build: {
    // Optimize for production
    minify: mode === 'production',
    sourcemap: mode !== 'production',
  },
}));
