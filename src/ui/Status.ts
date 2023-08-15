import { Canvas, createCanvas } from 'canvas';
import { EInkModule } from './EInkModule';
import { weatherData } from './weatherData';

export class Status extends EInkModule {
    constructor() {
        super();
        this.readyPromise = Promise.all([weatherData.readyPromise]);
    }

    draw(width: number, height: number): Canvas {
        const canvas = createCanvas(width, height);
        const ctx = canvas.getContext('2d');

        const observation = weatherData.weatherData?.observation;
        if (observation === undefined) throw new Error("Weather data hasn't been initialized");

        ctx.font = '300 120pt sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = 'black';
        ctx.fillText(new Date().toTimeString().substring(0, 5), width / 2, height / 2 - 25);

        ctx.font = '22pt sans-serif';
        const options: Intl.DateTimeFormatOptions = {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        };
        ctx.fillText(new Date().toLocaleDateString('en-US', options), width / 2, height / 2 + 85);

        ctx.font = '25pt Sherisans-serifff';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText('25.6°C', 10, 10);

        ctx.textAlign = 'right';
        ctx.fillText('713 ppm', width - 10, 10);

        ctx.textAlign = 'left';
        ctx.textBaseline = 'bottom';
        ctx.fillText(`${observation.temperature}°C`, 10, height - 10);

        ctx.textAlign = 'right';
        ctx.fillText(`${observation.windSpeedMS} m/s`, width - 10, height - 10);

        return canvas;
    }
}
