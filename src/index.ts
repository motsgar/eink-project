import 'dotenv/config';
import { createCanvas } from 'canvas';
import { drawCanvas, cleanup, initialize } from './display';

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
        while (true) {
            await drawCanvas(200, 200, canvas).catch((err) => {
                console.error(err);
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
    .catch((err) => {
        console.error('failed to initialize display');
        console.error(err);
    });

process.on('SIGINT', shutdown);
process.on('SIGUSR1', shutdown);
process.on('SIGUSR2', shutdown);
process.on('uncaughtException', shutdown);
