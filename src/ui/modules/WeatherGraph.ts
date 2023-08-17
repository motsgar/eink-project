import { Canvas, createCanvas } from 'canvas';
import { Chart, ChartData, registerables } from 'chart.js';
import 'chartjs-adapter-moment';
import { weatherData } from '../weatherData';
import { EInkModule } from './EInkModule';

type DataType = {
    labels: string[];
    tempData: number[];
    feelslikeData: number[];
    rainData: number[];
};

export class WeatherGraph extends EInkModule {
    constructor() {
        super();
        this.readyPromise = Promise.all([weatherData.readyPromise]);
    }

    private getData(): DataType {
        const forecasts = weatherData.weatherData?.forecasts;
        if (forecasts === undefined) throw new Error("Weather data hasn't been initialized");

        const labels: string[] = [];
        const tempData: number[] = [];
        const feelslikeData: number[] = [];
        const rainData: number[] = [];
        for (let i = 0; i <= 24; i++) {
            labels.push(forecasts[i].localtime.toISOString());
            tempData.push(forecasts[i].temperature);
            feelslikeData.push(forecasts[i].feelsLike);
            // rainData.push(forecasts[i].precipitation1h + 3 * Math.random()); // TODO: remove random
            rainData.push(forecasts[i].precipitation1h);
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
