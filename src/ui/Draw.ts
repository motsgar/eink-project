import { Canvas, createCanvas, Image } from 'canvas';
import { createWriteStream } from 'fs';
import * as fs from 'fs/promises';
import { ditherImage } from './ditherImage';
import { CO2Graph } from './modules/CO2';
import { EInkModule, ModuleSettings } from './modules/EInkModule';
import { HorizontalWeather } from './modules/HorizontalWeather';
import { Status } from './modules/Status';
import { TemperatureGraph } from './modules/Temperature';
import { Weather } from './modules/Weather';
import { WeatherGraph } from './modules/WeatherGraph';

type ModuleStrings = 'CO2Graph' | 'Status' | 'TemperatureGraph' | 'Weather' | 'WeatherGraph' | 'HorizontalWeather';
type Module = {
    module: ModuleStrings;
    x: number;
    y: number;
    width: number;
    height: number;
    settings: ModuleSettings;
};
type View = {
    width: number;
    height: number;
    insidePadding: number;
    roundness: number;
    outsidePadding: number;
    fillStyle: string;
    strokeStyle: string;
    backgroundSrc: string;
    modules: Module[];
};
type Config = {
    views: View[];
};

export class Draw {
    private viewIndex = 0;
    private modules: EInkModule[][];
    private config?: Config;
    readyPromise: Promise<void>;

    constructor() {
        this.modules = [];
        this.readyPromise = this.loadConfig().then(async () => {
            await this.loadModules();
        });
    }

    private async loadConfig(): Promise<void> {
        const dataBuffer = await fs.readFile('config.json');
        this.config = JSON.parse(dataBuffer.toString());
    }

    private async loadModules(): Promise<void> {
        let i = 0;
        this.modules = [];
        if (this.config === undefined) {
            throw new Error('Draw.loadModules() was called before the config was loaded');
        }
        for (const view of this.config.views) {
            this.modules.push([]);
            for (const module of view.modules) {
                switch (module.module) {
                    case 'CO2Graph':
                        this.modules[i].push(new CO2Graph(module.settings));
                        break;
                    case 'HorizontalWeather':
                        this.modules[i].push(new HorizontalWeather(module.settings));
                        break;
                    case 'Status':
                        this.modules[i].push(new Status(module.settings));
                        break;
                    case 'TemperatureGraph':
                        this.modules[i].push(new TemperatureGraph(module.settings));
                        break;
                    case 'Weather':
                        this.modules[i].push(new Weather(module.settings));
                        break;
                    case 'WeatherGraph':
                        this.modules[i].push(new WeatherGraph(module.settings));
                        break;
                    default:
                        throw new Error(`Unknown module ${module.module}`);
                }
                this.modules[i].push();
            }
            i += 1;
        }
    }

    async changeView(indexDiff: number): Promise<void> {
        if (this.config === undefined) {
            throw new Error('Draw.changeView() was called before the config was loaded');
        }

        // TODO: Draw loading symbol
        this.viewIndex += indexDiff;
        while (this.viewIndex < 0) this.viewIndex += this.config.views.length;
        this.viewIndex %= this.config.views.length;
        await this.drawView();
    }

