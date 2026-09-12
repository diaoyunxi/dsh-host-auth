import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: ['src/index.ts', 'src/client.ts', 'src/invariant.ts'],
  format: ['esm'],
  platform: 'node',
  target: 'node22',
  outDir: 'lib',
  dts: true,
  sourcemap: true,
})
