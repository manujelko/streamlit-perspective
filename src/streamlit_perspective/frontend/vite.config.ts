import process from "node:process";
import { defineConfig, UserConfig } from "vite";

export default defineConfig(() => {
  const isProd = process.env.NODE_ENV === "production";
  const isDev = !isProd;

  return {
    base: "./",
    define: {
      "process.env.NODE_ENV": JSON.stringify(process.env.NODE_ENV),
    },
    build: {
      target: "esnext",
      minify: isDev ? false : "esbuild",
      outDir: "build",
      sourcemap: isDev,
      lib: {
        entry: "./src/index.ts",
        name: "StreamlitPerspective",
        formats: ["es"],
        fileName: "index-[hash]",
      },
      ...(!isDev && {
        esbuild: {
          drop: ["console", "debugger"],
          minifyIdentifiers: true,
          minifySyntax: true,
          minifyWhitespace: true,
        },
      }),
    },
  } satisfies UserConfig;
});
