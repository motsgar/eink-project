import { Canvas, createCanvas } from 'canvas';
import { Chart, registerables } from 'chart.js';
import 'chartjs-adapter-date-fns';

export const drawCO2 = (width: number, height: number): Canvas => {
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d') as unknown as CanvasRenderingContext2D;

    let date = new Date();
    const labels = [date.toISOString()];
    const CO2Data = [600];
    for (let i = 1; i < 60 * 3; i++) {
        date = new Date(date.getTime() + 1 * 60000);
        CO2Data.push(CO2Data[i - 1] + 53 - 100 * Math.random());
        labels.push(date.toISOString());
    }

    const data = {
        labels: labels,
        datasets: [{ data: CO2Data }],
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
};