    private async drawModules(width: number, height: number): Promise<Canvas> {
        if (this.config === undefined) {
            throw new Error('Tried to call drawModules without waiting for config to be loaded');
        }

        const view = this.config.views[this.viewIndex];
        const moduleCanvas = createCanvas(width, height);
        const ctx = moduleCanvas.getContext('2d');
        const outsidePadding = view.outsidePadding;
        const insidePadding = view.insidePadding;

        // Draw modules
        const moduleBaseWidth = width / view.width - outsidePadding * 2 - 2 * insidePadding;
        const moduleBaseHeight = height / view.height - outsidePadding * 2 - 2 * insidePadding;
        const moduleBoxBaseWidth = width / view.width - outsidePadding * 2;
        const moduleBoxBaseHeight = height / view.height - outsidePadding * 2;
        const moduleSpaceBetween = 2 * (outsidePadding + insidePadding);
        const moduleBoxSpaceBetween = 2 * outsidePadding;

        for (let i = 0; i < view.modules.length; i++) {
            const module = view.modules[i];
            const moduleClass = this.modules[this.viewIndex][i];
            console.log(`Drawing module ${moduleClass.constructor.name}`);

            const moduleWidth = module.width * moduleBaseWidth + moduleSpaceBetween * (module.width - 1);
            const moduleHeight = module.height * moduleBaseHeight + moduleSpaceBetween * (module.height - 1);
            const moduleBoxWidth = module.width * moduleBoxBaseWidth + moduleBoxSpaceBetween * (module.width - 1);
            const moduleBoxHeight = module.height * moduleBoxBaseHeight + moduleBoxSpaceBetween * (module.height - 1);

            await moduleClass.readyPromise;
            const canvas = moduleClass.draw(moduleWidth, moduleHeight);

            const xStart = (width / view.width) * module.x;
            const yStart = (height / view.height) * module.y;
            let xPos = xStart + outsidePadding;
            let yPos = yStart + outsidePadding;
            if (outsidePadding > 0) {
                ctx.fillStyle = 'white';
                ctx.fillStyle = view.fillStyle;
                ctx.strokeStyle = view.strokeStyle;
                ctx.beginPath();
                ctx.roundRect(xPos, yPos, moduleBoxWidth, moduleBoxHeight, view.roundness);
                ctx.stroke();
                ctx.fill();
            } else {
                ctx.fillStyle = 'white';
                ctx.fillRect(xPos, yPos, moduleBoxWidth, moduleBoxHeight);

                // Draw borders
                ctx.fillStyle = 'black';
                if (yStart > 0) ctx.fillRect(xStart, yStart, (width / view.width) * module.width, 1);
                if (xStart > 0) ctx.fillRect(xStart, yStart, 1, (height / view.height) * module.height);
                ctx.fillStyle = 'white';
            }

            xPos += insidePadding;
            yPos += insidePadding;
            ctx.drawImage(canvas, xPos, yPos);
        }

        return moduleCanvas;
    }

    async drawView(): Promise<void> {
        if (this.config === undefined) {
            throw new Error('Tried to call drawView without waiting for config to be loaded');
        }

        const view = this.config.views[this.viewIndex];
        const width = 1872; // Should probably be defined somewhere else?
        const height = 1404;
        const outsidePadding = view.outsidePadding;

        // Draw modules canvas
        const moduleCanvaswidth = width - outsidePadding * 2;
        const moduleCanvasHeight = height - outsidePadding * 2;
        const moduleCanvas = await this.drawModules(moduleCanvaswidth, moduleCanvasHeight);

        // Create the full canvas
        const canvas = createCanvas(width, height);
        const ctx = canvas.getContext('2d');
        if (outsidePadding > 0 && view.backgroundSrc === '') {
            ctx.fillStyle = 'black';
            ctx.fillRect(0, 0, width, height);
        } else if (outsidePadding > 0) {
            const image = new Image();
            image.src = await fs.readFile(view.backgroundSrc);
            const heightRatio = image.height / height;
            const widthRatio = image.width / width;
            const imageWidth = image.width / Math.min(heightRatio, widthRatio);
            const imageHeight = image.height / Math.min(heightRatio, widthRatio);
            ctx.drawImage(image, (width - imageWidth) / 2, (height - imageHeight) / 2, imageWidth, imageHeight);
        }
        ctx.drawImage(moduleCanvas, outsidePadding, outsidePadding);

        // Dither image
        const image = await ditherImage(canvas.toBuffer());
        ctx.drawImage(image, 0, 0);

        // Grayscale conversion TODO:remove
        const imgData = ctx.getImageData(0, 0, width, height);
        const pixels = imgData.data;
        for (let i = 0; i < pixels.length; i += 4) {
            const grayscaleValue = Math.round(pixels[i] * 0.3 + pixels[i + 1] * 0.59 + pixels[i + 2] * 0.11) >> 4;

            pixels[i] = grayscaleValue | (grayscaleValue << 4);
            pixels[i + 1] = grayscaleValue | (grayscaleValue << 4);
            pixels[i + 2] = grayscaleValue | (grayscaleValue << 4);
        }
        ctx.putImageData(imgData, 0, 0);

        // Save the canvas as a PNG file // TODO: draw on screen instead
        const filename = `view-${this.viewIndex}.png`;
        const out = createWriteStream(filename);
        const stream = canvas.createPNGStream();
        stream.pipe(out);
        out.on('finish', () => {
            console.log(`Saved current view to ${filename}`);
        });
    }
}
