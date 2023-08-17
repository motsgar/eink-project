import { Canvas, createCanvas } from 'canvas';
import { Forecast, weatherData } from '../weatherData';
import { EInkModule } from './EInkModule';

export class HorizontalWeather extends EInkModule {
    constructor() {
        super();
        this.readyPromise = Promise.all([weatherData.readyPromise]);
    }

    private getText(forecast: Forecast): string {
        return `${forecast.temperature}°C (${forecast.feelsLike}°C)  |  ${forecast.windSpeedMS} m/s  |  ${forecast.PoP} %`;
    }

    private parseTime(forecast: Forecast): string {
        return `${forecast.localtime.getHours()}:${forecast.localtime.getMinutes()}`;
    }

    draw(width: number, height: number): Canvas {
        const timeSvgPadding = 30;
        const svgTextPadding = 10;
        const svgPadding = 10;

        const canvas = createCanvas(width, height);
        const ctx = canvas.getContext('2d');

        const dates = [0, 1, 2, 3, 5, 7, 10, 14];
        const observation = weatherData.weatherData?.observation;
        const forecasts = weatherData.weatherData?.forecasts;
        if (observation === undefined || forecasts === undefined) {
            throw new Error("Weather data hasn't been initialized");
        }

        ctx.fillStyle = 'black';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';

        const yStart = height / 5;
        const blockHeight = (height - yStart) / dates.length;

        // Draw current
        ctx.font = '30pt sans-serif';
        ctx.textBaseline = 'top';
        ctx.fillText(`${observation.temperature}°C`, 10, 10);
        ctx.textAlign = 'right';
        ctx.fillText(`${observation.windSpeedMS} m/s`, width - 10, 10);
        ctx.textAlign = 'left';

        // Draw blocks
        ctx.font = '20pt sans-serif';
        ctx.textBaseline = 'middle';
        let blockWidth = 0;
        for (const date of dates) {
            const timeLength = ctx.measureText(this.parseTime(forecasts[date])).width;
            const dataLength = ctx.measureText(this.getText(forecasts[date])).width;
            const imageSize = blockHeight - svgPadding;

            blockWidth = Math.max(blockWidth, timeLength + dataLength + imageSize + timeSvgPadding + svgTextPadding);
        }
        const xPadding = (width - blockWidth) / 2;

        let yPos = yStart;
        for (const date of dates) {
            ctx.fillStyle = 'grey';
            ctx.fillRect(0, yPos, width, 1);
            ctx.fillStyle = 'black';

            let xPos = xPadding;
            ctx.fillText(this.parseTime(forecasts[date]), xPos, yPos + blockHeight / 2);
            xPos += ctx.measureText(this.parseTime(forecasts[date])).width + timeSvgPadding;

            const symbolId: number = forecasts[date].smartSymbol;
            const imageSize = blockHeight - svgPadding;
            if (symbolId in weatherData.weatherSymbols) {
                const img = weatherData.weatherSymbols[symbolId];
                ctx.drawImage(img, xPos, yPos + (blockHeight - imageSize) / 2, imageSize, imageSize);
            } else {
                console.error(`Failed to find weather symbol ${symbolId}`); // Find a better way to print/indicate this?
            }
            xPos += imageSize + svgTextPadding;

            ctx.fillText(this.getText(forecasts[date]), xPos, yPos + blockHeight / 2);
            yPos += blockHeight;
        }

        return canvas;
    }
}
