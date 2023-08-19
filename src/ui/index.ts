import { Draw } from './Draw';

const main = async (): Promise<void> => {
    const draw = new Draw();
    await draw.readyPromise;
    await draw.drawView();
    await draw.changeView(1);
};

main().catch(console.error);
