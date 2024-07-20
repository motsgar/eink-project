import { Canvas, createCanvas } from 'canvas';

import { EInkModule } from './EInkModule';
import { ModuleSettings } from '../../../web/src/schema';
import { weatherData } from '../weatherData';
import { Forecast } from '../weatherParse';

export class Weather extends EInkModule {
    times: number[];

    constructor(settings: ModuleSettings) {
        super(settings);

        const defaultTimes = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
        this.times = settings.times ?? defaultTimes;

        this.readyPromise = Promise.all([weatherData.readyPromise]);
    }

    private getText(forecast: Forecast): string[] {
        return [
            `${Math.round(forecast.temperature)}°`,
            `${Math.round(forecast.feelsLike)}°`,
            `${Math.round(forecast.windSpeedMS * 10) / 10}`,
            `${Math.round(forecast.precipitation1h * 10) / 10}`,
        ];
    }

    parseTime(forecast: Forecast): string {
        return forecast.localtime.getHours().toString(); // Return hour
    }

    draw(width: number, height: number): Canvas {
        const timeSvgPadding = 30;
        const svgTextPadding = 20;
        const textPadding = 25;

        const canvas = createCanvas(width, height);
        const ctx = canvas.getContext('2d');

        const forecasts = weatherData.weatherData?.forecasts;
        const weatherSymbols = weatherData.weatherSymbols;
        if (forecasts === undefined) throw new Error("Weather data hasn't been initialized");

        ctx.fillStyle = 'black';
        ctx.font = '20pt sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        const blockWidth = width / this.times.length;

        let maxHeight = 0;
        for (const time of this.times) {
            let yPos = 0;

            const hours = forecasts[time].localtime.getHours().toString();
            let measureText = ctx.measureText(hours);
            yPos += measureText.actualBoundingBoxAscent + measureText.actualBoundingBoxDescent + timeSvgPadding;

            const imageSize = blockWidth;
            yPos += imageSize + svgTextPadding;

            const text = this.getText(forecasts[time]);
            for (const line of text) {
                measureText = ctx.measureText(line);
                yPos += measureText.actualBoundingBoxAscent + measureText.actualBoundingBoxDescent + textPadding;
            }
            yPos -= textPadding;

            maxHeight = Math.max(yPos, maxHeight);
        }

        let xPos = 0;
        const yStart = (height - maxHeight) / 2;
        for (const time of this.times) {
            let yPos = yStart;
            const hours = forecasts[time].localtime.getHours().toString();
            ctx.fillText(hours, xPos + blockWidth / 2, yPos);

            let measureText = ctx.measureText(hours);
            yPos += measureText.actualBoundingBoxAscent + measureText.actualBoundingBoxDescent + timeSvgPadding;

            const symbolId: number = forecasts[time].smartSymbol;
            const imageSize = blockWidth;
            if (symbolId in weatherSymbols) {
                const img = weatherSymbols[symbolId];
                ctx.drawImage(img, xPos + (blockWidth - imageSize) / 2, yPos, imageSize, imageSize);
            } else {
                console.error(`Failed to find weather symbol ${symbolId}`);
            }
            yPos += imageSize + svgTextPadding;

            const text = this.getText(forecasts[time]);
            for (const line of text) {
                ctx.textBaseline = 'top';
                ctx.fillText(line, xPos + blockWidth / 2, yPos);
                measureText = ctx.measureText(line);

                yPos += measureText.actualBoundingBoxAscent + measureText.actualBoundingBoxDescent + textPadding;
            }
            xPos += blockWidth;
        }

        return canvas;
    }
}
