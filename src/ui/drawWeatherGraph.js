import { createCanvas } from 'canvas';
import { Chart, registerables } from 'chart.js';
import 'chartjs-adapter-date-fns';
import { promises as fs } from 'fs';

const readJsonFile = async (filePath) => {
    try {
        const data = await fs.readFile(filePath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        throw error;
    }
};
const parseTime = (dateString) => {
    const year = parseInt(dateString.substr(0, 4), 10);
    const month = parseInt(dateString.substr(4, 2), 10) - 1;
    const day = parseInt(dateString.substr(6, 2), 10);
    const hour = parseInt(dateString.substr(9, 2), 10);
    const minute = parseInt(dateString.substr(11, 2), 10);
    const second = parseInt(dateString.substr(13, 2), 10);

    return new Date(Date.UTC(year, month, day, hour, minute, second)).toISOString();
};

const getData = async () => {
    const filePath = 'files/data.json';
    const jsonData = await readJsonFile(filePath);
    let forecasts = jsonData['forecasts'][0]['forecast'];

    let labels = [];
    let tempData = [];
    let feelslikeData = [];
    let rainData = [];
    for (let i = 0; i <= 24; i++) {
        labels.push(parseTime(forecasts[i]['localtime']));
        tempData.push(forecasts[i]['Temperature']);
        feelslikeData.push(forecasts[i]['FeelsLike']);
        rainData.push(parseFloat(forecasts[i]['Precipitation1h']) + 3 * Math.random()); // TODO: remove random
    }
    return { labels, tempData, feelslikeData, rainData };
};

export const drawWeatherGraph = async (width, height) => {
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    const { labels, tempData, feelslikeData, rainData } = await getData();

    const graphData = {
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
};
