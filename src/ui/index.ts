import 'dotenv/config';
import '../webServer';
// import { draw } from './Draw';

// const main = async (): Promise<void> => {
//     await draw.readyPromise;
//     await draw.drawCurrentView();
//     await draw.changeView(1);
//     await draw.changeView(-2);
// };

if (process.env.DEV === 'true') console.log('Running in dev mode');
// main().catch(console.error);
