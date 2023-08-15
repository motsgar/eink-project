import { Canvas, createCanvas } from 'canvas';
import { EInkModule } from './EInkModule';
import { Forecast, weatherData } from './weatherData';

export class Weather extends EInkModule {
    constructor() {
        super();
        this.readyPromise = Promise.all([weatherData.readyPromise]);
    }

    private getText(forecast: Forecast): string[] {
        return [
            `${forecast.temperature}°`,
            `${forecast.feelsLike}°`,
            `${forecast.windSpeedMS}`,
            `${forecast.PoP}%`,
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

        const times = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
        const forecasts = weatherData.weatherData?.forecasts;
        const weatherSymbols = weatherData.weatherSymbols;
        if (forecasts === undefined) throw new Error("Weather data hasn't been initialized");

        ctx.fillStyle = 'black';
        ctx.font = '20pt Sheriff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        const blockWidth = width / times.length;

        let maxHeight = 0;
        for (const time of times) {
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
        for (const date of times) {
            let yPos = yStart;
            const hours = forecasts[date].localtime.getHours().toString();
            ctx.fillText(hours, xPos + blockWidth / 2, yPos);

            let measureText = ctx.measureText(hours);
            yPos += measureText.actualBoundingBoxAscent + measureText.actualBoundingBoxDescent + timeSvgPadding;

            const symbolId: number = forecasts[date].smartSymbol;
            const imageSize = blockWidth;
            if (symbolId in weatherSymbols) {
                const img = weatherSymbols[symbolId];
                ctx.drawImage(img, xPos + (blockWidth - imageSize) / 2, yPos, imageSize, imageSize);
            } else {
                console.error(`Failed to find weather symbol ${symbolId}`); // Find a better way to print/indicate this?
            }
            yPos += imageSize + svgTextPadding;

            const text = this.getText(forecasts[date]);
            for (const line of text) {
                ctx.fillText(line, xPos + blockWidth / 2, yPos);
                measureText = ctx.measureText(line);
                yPos += measureText.actualBoundingBoxAscent + measureText.actualBoundingBoxDescent + textPadding;
            }
            xPos += blockWidth;
        }

        return canvas;
    }
}
