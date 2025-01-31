/* eslint-disable @typescript-eslint/consistent-type-imports */
declare module 'worker://*' {
  type Worker = import('worker_threads').Worker;

  const create: () => Worker;
  export default { create };
}