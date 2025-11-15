import { defineConfig } from "tsup";

export default defineConfig([
  {
    entry: {
      index: "src/index.ts",
    },
    format: ["esm", "cjs"],
    dts: true,
    clean: true,
    target: "esnext",
    external: [
      "react",
      "react-dom",
      "@react-three/fiber",
      "@react-three/drei",
      "three",
      "three-stdlib",
      "react/jsx-runtime",
      "react/jsx-dev-runtime",
    ],
  },
  {
    entry: {
      preset: "src/preset.ts",
    },
    format: ["esm", "cjs"],
    dts: true,
    clean: false,
    target: "esnext",
    external: [
      "react",
      "react-dom",
      "@react-three/fiber",
      "@react-three/drei",
      "three",
      "three-stdlib",
      "react/jsx-runtime",
      "react/jsx-dev-runtime",
    ],
  },
]);
