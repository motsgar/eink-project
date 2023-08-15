import { Canvas, Image, createCanvas, loadImage } from 'canvas';
import { existsSync, promises as fs } from 'fs';

type Observation = {
    Temperature: string;
    WindSpeedMS: string;
    WindGust: string;
    Humidity: string;
    Pressure: string;
    SnowDepth: string;
    TotalCloudCover: string;
    Visibility: string;
    RI_10MIN: string;
};

type Forecast = {
    localtime: string;
    Temperature: string;
    SmartSymbol: string;
    PoP: string;
    WindSpeedMS: string;
    Precipitation1h: string;
    FeelsLike: string;
};

type WeatherData = {
    observations: { 843429: Observation[] }; // 843429 is the location for the data. Could be typed better :P
    forecasts: { forecast: Forecast[] }[];
};

import { EInkModule } from './EInkModule';

export class HorizontalWeather extends EInkModule {
    weatherData: WeatherData;
    weatherSymbols: { [key: number]: Image };

    constructor() {
        super();
        this.weatherSymbols = {};
        this.weatherData = { observations: { 843429: [] }, forecasts: [{ forecast: [] }] };
        this.initializeWeatherData().catch(console.log);
        this.initializeWeatherSymbols().catch(console.log);
    }

    private async initializeWeatherData(): Promise<void> {
        const filePath = 'files/data.json';
        const data = await fs.readFile(filePath, 'utf8');
        this.weatherData = JSON.parse(data);
    }

    private async initializeWeatherSymbols(): Promise<void> {
        for (let i = 0; i < 200; i++) {
            const svgFilePath = `files/symbols/${i}.svg`;
            if (existsSync(svgFilePath)) {
                const symbol = await loadImage(svgFilePath);
                this.weatherSymbols[i] = symbol;
            }
        }
    }

    private getText(forecast: Forecast): string {
        return `${forecast.Temperature}°C (${forecast.FeelsLike}°C)  |  ${forecast.WindSpeedMS} m/s  |  ${forecast.PoP} %`;
    }

    private parseTime(forecast: Forecast): string {
        const dateString = forecast.localtime;
        const hour = parseInt(dateString.slice(9, 11), 10);
        const minute = parseInt(dateString.slice(11, 13), 10);
        return `${hour}:${minute}`;
    }

    draw(width: number, height: number): Canvas {
        const timeSvgPadding = 30;
        const svgTextPadding = 10;
        const svgPadding = 10;

        const canvas = createCanvas(width, height);
        const ctx = canvas.getContext('2d');

        const dates = [0, 1, 2, 3, 5, 7, 10, 14];
        const observation = this.weatherData.observations[843429][0];
        const forecasts = this.weatherData.forecasts[0].forecast;

        ctx.fillStyle = 'black';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';

        const yStart = height / 5;
        const blockHeight = (height - yStart) / dates.length;

        // Draw current
        ctx.font = '30pt Sheriff';
        ctx.textBaseline = 'top';
        ctx.fillText(`${observation.Temperature}°C`, 10, 10);
        ctx.textAlign = 'right';
        ctx.fillText(`${observation.WindSpeedMS} m/s`, width - 10, 10);
        ctx.textAlign = 'left';

        // Draw blocks
        ctx.font = '20pt Sheriff';
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

            const symbolId = parseInt(forecasts[date].SmartSymbol);
            const imageSize = blockHeight - svgPadding;
            if (symbolId in this.weatherSymbols) {
                const img = this.weatherSymbols[symbolId];
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
