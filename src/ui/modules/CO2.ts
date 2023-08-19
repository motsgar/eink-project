import { Canvas, createCanvas } from 'canvas';
import { Chart, registerables } from 'chart.js';
import 'chartjs-adapter-moment';
import { sensorData } from '../SensorData';
import { EInkModule, ModuleSettings } from './EInkModule';

export class CO2Graph extends EInkModule {
    timePeriod: number; // minutes

    constructor(settings: ModuleSettings) {
        super(settings);

        const defaultTimePeriod = 3 * 60;
        this.timePeriod = settings.timePeriod || defaultTimePeriod;

        this.readyPromise = Promise.all([sensorData.readyPromise]);
    }

    draw(width: number, height: number): Canvas {
        const canvas = createCanvas(width, height);
        const ctx = canvas.getContext('2d') as unknown as CanvasRenderingContext2D;

        const sensorData_ = sensorData.getSensorData(this.timePeriod * 60);
        const data = {
            labels: sensorData_.map(({ timestamp }) => timestamp.toISOString()),
            datasets: [{ data: sensorData_.map(({ co2 }) => co2) }],
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
                },
                plugins: {
                    title: { display: true, text: 'ppm CO2' },
                    legend: { display: false },
                },
            },
        });
        return canvas;
    }
}
