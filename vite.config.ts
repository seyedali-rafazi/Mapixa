import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import dts from "vite-plugin-dts";
import path from "path";

export default defineConfig(({ mode }) => {
  const isLib = mode !== "demo";

  return {
    plugins: [
      react(),
      isLib &&
        dts({
          insertTypesEntry: true,
          include: ["src/lib"],
          outDir: "dist",
        }),
    ].filter(Boolean),
    build: isLib
      ? {
          lib: {
            entry: path.resolve(__dirname, "src/lib/index.ts"),
            name: "Mapixa",
            formats: ["es", "cjs"],
            fileName: (format) =>
              format === "es" ? "index.js" : "index.cjs",
          },
          rollupOptions: {
            // Externalize peer dependencies so they aren't bundled into the library
            external: [
              "react",
              "react-dom",
              "react/jsx-runtime",
              "maplibre-gl",
            ],
            output: {
              exports: "named",
              globals: {
                react: "React",
                "react-dom": "ReactDOM",
                "react/jsx-runtime": "jsxRuntime",
                "maplibre-gl": "maplibregl",
              },
              assetFileNames: (assetInfo) => {
                if (assetInfo.name?.endsWith(".css")) return "mapixa.css";
                return assetInfo.name || "asset";
              },
            },
          },
          sourcemap: true,
          emptyOutDir: true,
        }
      : {
          outDir: "dist-demo",
        },
  };
});
