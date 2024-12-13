import { createCanvas } from 'canvas';

import { cleanup, drawCanvas, initialize } from './display';

import 'dotenv/config';

const canvas = createCanvas(1000, 800);
const ctx = canvas.getContext('2d');

let number = 0;
// Write "Awesome!"
ctx.fillStyle = 'gray';
ctx.fillRect(0, 0, 1000, 800);
ctx.fillStyle = 'black';
ctx.font = '100px Impact';
ctx.rotate(0.1);
ctx.fillText('Awesome! ' + number, 50, 100);

const shutdown = async (): Promise<void> => {
    console.log('\nShutting down');

    await cleanup();

    console.log('Exiting');
    process.exit();
};

initialize()
    .then(async () => {
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        while (true) {
            await drawCanvas(200, 200, canvas).catch((error) => {
                console.error(error);
            });
            console.log('draw done');
            number++;
            ctx.fillStyle = 'gray';
            ctx.fillRect(0, 0, 1000, 800);
            ctx.fillStyle = 'black';
            ctx.fillText('Awesomeaa! ' + number, 50, 100);
            await new Promise((resolve) => setTimeout(resolve, 1000));
        }
    })
    .catch((error) => {
        console.error('failed to initialize display');
        console.error(error);
    });

process.on('SIGINT', () => {
    shutdown().catch(console.error);
});
process.on('SIGUSR1', () => {
    shutdown().catch(console.error);
});
process.on('SIGUSR2', () => {
    shutdown().catch(console.error);
});
process.on('uncaughtException', () => {
    shutdown().catch(console.error);
});
