import 'chartjs-adapter-moment';
import type { Canvas } from 'canvas';
import type { ScriptableScaleContext } from 'chart.js';

import { createCanvas } from 'canvas';
import { Chart, registerables } from 'chart.js';

import type { ModuleSettings } from '../../../web/src/schema';

import { sensorDataSource } from '../../dataSources/SensorDataSource';
import { EInkModule } from './EInkModule';

export class TemperatureGraph extends EInkModule {
    private readonly timePeriod: number; // Minutes
    private readonly detailedSensorData: boolean;
    private chartInstance?: Chart;

    public constructor(settings: ModuleSettings) {
        super(settings);

        const defaultTimePeriod = 3 * 60;
        this.timePeriod = settings.timePeriod ?? defaultTimePeriod;
        this.detailedSensorData = settings.detailedSensorData ?? false;
    }

    public draw(width: number, height: number): Canvas {
        const canvas = createCanvas(width, height);
        const ctx = canvas.getContext('2d');
        const sensorData = sensorDataSource.getSensorData(this.timePeriod * 60, this.detailedSensorData);

        // Cause gaps in missing data
        for (let i = 1; i < sensorData.length; i++) {
            const timeDiff = sensorData[i].timestamp.getTime() - sensorData[i - 1].timestamp.getTime();
            if (timeDiff > 2 * 60 * 1000) {
                sensorData[i].temperature = Number.NaN;
            }
        }

        const data = {
            labels: sensorData.map(({ timestamp }) => timestamp),
            datasets: [{ data: sensorData.map(({ temperature }) => temperature) }],
        };
        Chart.register(...registerables);

        if (this.chartInstance !== undefined) {
            this.chartInstance.destroy();
        }
        this.chartInstance = new Chart(ctx, {
            type: 'line',
            data,
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
                            font: {
                                size: 25,
                                weight: (context: ScriptableScaleContext | { tick: undefined }) =>
                                    // oxlint-disable-next-line typescript/strict-boolean-expressions
                                    context.tick?.major ? 'bold' : 'normal',
                            },
                        },
                        grid: {
                            color: (context: ScriptableScaleContext | { tick: undefined }) =>
                                // oxlint-disable-next-line typescript/strict-boolean-expressions
                                context.tick?.major || this.timePeriod < 12 * 60 ? '#333333' : '#ffffff00',
                        },
                    },
                    y: {
                        ticks: { font: { size: 25 }, autoSkip: true, maxTicksLimit: 5 },
                        grid: { color: '#999999' },
                    },
                },
                plugins: {
                    title: { display: true, text: 'Temperature', font: { size: 25 } },
                    legend: { display: false },
                },
            },
        });
        return canvas;
    }
}
