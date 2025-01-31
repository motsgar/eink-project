import fs from 'node:fs/promises';

import { PATH } from './env';

/**
 * A typeguarded version of `instanceof Error` for NodeJS.
 *
 * @author Joseph JDBar Barron
 * @link https://dev.to/jdbar
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
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

    const directories = PATH.split(':');
    for (const directory of directories) {
        if (directory === '') continue;

        const fullPath = `${directory}/${command}`;
        try {
            const stats = await fs.stat(fullPath);
            if (!stats.isFile()) {
                continue;
            }

            await fs.access(fullPath, fs.constants.X_OK);

            resolvedPaths.set(command, fullPath);
            return fullPath;
        } catch (error) {
            if (instanceOfNodeError(error)) {
                if (error.code === undefined) {
                    throw error;
                }

                // These have been taken from glibc execvp
                /* eslint-disable no-fallthrough */
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
                /* eslint-enable no-fallthrough */
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