import { defineConfig } from "vitest/config"; import path from "node:path";
export default defineConfig({ test: { environment: "node", testTimeout: 30000, hookTimeout: 60000, include: ["tests/unit/**/*.test.ts", "tests/integration/**/*.test.ts"] }, resolve: { alias: { "@": path.resolve(__dirname, ".") } } });
