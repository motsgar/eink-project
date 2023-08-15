import { createCanvas } from 'canvas';
import { Chart, registerables } from 'chart.js';
import 'chartjs-adapter-date-fns';

export const drawTemp = (width, height) => {
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    let date = new Date();
    let labels = [date.toISOString()];
    let tempData = [19];
    for (let i = 1; i < 60 * 3; i++) {
        date = new Date(date.getTime() + 1 * 60000);
        tempData.push(tempData[i - 1] + 0.53 - Math.random());
        labels.push(date.toISOString());
    }

    const data = {
        labels: labels,
        datasets: [{ data: tempData }],
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
};
