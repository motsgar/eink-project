import 'dotenv/config';
import '../webServer';
import { resolveBinaryPath } from '@/utils';
// import { draw } from './Draw';

// const main = async (): Promise<void> => {
//     await draw.readyPromise;
//     await draw.drawCurrentView();
//     await draw.changeView(1);
//     await draw.changeView(-2);
// };

resolveBinaryPath('convert').then((path) => {
    console.log('convert path:', path);
}).catch(console.error);

if (process.env.DEV === 'true') console.log('Running in dev mode');
// main().catch(console.error);
