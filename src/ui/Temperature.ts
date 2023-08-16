import { Canvas, createCanvas } from 'canvas';
import { Chart, registerables } from 'chart.js';
import 'chartjs-adapter-moment';
import { EInkModule } from './EInkModule';
import { sensorData } from './SensorData';

export class TemperatureGraph extends EInkModule {
    timeRange: number; // minutes

    constructor(timeRange: number) {
        super();

        this.timeRange = timeRange;
        this.readyPromise = Promise.all([sensorData.readyPromise]);
    }

    draw(width: number, height: number): Canvas {
        const canvas = createCanvas(width, height);
        const ctx = canvas.getContext('2d') as unknown as CanvasRenderingContext2D;

        const sensorData_ = sensorData.getSensorData(this.timeRange * 60);
        const data = {
            labels: sensorData_.map(({ timestamp }) => timestamp.toISOString()),
            datasets: [{ data: sensorData_.map(({ temperature }) => temperature) }],
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
                    title: { display: true, text: 'Temperature' },
                    legend: { display: false },
                },
            },
        });
        return canvas;
    }
}
