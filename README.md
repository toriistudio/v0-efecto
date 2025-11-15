# 🎨 V0 Efecto

An interactive React Three Fiber (R3F) component with postprocessing effects. Built from [efecto.app](https://efecto.app/).

Built on top of [`@react-three/fiber`](https://github.com/pmndrs/react-three-fiber) and [`@react-three/drei`](https://github.com/pmndrs/drei), it provides a minimal setup for rendering your components inside a `Canvas` with live controls.

---

## ✅ Features

- 🖼️ Simple wrapper for `react-three-fiber` canvas
- 🎛️ Live-editable props with `useControls`
- 🧩 Fully typed, headless playground architecture
- ⚡️ Works great for prototyping 3D components in isolation

## 📦 Peer Dependencies

To use `@toriistudio/v0-efecto`, install the following:

```bash
yarn add @radix-ui/react-label @radix-ui/react-select @radix-ui/react-slider @radix-ui/react-slot @radix-ui/react-switch class-variance-authority clsx lucide-react tailwind-merge tailwindcss-animate @react-three/drei @react-three/fiber three lodash
```

Or automate it with:

```json
"scripts": {
  "install:peers": "npm install $(node -p \"Object.keys(require('./package.json').peerDependencies).join(' ')\")"
}
```

## 🚀 Installation

Install the package and its peer dependencies:

```bash
npm install @toriistudio/v0-efecto
# or
yarn add @toriistudio/v0-efecto
```

## 🧩 Tailwind Setup

Make sure your `tailwind.config.ts` includes the preset and relevant content paths:

```ts
import preset from "@toriistudio/v0-efecto/preset";

export default {
  presets: [preset],
  content: [
    "./src/**/*.{ts,tsx}",
    "./node_modules/@toriistudio/**/*.{js,ts,jsx,tsx}", // 👈 Required
  ],
};
```

## 🧪 Usage

`PlaygroundCanvas` wraps the playground with a react-three-fiber canvas. Pass any `Canvas` props through `mediaProps`:

```ts
import { PlaygroundCanvas } from "@toriistudio/v0-efecto";

function MyScene() {
  return (
    <mesh>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="hotpink" />
    </mesh>
  );
}

export default function App() {
  return (
    <PlaygroundCanvas>
      <MyScene />
    </PlaygroundCanvas>
  );
}
```

See [`examples/r3f-canvas`](./examples/r3f-canvas) for a full working example.

## 💡 Example Use Cases

- Build interactive 3D sandboxes
- Share React Three Fiber component demos
- Prototype 3D interfaces quickly
- Debug and test scene variants visually

## 📄 License

MIT

## 🤝 Contributing

We welcome contributions!

If you'd like to improve the playground, add new features, or fix bugs:

1. **Fork** this repository
2. **Clone** your fork: `git clone https://github.com/your-username/v0-efecto`
3. **Install** dependencies: `yarn` or `npm install`
4. Make your changes in a branch: `git checkout -b my-new-feature`
5. **Push** your branch and open a pull request

Before submitting a PR:

- Run `yarn build` to ensure everything compiles
- Make sure the playground runs without errors (`yalc push` or `npm link` for local testing)
- Keep the code style clean and consistent

We’re excited to see what you’ll build 🎨🚀
