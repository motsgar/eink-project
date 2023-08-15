import { Canvas, createCanvas, loadImage } from 'canvas';
import { promises as fs } from 'fs';
import { EInkModule } from './EInkModule';

type Forecast = {
    localtime: string;
    Temperature: string;
    SmartSymbol: string;
    PoP: string;
    WindSpeedMS: string;
    Precipitation1h: string;
    FeelsLike: string;
};

export class Weather extends EInkModule {
    private getText(forecast: Forecast): string[] {
        return [
            `${forecast['Temperature']}°`,
            `${forecast['FeelsLike']}°`,
            `${forecast['WindSpeedMS']}`,
            `${forecast['PoP']}%`,
            `${forecast['Precipitation1h']}`,
        ];
    }

    parseTime(forecast: Forecast): string {
        const dateString = forecast['localtime'];
        return `${dateString.slice(9, 11)}`; // Return hour
    }

    async draw(width: number, height: number): Promise<Canvas> {
        const filePath = 'files/data.json';
        const timeSvgPadding = 30;
        const svgTextPadding = 20;
        const textPadding = 25;

        const data = await fs.readFile(filePath, 'utf8');
        const jsonData = JSON.parse(data);

        const canvas = createCanvas(width, height);
        const ctx = canvas.getContext('2d');

        const dates = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
        const forecasts = jsonData['forecasts'][0]['forecast'];

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

            const svgFilePath = `files/symbols/${forecasts[date]['SmartSymbol']}.svg`;
            const img = await loadImage(svgFilePath);
            const imageSize = blockWidth;
            ctx.drawImage(img, xPos + (blockWidth - imageSize) / 2, yPos, imageSize, imageSize);

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
