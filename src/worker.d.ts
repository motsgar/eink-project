declare module 'worker://*' {
    // Todo-soon: Check if we could not do this
    // oxlint-disable-next-line typescript/consistent-type-imports
    type Worker = import('worker_threads').Worker;

    const create: () => Worker;
    // oxlint-disable-next-line import/no-anonymous-default-export
    export default { create };
}
