import 'chartjs-adapter-moment';

import { Canvas, createCanvas } from 'canvas';
import { Chart, ChartData, ScriptableScaleContext, registerables } from 'chart.js';

import { EInkModule } from './EInkModule';
import { ModuleSettings } from '../../../web/src/schema';
import { weatherData } from '../weatherData';

type DataType = {
    labels: Date[];
    tempData: number[];
    feelslikeData: number[];
    rainData: number[];
};

export class WeatherGraph extends EInkModule {
    timePeriod: number;
    chartInstance?: Chart;

    constructor(settings: ModuleSettings) {
        super(settings);

        const defaultTimePeriod = 20;
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
                {
                    data: feelslikeData,
                    segment: { borderDash: [6, 6] },
                },
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

        if (this.chartInstance !== undefined) {
            this.chartInstance.destroy();
        }
        this.chartInstance = new Chart(ctx, {
            type: 'line',
            data: graphData,
            options: {
                elements: {
                    point: { radius: 0 },
                    line: {
                        fill: false,
                        borderColor: '#333333',
                        borderWidth: 2,
                        tension: 0.1,
                    },
                },
                scales: {
                    x: {
                        type: 'time',
                        time: {
                            unit: 'hour',
                            displayFormats: {
                                hour: 'HH',
                                minute: 'HH',
                                day: 'HH',
                            },
                        },
                        ticks: {
                            major: { enabled: true },
                            font: (context: ScriptableScaleContext | { tick: undefined }) => ({
                                size: 25,
                                weight: context.tick && context.tick.major ? 'bold' : 'normal',
                            }),
                            // autoSkip: false,
                            // stepSize: 2,
                        },
                        grid: {
                            color: (context: ScriptableScaleContext | { tick: undefined }) =>
                                context.tick && context.tick.major ? '#333333' : '#ffffff00',
                        },
                    },
                    y: {
                        grace: 1,
                        ticks: { font: { size: 25 }, maxTicksLimit: 5 },
                        grid: { color: '#aaaaaa' },
                    },
                    y1: {
                        position: 'right',
                        suggestedMax: 8,
                        ticks: { font: { size: 25 }, maxTicksLimit: 5 },
                        grid: {
                            color: '#ffffff00',
                        },
                    },
                },
                plugins: {
                    title: { display: true, text: 'weather', font: { size: 25 } },
                    legend: { display: false },
                },
            },
        });
        return canvas;
    }
}
