import { build } from 'esbuild';

build({
    entryPoints: ['./src/ui/index.ts'],
    outdir: './dist',
    minify: true,
    bundle: true,
    platform: 'node',
    format: 'esm',
    sourcemap: true,
    packages: 'external',
}).catch(() => process.exit(1));
