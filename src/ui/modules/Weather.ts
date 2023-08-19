import { Canvas, createCanvas } from 'canvas';
import { Forecast, weatherData } from '../weatherData';
import { EInkModule, ModuleSettings } from './EInkModule';

export class Weather extends EInkModule {
    times: number[];

    constructor(settings: ModuleSettings) {
        super(settings);

        const defaultTimes = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
        this.times = settings.times || defaultTimes;

        this.readyPromise = Promise.all([weatherData.readyPromise]);
    }

    private getText(forecast: Forecast): string[] {
        return [
            `${forecast.temperature}°`,
            `${forecast.feelsLike}°`,
            `${forecast.windSpeedMS}`,
            `${forecast.PoP}`,
            `${forecast.precipitation1h}`,
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
            let i = 0;
            for (const line of text) {
                ctx.textBaseline = 'top';
                ctx.fillText(line, xPos + blockWidth / 2, yPos);
                measureText = ctx.measureText(line);

                // Draw small percentage sign
                if (i === 3) {
                    const textHeight = measureText.actualBoundingBoxAscent + measureText.actualBoundingBoxDescent;
                    ctx.textAlign = 'left';
                    ctx.textBaseline = 'bottom';
                    ctx.font = '14pt sans-serif';
                    ctx.fillText('%', xPos + blockWidth / 2 + measureText.width / 2, yPos + textHeight + 10);
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'top';
                    ctx.font = '20pt sans-serif';
                }
                yPos += measureText.actualBoundingBoxAscent + measureText.actualBoundingBoxDescent + textPadding;
                i += 1;
            }
            xPos += blockWidth;
        }

        return canvas;
    }
}
