import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      // `server-only` throws outside a React Server environment; tests run
      // server modules directly, so replace it with an empty module.
      "server-only": fileURLToPath(new URL("./src/test/empty-module.ts", import.meta.url)),
    },
  },
  test: {
    globals: true,
    environment: "node",
    include: ["src/**/*.test.{ts,tsx}"],
    setupFiles: ["./src/test/setup.ts"],
    restoreMocks: true,
  },
});
