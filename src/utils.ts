import fs from 'node:fs/promises';
import { z } from 'zod';

// TODO: Resolve cycle if possible
// oxlint-disable-next-line import/no-cycle
import { env } from './env';

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
    if (errorType === undefined) {
        return value instanceof Error;
    }
    return value instanceof errorType;
};

const resolvedPaths = new Map<string, string>();

export const getResolvedPath = (command: string): string => {
    const path = resolvedPaths.get(command);
    if (path !== undefined) {
        return path;
    }
    throw new Error('Path for command ' + command + ' has not been resolved');
};

export const resolveBinaryPath = async (command: string): Promise<string> => {
    let eaccessHappened = false;

    const directories = env.PATH.split(':');
    for (const directory of directories) {
        if (directory === '') continue;

        const fullPath = `${directory}/${command}`;
        try {
            // oxlint-disable-next-line no-await-in-loop
            const stats = await fs.stat(fullPath);
            if (!stats.isFile()) {
                continue;
            }

            // oxlint-disable-next-line no-await-in-loop
            await fs.access(fullPath, fs.constants.X_OK);

            resolvedPaths.set(command, fullPath);
            return fullPath;
        } catch (error) {
            if (instanceOfNodeError(error)) {
                if (error.code === undefined) {
                    throw error;
                }

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
    }
    if (eaccessHappened) {
        throw new Error('Eaccess finding executable ' + command);
    }
    throw new Error('Executable binary ' + command + ' not found');
};

// A crude way to check if running on a raspberry pi
export const runningOnPi = async (): Promise<boolean> => {
    let cpuInfo: string;
    try {
        cpuInfo = await fs.readFile('/proc/cpuinfo', 'utf8');
    } catch (error) {
        console.error('Error reading /proc/cpuinfo to know if running on raspberry pi:', error);
        return false;
    }

    return cpuInfo.includes('Raspberry Pi');
};

export const dateSchema = z.codec(z.iso.datetime({ offset: true }), z.date(), {
    decode: (isoString) => new Date(isoString), // ISO string → Date
    encode: (date) => date.toISOString(), // Date → ISO string
});
