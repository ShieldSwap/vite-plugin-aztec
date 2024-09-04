# Vite plugin for Aztec

Makes "@aztec/aztec.js" work with Vite.

## Installation

```sh
npm install @shieldswap/vite-plugin-aztec -D
```

## Usage

```ts
import { aztec } from "@shieldswap/vite-plugin-aztec";

export default defineConfig({
  plugins: [aztec()],
});
```
