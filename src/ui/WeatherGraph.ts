import { Canvas, createCanvas, Image } from 'canvas';
import { Chart, ChartData, registerables } from 'chart.js';
import 'chartjs-adapter-moment';
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

type DataType = {
    labels: string[];
    tempData: number[];
    feelslikeData: number[];
    rainData: number[];
};

export class WeatherGraph extends EInkModule {
    weatherData: WeatherData;
    weatherSymbols: { [key: number]: Image };

    constructor() {
        super();
        this.weatherSymbols = {};
        this.weatherData = { observations: { 843429: [] }, forecasts: [{ forecast: [] }] };
        this.initializeWeatherData().catch(console.log);
    }

    private async initializeWeatherData(): Promise<void> {
        const filePath = 'files/data.json';
        const data = await fs.readFile(filePath, 'utf8');
        this.weatherData = JSON.parse(data);
    }

    private parseTime(dateString: string): string {
        const year = parseInt(dateString.slice(0, 4), 10);
        const month = parseInt(dateString.slice(4, 6), 10) - 1; // Months are zero-based
        const day = parseInt(dateString.slice(6, 8), 10);
        const hour = parseInt(dateString.slice(9, 11), 10);
        const minute = parseInt(dateString.slice(11, 13), 10);
        const second = parseInt(dateString.slice(13, 15), 10);

        return new Date(Date.UTC(year, month, day, hour, minute, second)).toISOString();
    }

    private getData(): DataType {
        const forecasts = this.weatherData.forecasts[0].forecast;

        const labels: string[] = [];
        const tempData: number[] = [];
        const feelslikeData: number[] = [];
        const rainData: number[] = [];
        for (let i = 0; i <= 24; i++) {
            labels.push(this.parseTime(forecasts[i].localtime));
            tempData.push(parseFloat(forecasts[i].Temperature));
            feelslikeData.push(parseFloat(forecasts[i].FeelsLike));
            rainData.push(parseFloat(forecasts[i].Precipitation1h) + 3 * Math.random()); // TODO: remove random
        }
        return { labels, tempData, feelslikeData, rainData };
    }
    draw(width: number, height: number): Canvas {
        const canvas = createCanvas(width, height);
        const ctx = canvas.getContext('2d') as unknown as CanvasRenderingContext2D;

        const { labels, tempData, feelslikeData, rainData } = this.getData();

        const graphData: ChartData = {
            labels: labels,
            datasets: [
                { data: tempData },
                { data: feelslikeData, borderColor: '#aaaaaa' },
                {
                    data: rainData,
                    type: 'bar',
                    borderColor: '#000000',
                    backgroundColor: '#888888',
                    order: 1,
                    yAxisID: 'y1',
                },
            ],
        };
        Chart.register(...registerables);

        new Chart(ctx, {
            type: 'line',
            data: graphData,
            options: {
                elements: {
                    point: { radius: 0 },
                    line: {
                        fill: false,
                        borderColor: '#000000',
                        borderWidth: 1,
                        tension: 0.1,
                    },
                },
                scales: {
                    x: {
                        type: 'time',
                        ticks: {
                            major: { enabled: true },
                            font: (context) => ({
                                weight: context.tick && context.tick.major ? 'bold' : '',
                            }),
                        },
                        grid: {
                            color: (context) => (context.tick && context.tick.major ? '#888888' : '#eeeeee'),
                        },
                    },
                    y: { grace: 1 },
                    y1: { position: 'right', suggestedMax: 15 },
                },
                plugins: {
                    title: { display: true, text: 'weather' },
                    legend: { display: false },
                },
            },
        });
        return canvas;
    }
}
