import { Canvas, createCanvas } from 'canvas';
import { Chart, ScriptableScaleContext, registerables } from 'chart.js';
import 'chartjs-adapter-moment';
import { sensorData } from '../SensorData';
import { EInkModule, ModuleSettings } from './EInkModule';

export class EnvGraph extends EInkModule {
    timePeriod: number; // minutes

    constructor(settings: ModuleSettings) {
        super(settings);

        const defaultTimePeriod = 3 * 60;
        this.timePeriod = settings.timePeriod ?? defaultTimePeriod;

        this.readyPromise = Promise.all([sensorData.readyPromise]);
    }

    draw(width: number, height: number): Canvas {
        const canvas = createCanvas(width, height);
        const ctx = canvas.getContext('2d');

        const sensorData_ = sensorData.getSensorData(this.timePeriod * 60, false);
        const data = {
            labels: sensorData_.map(({ timestamp }) => timestamp),
            datasets: [
                { data: sensorData_.map(({ humidity }) => humidity), label: 'Humidity' },
                {
                    data: sensorData_.map(({ pressure }) => pressure),
                    borderColor: '#888888',
                    order: 1,
                    yAxisID: 'y1',
                    label: 'Pressure',
                },
            ],
        };
        Chart.register(...registerables);
        new Chart(ctx, {
            type: 'line',
            data: data,
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
                        time: {
                            unit: this.timePeriod >= 24 * 60 ? 'hour' : 'minute',
                        },
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
                    y: { ticks: { font: { size: 18 } } },
                    y1: { position: 'right', ticks: { font: { size: 18 } } },
                },
                plugins: {
                    title: { display: true, text: 'ppm CO2', font: { size: 18 } },
                    legend: { display: true },
                },
            },
        });
        return canvas;
    }
}
