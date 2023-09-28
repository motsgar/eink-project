import { Canvas, Image, createCanvas, loadImage } from 'canvas';
import { ModuleSettings } from '../../../web/src/schema';
import { sensorData } from '../SensorData';
import { weatherData } from '../weatherData';
import { EInkModule } from './EInkModule';

export class Status extends EInkModule {
    private sunriseIcon?: Image;
    private sunsetIcon?: Image;

    constructor(settings: ModuleSettings) {
        super(settings);
        this.readyPromise = Promise.all([this.loadIcons(), weatherData.readyPromise, sensorData.readyPromise]);
    }

    private async loadIcons(): Promise<void> {
        this.sunriseIcon = await loadImage('resources/icons/sunrise.svg');
        this.sunsetIcon = await loadImage('resources/icons/sunset.svg');
    }

    draw(width: number, height: number): Canvas {
        const canvas = createCanvas(width, height);
        const ctx = canvas.getContext('2d');

        const observation = weatherData.weatherData?.observation;
        const sunInfo = weatherData.weatherData?.sunInfo;
        const warnings = weatherData.weatherData?.warnings;
        const sensorData_ = sensorData.latestData;
        if (warnings === undefined || sunInfo === undefined || observation === undefined) {
            throw new Error("Weather data hasn't been initialized");
        }
        if (this.sunriseIcon === undefined || this.sunsetIcon === undefined) {
            throw new Error("Status icons haven't been initialized");
        }
        if (sensorData_ === undefined) {
            throw new Error("Sensor data hasn't been initialized");
        }

        // Main clock + date
        ctx.font = '300 120pt sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillStyle = 'black';
        let yPos = height / 2 - 150;
        const timeText = new Date().toTimeString().substring(0, 5);
        ctx.fillText(timeText, width / 2, yPos);
        const timeMeasureText = ctx.measureText(timeText);
        yPos += timeMeasureText.actualBoundingBoxAscent + timeMeasureText.actualBoundingBoxDescent + 60;

        ctx.font = '22pt sans-serif';
        const options: Intl.DateTimeFormatOptions = {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        };
        ctx.fillText(new Date().toLocaleDateString('en-US', options), width / 2, yPos);

        ctx.font = '25pt sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.fillText(sunInfo.suntxt, width / 2, height - 10);
        const textWidth = ctx.measureText(sunInfo.suntxt).width;
        const iconSize = 40;
        ctx.drawImage(
            this.sunriseIcon,
            width / 2 - textWidth / 2 - iconSize - 10,
            height - 10 - iconSize,
            iconSize,
            iconSize,
        );
        // iconSize -= 4;
        ctx.drawImage(this.sunsetIcon, width / 2 + textWidth / 2 + 10, height - 10 - iconSize, iconSize, iconSize);

        // Other text
        ctx.font = '25pt sans-serif';
        const padding = 30;

        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        let text = [`${sensorData_.temperature.toFixed(1)}°C`, `${sensorData_.co2.toFixed(1)} ppm`];
        yPos = 10;
        for (const line of text) {
            ctx.fillText(line, 10, yPos);
            const measureText = ctx.measureText(line);
            yPos += measureText.actualBoundingBoxAscent + measureText.actualBoundingBoxDescent + padding;
        }

        ctx.textAlign = 'left';
        ctx.textBaseline = 'bottom';
        text = [`${sensorData_.humidity.toFixed(1)} %`, `${sensorData_.pressure.toFixed(1)} hPa`];
        yPos = height - 10;
        for (const line of text.reverse()) {
            ctx.fillText(line, 10, yPos);
            const measureText = ctx.measureText(line);
            yPos -= measureText.actualBoundingBoxAscent + measureText.actualBoundingBoxDescent + padding;
        }

        ctx.textAlign = 'right';
        ctx.textBaseline = 'top';
        text = [`${observation.temperature}°C`, `${observation.windSpeedMS} m/s`];
        yPos = 10;
        for (const line of text) {
            ctx.fillText(line, width - 10, yPos);
            const measureText = ctx.measureText(line);
            yPos += measureText.actualBoundingBoxAscent + measureText.actualBoundingBoxDescent + padding;
        }

        ctx.textAlign = 'right';
        ctx.textBaseline = 'bottom';
        text = Object.entries(warnings)
            .filter((warning) => warning[1])
            .map((warning) => warning[0]);
        if (text.length === 0) text = ['No warnings'];
        yPos = height - 10;
        for (const line of text.reverse()) {
            ctx.fillText(line, width - 10, yPos);
            const measureText = ctx.measureText(line);
            yPos -= measureText.actualBoundingBoxAscent + measureText.actualBoundingBoxDescent + padding;
        }

        return canvas;
    }
}
