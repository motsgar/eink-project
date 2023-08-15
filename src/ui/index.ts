import { Canvas, createCanvas, loadImage } from 'canvas';
import { createWriteStream } from 'fs';
import { CO2 } from './CO2.js';
import { Status } from './Status.js';
import { Temperature } from './Temperature.js';
import { Weather } from './Weather.js';
import { WeatherGraph } from './WeatherGraph.js';

const config = {
    width: 2,
    height: 3,
    insidePadding: 20,
    roundness: 20,
    outsidePadding: 30,
    fillStyle: '#ffffffdd',
    strokeStyle: '#000000dd',
    backgroundSrc: 'files/wallpapers/wp5-dither.png',
    modules: [
        { drawCanvas: new Status(), x: 0, y: 0, width: 2, height: 1 },
        { drawCanvas: new Temperature(), x: 1, y: 1, width: 1, height: 1 },
        { drawCanvas: new CO2(), x: 1, y: 2, width: 1, height: 1 },
        { drawCanvas: new Weather(), x: 0, y: 1, width: 1, height: 1 },
        { drawCanvas: new WeatherGraph(), x: 0, y: 2, width: 1, height: 1 },
    ],
};

const drawModules = async (width: number, height: number): Promise<Canvas> => {
    const moduleCanvas = createCanvas(width, height);
    const ctx = moduleCanvas.getContext('2d');
    const outsidePadding = config.outsidePadding;
    const insidePadding = config.insidePadding;

    // Draw modules
    const moduleBaseWidth = width / config.width - outsidePadding * 2 - 2 * insidePadding;
    const moduleBaseHeight = height / config.height - outsidePadding * 2 - 2 * insidePadding;
    const moduleBoxBaseWidth = width / config.width - outsidePadding * 2;
    const moduleBoxBaseHeight = height / config.height - outsidePadding * 2;
    const moduleSpaceBetween = 2 * (outsidePadding + insidePadding);
    const moduleBoxSpaceBetween = 2 * outsidePadding;

    for (const module of config.modules) {
        const moduleWidth = module.width * moduleBaseWidth + moduleSpaceBetween * (module.width - 1);
        const moduleHeight = module.height * moduleBaseHeight + moduleSpaceBetween * (module.height - 1);
        const moduleBoxWidth = module.width * moduleBoxBaseWidth + moduleBoxSpaceBetween * (module.width - 1);
        const moduleBoxHeight = module.height * moduleBoxBaseHeight + moduleBoxSpaceBetween * (module.height - 1);

        const canvas = await module.drawCanvas.draw(moduleWidth, moduleHeight);

        const xStart = (width / config.width) * module.x;
        const yStart = (height / config.height) * module.y;
        let xPos = xStart + outsidePadding;
        let yPos = yStart + outsidePadding;
        if (outsidePadding > 0) {
            ctx.fillStyle = 'white';
            ctx.fillStyle = config.fillStyle;
            ctx.strokeStyle = config.strokeStyle;
            ctx.beginPath();
            ctx.roundRect(xPos, yPos, moduleBoxWidth, moduleBoxHeight, config.roundness);
            ctx.stroke();
            ctx.fill();
        } else {
            ctx.fillStyle = 'white';
            ctx.fillRect(xPos, yPos, moduleBoxWidth, moduleBoxHeight);

            // Draw borders
            ctx.fillStyle = 'black';
            if (yStart > 0) ctx.fillRect(xStart, yStart, (width / config.width) * module.width, 1);
            if (xStart > 0) ctx.fillRect(xStart, yStart, 1, (height / config.height) * module.height);
            ctx.fillStyle = 'white';
        }

        xPos += insidePadding;
        yPos += insidePadding;
        ctx.drawImage(canvas, xPos, yPos);
    }

    return moduleCanvas;
};

const main = async (): Promise<void> => {
    const width = 1872;
    const height = 1404;
    const outsidePadding = config.outsidePadding;

    // Draw modules canvas
    const moduleCanvaswidth = width - outsidePadding * 2;
    const moduleCanvasHeight = height - outsidePadding * 2;
    const moduleCanvas = await drawModules(moduleCanvaswidth, moduleCanvasHeight);

    // Create the full canvas
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');
    if (outsidePadding > 0 && config.backgroundSrc === '') {
        ctx.fillStyle = 'black';
        ctx.fillRect(0, 0, width, height);
    } else if (outsidePadding > 0) {
        const img = await loadImage(config.backgroundSrc);
        ctx.drawImage(img, 0, 0, width, height);
    }
    ctx.drawImage(moduleCanvas, outsidePadding, outsidePadding);

    // Grayscale conversion
    const imgData = ctx.getImageData(0, 0, width, height);
    const pixels = imgData.data;
    for (let i = 0; i < pixels.length; i += 4) {
        const grayscaleValue = Math.round(pixels[i] * 0.3 + pixels[i + 1] * 0.59 + pixels[i + 2] * 0.11) >> 4;

        pixels[i] = grayscaleValue << 4;
        pixels[i + 1] = grayscaleValue << 4;
        pixels[i + 2] = grayscaleValue << 4;
    }
    ctx.putImageData(imgData, 0, 0);

    // Save the canvas as a PNG file
    const out = createWriteStream('output.png');
    const stream = canvas.createPNGStream();
    stream.pipe(out);
    out.on('finish', () => {
        console.log('PNG file saved.');
    });
};

main().then().catch(console.log);
