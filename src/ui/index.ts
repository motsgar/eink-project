import { resolveBinaryPath } from '@/utils';
import '../webServer';
import { draw } from './Draw';

export const initUiModules = async (): Promise<void> => {
    const path = await resolveBinaryPath('convert');
    console.debug(path);
    await draw.readyPromise;
};
