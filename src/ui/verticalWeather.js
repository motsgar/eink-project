import { createCanvas, loadImage } from 'canvas';
import { promises as fs } from 'fs';

const readJsonFile = async (filePath) => {
    try {
        const data = await fs.readFile(filePath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        throw error;
    }
};

const loadSvgImage = async (svgFilePath) => {
    try {
        return await loadImage(svgFilePath);
    } catch (error) {
        throw error;
    }
};

const getText = (forecast) => [
    `${forecast['Temperature']}°`,
    `${forecast['FeelsLike']}°`,
    `${forecast['WindSpeedMS']}`,
    `${forecast['PoP']}%`,
    `${forecast['Precipitation1h']}`,
];

const parseTime = (forecast) => {
    const timeString = forecast['localtime'];
    return `${timeString.substr(9, 2)}`;
};

export const drawVerticalWeather = async (width, height) => {
    const filePath = 'files/data.json';
    const timeSvgPadding = 30;
    const svgTextPadding = 20;
    const textPadding = 25;

    const jsonData = await readJsonFile(filePath);

    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    let dates = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
    let forecasts = jsonData['forecasts'][0]['forecast'];

    ctx.fillStyle = 'black';
    ctx.font = '20pt Sheriff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    let blockWidth = width / dates.length;

    let maxHeight = 0;
    for (let date of dates) {
        let yPos = 0;

        const measureText = ctx.measureText(parseTime(forecasts[date]));
        yPos += measureText.actualBoundingBoxAscent + measureText.actualBoundingBoxDescent + timeSvgPadding;

        const imageSize = blockWidth;
        yPos += imageSize + svgTextPadding;

        const text = getText(forecasts[date]);
        for (let line of text) {
            const measureText = ctx.measureText(line);
            yPos += measureText.actualBoundingBoxAscent + measureText.actualBoundingBoxDescent + textPadding;
        }
        yPos -= textPadding;

        maxHeight = Math.max(yPos, maxHeight);
    }

    let xPos = 0;
    const yStart = (height - maxHeight) / 2;
    for (let date of dates) {
        let yPos = yStart;
        ctx.fillText(parseTime(forecasts[date]), xPos + blockWidth / 2, yPos);

        const measureText = ctx.measureText(parseTime(forecasts[date]));
        yPos += measureText.actualBoundingBoxAscent + measureText.actualBoundingBoxDescent + timeSvgPadding;

        const svgFilePath = `files/symbols/${forecasts[date]['SmartSymbol']}.svg`;
        const img = await loadSvgImage(svgFilePath);
        const imageSize = blockWidth;
        ctx.drawImage(img, xPos + (blockWidth - imageSize) / 2, yPos, imageSize, imageSize);

        yPos += imageSize + svgTextPadding;
        const text = getText(forecasts[date]);
        for (let line of text) {
            ctx.fillText(line, xPos + blockWidth / 2, yPos);
            const measureText = ctx.measureText(line);
            yPos += measureText.actualBoundingBoxAscent + measureText.actualBoundingBoxDescent + textPadding;
        }
        xPos += blockWidth;
    }

    return canvas;
};
