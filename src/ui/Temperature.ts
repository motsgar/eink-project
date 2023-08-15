import { Canvas, createCanvas } from 'canvas';
import { Chart, registerables } from 'chart.js';
import 'chartjs-adapter-date-fns';
import { EInkModule } from './EInkModule';

export class Temperature extends EInkModule {
    temperatureData: { date: string; temperature: number }[];
    timeRange: number; // minutes

    constructor(timeRange: number) {
        super();

        this.timeRange = timeRange;

        let date = new Date();
        this.temperatureData = [{ date: date.toISOString(), temperature: 19 }];
        for (let i = 1; i < timeRange; i++) {
            date = new Date(date.getTime() + 1 * 60000);
            this.temperatureData.push({
                date: date.toISOString(),
                temperature: this.temperatureData[i - 1].temperature + +0.53 - Math.random(),
            });
        }
    }

    draw(width: number, height: number): Canvas {
        const canvas = createCanvas(width, height);
        const ctx = canvas.getContext('2d') as unknown as CanvasRenderingContext2D;

        const data = {
            labels: this.temperatureData.map(({ date }) => date),
            datasets: [{ data: this.temperatureData.map(({ temperature }) => temperature) }],
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
