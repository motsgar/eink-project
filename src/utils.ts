import type { Result } from 'neverthrow';

import { err, ok } from 'neverthrow';
import fs from 'node:fs/promises';
import { z } from 'zod';

import { env } from './env'; // oxlint-disable-line import/no-cycle

/**
 * A typeguarded version of `instanceof Error` for NodeJS.
 *
 * @author Joseph JDBar Barron
 * @link https://dev.to/jdbar
 */
// oxlint-disable-next-line typescript/no-explicit-any
export const instanceOfNodeError = <T extends new (...args: any[]) => Error>(
    value: unknown,
    errorType?: T,
): value is InstanceType<T> & NodeJS.ErrnoException => {
    if (errorType === undefined) return value instanceof Error;
    return value instanceof errorType;
};

export const errorToString = (error: unknown): string => (instanceOfNodeError(error) ? error.message : String(error));

const resolvedPaths = new Map<string, string>();

export const getResolvedPath = (command: string): string => {
    const path = resolvedPaths.get(command);
    if (path !== undefined) return path;
    throw new Error(`Path for command ${command} has not been resolved`);
};

export const resolveBinaryPath = async (command: string): Promise<string> => {
    let eaccessHappened = false;

    const directories = env.path.split(':');
    for (const directory of directories) {
        if (directory === '') continue;

        const fullPath = `${directory}/${command}`;
        try {
            const stats = await fs.stat(fullPath);
            if (!stats.isFile()) continue;

            await fs.access(fullPath, fs.constants.X_OK);

            resolvedPaths.set(command, fullPath);
            return fullPath;
        } catch (error) {
            if (!instanceOfNodeError(error)) {
                console.error(`Unknown error while resolving binary path:\n${errorToString(error)}`);
                throw error;
            }
            // Shouldn't happen?
            if (error.code === undefined) throw error;

            // oxlint-disable eslint/no-fallthrough
            // These have been taken from glibc execvp
            switch (error.code) {
                case 'EACCESS':
                    eaccessHappened = true;
                case 'ENOENT':
                case 'ESTALE':
                case 'ENOTDIR':
                case 'ENODEV':
                case 'ETIMEDOUT':
                    continue;
                default:
                    // Unknown error happened in checking the file for execution
                    throw error;
            }
            // oxlint-enable eslint/no-fallthrough
        }
    }
    if (eaccessHappened) throw new Error(`Eaccess finding executable ${command}`);
    throw new Error(`Executable binary ${command} not found`);
};

// A crude way to check if running on a raspberry pi
export const isRunningOnPi = async (): Promise<Result<boolean, string>> => {
    let cpuInfo: string;
    try {
        cpuInfo = await fs.readFile('/proc/cpuinfo', 'utf8');
    } catch (error) {
        return err(`Error reading /proc/cpuinfo to know if running on raspberry pi:\n${errorToString(error)}`);
    }

    return ok(cpuInfo.includes('Raspberry Pi'));
};

export const dateSchema = z.codec(z.iso.datetime({ offset: true }), z.date(), {
    decode: (isoString) => new Date(isoString), // ISO string → Date
    encode: (date) => date.toISOString(), // Date → ISO string
});
