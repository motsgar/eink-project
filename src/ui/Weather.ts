import { Canvas, Image, createCanvas, loadImage } from 'canvas';
import * as fs from 'fs/promises';
import { EInkModule } from './EInkModule';

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
    observations: { 843429: Observation[] }; // 843429 is the observation location id for kumpula.
    forecasts: { forecast: Forecast[] }[];
};

export class Weather extends EInkModule {
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
        const symbolsDir = 'resources/weatherSymbols';
        for (const filename of await fs.readdir(symbolsDir)) {
            if (!filename.endsWith('.svg')) continue;

            const index = parseInt(filename.split('.')[0]);
            const symbol = await loadImage(`${symbolsDir}/${filename}`);
            this.weatherSymbols[index] = symbol;
        }
    }

    private getText(forecast: Forecast): string[] {
        return [
            `${forecast.Temperature}°`,
            `${forecast.FeelsLike}°`,
            `${forecast.WindSpeedMS}`,
            `${forecast.PoP}%`,
            `${forecast.Precipitation1h}`,
        ];
    }

    parseTime(forecast: Forecast): string {
        const dateString = forecast.localtime;
        return `${dateString.slice(9, 11)}`; // Return hour
    }

    draw(width: number, height: number): Canvas {
        const timeSvgPadding = 30;
        const svgTextPadding = 20;
        const textPadding = 25;

        const canvas = createCanvas(width, height);
        const ctx = canvas.getContext('2d');

        const dates = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
        const forecasts = this.weatherData.forecasts[0].forecast;

        ctx.fillStyle = 'black';
        ctx.font = '20pt Sheriff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        const blockWidth = width / dates.length;

        let maxHeight = 0;
        for (const date of dates) {
            let yPos = 0;

            let measureText = ctx.measureText(this.parseTime(forecasts[date]));
            yPos += measureText.actualBoundingBoxAscent + measureText.actualBoundingBoxDescent + timeSvgPadding;

            const imageSize = blockWidth;
            yPos += imageSize + svgTextPadding;

            const text = this.getText(forecasts[date]);
            for (const line of text) {
                measureText = ctx.measureText(line);
                yPos += measureText.actualBoundingBoxAscent + measureText.actualBoundingBoxDescent + textPadding;
            }
            yPos -= textPadding;

            maxHeight = Math.max(yPos, maxHeight);
        }

        let xPos = 0;
        const yStart = (height - maxHeight) / 2;
        for (const date of dates) {
            let yPos = yStart;
            ctx.fillText(this.parseTime(forecasts[date]), xPos + blockWidth / 2, yPos);

            let measureText = ctx.measureText(this.parseTime(forecasts[date]));
            yPos += measureText.actualBoundingBoxAscent + measureText.actualBoundingBoxDescent + timeSvgPadding;

            const symbolId = parseInt(forecasts[date].SmartSymbol);
            const imageSize = blockWidth;
            if (symbolId in this.weatherSymbols) {
                const img = this.weatherSymbols[symbolId];
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
