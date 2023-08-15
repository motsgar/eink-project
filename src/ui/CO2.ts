import { Canvas, createCanvas } from 'canvas';
import { Chart, registerables } from 'chart.js';
import 'chartjs-adapter-date-fns';
import { EInkModule } from './EInkModule';

export class CO2Module extends EInkModule {
    CO2Data: { date: string; CO2: number }[];
    timeRange: number; // minutes

    constructor(timeRange: number) {
        super();

        this.timeRange = timeRange;

        let date = new Date();
        this.CO2Data = [{ date: date.toISOString(), CO2: 600 }];
        for (let i = 1; i < timeRange; i++) {
            date = new Date(date.getTime() + 1 * 60000);
            this.CO2Data.push({
                date: date.toISOString(),
                CO2: this.CO2Data[i - 1].CO2 + 53 - 100 * Math.random(),
            });
        }
    }

    draw(width: number, height: number): Canvas {
        const canvas = createCanvas(width, height);
        const ctx = canvas.getContext('2d') as unknown as CanvasRenderingContext2D;

        const data = {
            labels: this.CO2Data.map(({ date }) => date),
            datasets: [{ data: this.CO2Data.map(({ CO2 }) => CO2) }],
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
