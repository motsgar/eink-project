import { build, buildSync } from 'esbuild';
import path from 'node:path';

const commonConfig = {
    bundle: true,
    entryPoints: ['./src/index.ts'],
    format: 'cjs',
    minify: true,
    outdir: './dist',
    packages: 'external',
    platform: 'node',
    sourcemap: true,
};

const workerSourcePlugin = {
    name: 'worker-source-plugin',
    /** @param {import('esbuild').PluginBuild} buildConfig */
    setup: (buildConfig) => {
        buildConfig.onResolve({ filter: /^worker:\/\//u }, (args) => {
            const workerPath = args.path.replace('worker://', '');
            const fullPath = path.resolve(args.resolveDir, workerPath);
            return { namespace: 'worker-source', path: fullPath };
        });

        buildConfig.onLoad({ filter: /.*/u, namespace: 'worker-source' }, (args) => {
            const bundledWorker = buildSync({
                ...commonConfig,
                entryPoints: [args.path],
                sourcemap: false, // Running a worker through eval doesn't support sourcemaps
                // TODO make this automatically split the bundle to multiple files where eacho worker
                // is in its own file that can be imported regularly
                write: false,
            });
            const bundledWorkerCode = bundledWorker.outputFiles[0].text;
            return {
                contents: `import { Worker } from 'worker_threads';
                           const workerCode = ${JSON.stringify(bundledWorkerCode)};
                           export default {
                               create: () => {
                                   return new Worker(workerCode, { eval: true });
                               },
                           };`,
                loader: 'js',
            };
        });
    },
};

build({
    ...commonConfig,
    plugins: [workerSourcePlugin],
}).catch(() => process.exit(1));
