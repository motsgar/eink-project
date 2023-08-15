import { Canvas, createCanvas, loadImage } from 'canvas';
import { promises as fs } from 'fs';

type Forecast = {
    localtime: string;
    Temperature: string;
    SmartSymbol: string;
    PoP: string;
    WindSpeedMS: string;
    Precipitation1h: string;
    FeelsLike: string;
};

const getText = (forecast: Forecast): string =>
    `${forecast['Temperature']}°C (${forecast['FeelsLike']}°C)  |  ${forecast['WindSpeedMS']} m/s  |  ${forecast['PoP']} %`;

const parseTime = (forecast: Forecast): string => {
    const timeString = forecast['localtime'];
    const hour = timeString.substr(9, 2);
    const minute = timeString.substr(11, 2);
    return `${hour}:${minute}`;
};

export const drawWeather = async (width: number, height: number): Promise<Canvas> => {
    const filePath = 'files/data.json';
    const timeSvgPadding = 30;
    const svgTextPadding = 10;
    const svgPadding = 10;

    const data = await fs.readFile(filePath, 'utf8');
    const jsonData = JSON.parse(data);

    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    const dates = [0, 1, 2, 3, 5, 7, 10, 14];
    const observation = jsonData['observations'][843429][0];
    const forecasts = jsonData['forecasts'][0]['forecast'];

    ctx.fillStyle = 'black';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';

    const yStart = height / 5;
    const blockHeight = (height - yStart) / dates.length;

    // Draw current
    ctx.font = '30pt Sheriff';
    ctx.textBaseline = 'top';
    ctx.fillText(`${observation['Temperature']}°C`, 10, 10);
    ctx.textAlign = 'right';
    ctx.fillText(`${observation['WindSpeedMS']} m/s`, width - 10, 10);
    ctx.textAlign = 'left';

    // Draw blocks
    ctx.font = '20pt Sheriff';
    ctx.textBaseline = 'middle';
    let blockWidth = 0;
    for (const date of dates) {
        const timeLength = ctx.measureText(parseTime(forecasts[date])).width;
        const dataLength = ctx.measureText(getText(forecasts[date])).width;
        const imageSize = blockHeight - svgPadding;

        blockWidth = Math.max(blockWidth, timeLength + dataLength + imageSize + timeSvgPadding + svgTextPadding);
    }
    const xPadding = (width - blockWidth) / 2;

    let yPos = yStart;
    for (const date of dates) {
        ctx.fillStyle = 'grey';
        ctx.fillRect(0, yPos, width, 1);
        ctx.fillStyle = 'black';

        let xStart = xPadding;
        ctx.fillText(parseTime(forecasts[date]), xStart, yPos + blockHeight / 2);

        xStart += ctx.measureText(parseTime(forecasts[date])).width + timeSvgPadding;
        const svgFilePath = `files/symbols/${forecasts[date]['SmartSymbol']}.svg`;
        const img = await loadImage(svgFilePath);
        const imageSize = blockHeight - svgPadding;
        ctx.drawImage(img, xStart, yPos + (blockHeight - imageSize) / 2, imageSize, imageSize);

        xStart += imageSize + svgTextPadding;
        ctx.fillText(getText(forecasts[date]), xStart, yPos + blockHeight / 2);
        yPos += blockHeight;
    }

    return canvas;
};
