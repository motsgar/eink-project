import { Canvas, createCanvas } from 'canvas';
import { Chart, ScriptableScaleContext, registerables } from 'chart.js';
import 'chartjs-adapter-moment';
import { ModuleSettings } from '../../../web/src/schema';
import { sensorData } from '../SensorData';
import { EInkModule } from './EInkModule';

export class EnvGraph extends EInkModule {
    timePeriod: number; // minutes
    detailedSensorData: boolean;
    chartInstance?: Chart;

    constructor(settings: ModuleSettings) {
        super(settings);

        const defaultTimePeriod = 3 * 60;
        this.timePeriod = settings.timePeriod ?? defaultTimePeriod;
        this.detailedSensorData = settings.detailedSensorData ?? false;

        this.readyPromise = Promise.all([sensorData.readyPromise]);
    }

    draw(width: number, height: number): Canvas {
        const canvas = createCanvas(width, height);
        const ctx = canvas.getContext('2d');
        const sensorData_ = sensorData.getSensorData(this.timePeriod * 60, this.detailedSensorData);

        // Cause gaps in missing data
        for (let i = 1; i < sensorData_.length; i++) {
            const timeDiff = sensorData_[i].timestamp.getTime() - sensorData_[i - 1].timestamp.getTime();
            if (timeDiff > 2 * 60 * 1000) {
                sensorData_[i].humidity = NaN;
                sensorData_[i].pressure = NaN;
            }
        }

        const data = {
            labels: sensorData_.map(({ timestamp }) => timestamp),
            datasets: [
                { data: sensorData_.map(({ humidity }) => humidity), label: 'Humidity' },
                {
                    data: sensorData_.map(({ pressure }) => pressure),
                    order: 1,
                    yAxisID: 'y1',
                    label: 'Pressure',
                    segment: { borderDash: [6, 6] },
                },
            ],
        };
        Chart.register(...registerables);

        if (this.chartInstance !== undefined) {
            this.chartInstance.destroy();
        }
        this.chartInstance = new Chart(ctx, {
            type: 'line',
            data: data,
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
                            unit: this.timePeriod >= 60 ? 'hour' : 'minute',
                            displayFormats: {
                                hour: 'HH:mm',
                                minute: 'HH:mm',
                            },
                        },
                        ticks: {
                            major: { enabled: true },
                            font: (context) => ({
                                size: 25,
                                weight: context.tick && context.tick.major ? 'bold' : '',
                            }),
                        },
                        grid: {
                            color: (context: ScriptableScaleContext) =>
                                (context.tick && context.tick.major) || this.timePeriod < 12 * 60
                                    ? '#333333'
                                    : '#ffffff00',
                        },
                    },
                    y: {
                        ticks: { font: { size: 25 }, maxTicksLimit: 5 },
                        grid: { color: '#aaaaaa' },
                    },
                    y1: {
                        position: 'right',
                        ticks: { font: { size: 25 }, maxTicksLimit: 5 },
                        grid: {
                            color: '#ffffff00',
                        },
                    },
                },
                plugins: {
                    title: { display: true, text: 'Humidity & Pressure', font: { size: 25 } },
                    legend: { display: false, labels: { font: { size: 25 } } },
                },
            },
        });
        return canvas;
    }
}
