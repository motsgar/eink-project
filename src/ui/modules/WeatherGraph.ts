import { Canvas, createCanvas } from 'canvas';
import { Chart, ChartData, ScriptableScaleContext, registerables } from 'chart.js';
import 'chartjs-adapter-moment';
import { weatherData } from '../weatherData';
import { EInkModule, ModuleSettings } from './EInkModule';

type DataType = {
    labels: Date[];
    tempData: number[];
    feelslikeData: number[];
    rainData: number[];
};

export class WeatherGraph extends EInkModule {
    timePeriod: number;

    constructor(settings: ModuleSettings) {
        super(settings);

        const defaultTimePeriod = 24;
        this.timePeriod = settings.timePeriod ?? defaultTimePeriod;

        this.readyPromise = Promise.all([weatherData.readyPromise]);
    }

    private getData(): DataType {
        const forecasts = weatherData.weatherData?.forecasts;
        if (forecasts === undefined) throw new Error("Weather data hasn't been initialized");

        const labels: Date[] = [];
        const tempData: number[] = [];
        const feelslikeData: number[] = [];
        const rainData: number[] = [];

        for (let i = 0; i <= this.timePeriod; i++) {
            labels.push(forecasts[i].localtime);
            tempData.push(forecasts[i].temperature);
            feelslikeData.push(forecasts[i].feelsLike);
            rainData.push(forecasts[i].precipitation1h);
        }
        return { labels, tempData, feelslikeData, rainData };
    }

    draw(width: number, height: number): Canvas {
        const canvas = createCanvas(width, height);
        const ctx = canvas.getContext('2d');

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
                                size: 16,
                                weight: context.tick && context.tick.major ? 'bold' : '',
                            }),
                        },
                        grid: {
                            // Might not be the correct type but it works
                            color: (context: ScriptableScaleContext) =>
                                context.tick && context.tick.major ? '#888888' : '#eeeeee',
                        },
                    },
                    y: { grace: 1, ticks: { font: { size: 18 } } },
                    y1: { position: 'right', suggestedMax: 15, ticks: { font: { size: 18 } } },
                },
                plugins: {
                    title: { display: true, text: 'weather', font: { size: 18 } },
                    legend: { display: false },
                },
            },
        });
        return canvas;
    }
}
