import { build } from 'esbuild';

build({
    bundle: true,
    entryPoints: ['./src/ui/index.ts'],
    format: 'cjs',
    minify: true,
    outdir: './dist',
    packages: 'external',
    platform: 'node',
    sourcemap: true,
}).catch(() => process.exit(1));
