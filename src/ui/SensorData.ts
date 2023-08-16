import * as fs from 'fs/promises';
import { co2Sensor } from './sensors/CO2Sensor';
import { envSensor } from './sensors/EnvSensor';
const OFFSET = 200;

export type SensorDataType = {
    timestamp: Date;
    co2: number;
    temperature: number;
    humidity: number;
    pressure: number;
};

class SensorData {
    latestData?: SensorDataType;
    private sensorHistory: SensorDataType[];
    readyPromise: Promise<void>;

    constructor() {
        this.sensorHistory = [];

        // Generate fake history 8)
        const amount = 7 * 24 * 60;
        const co2Data = co2Sensor.getFakeData(amount).reverse();
        const envData = envSensor.getFakeData(amount).reverse();
        const date = new Date();
        date.setMilliseconds(0);
        date.setSeconds(0);
        for (let i = 0; i < amount; i++) {
            const data = {
                timestamp: new Date(date.getTime()),
                co2: co2Data[i],
                ...envData[i],
            };
            this.sensorHistory.push(data);
            this.sensorHistory = this.sensorHistory.filter((sensorData) => {
                const timeDiff = data.timestamp.getTime() - sensorData.timestamp.getTime();
                return (
                    timeDiff < 24 * 60 * 60 * 1000 ||
                    (timeDiff < 8 * 24 * 60 * 60 * 1000 && sensorData.timestamp.getSeconds() === 0)
                );
            });
            date.setTime(date.getTime() - 60 * 1000);
        }
        // Fake history finisheds

        this.readyPromise = new Promise((resolve, reject) => {
            this.sensorDataLoop()
                .then(() => {
                    resolve();
                })
                .catch((error) => {
                    reject(error);
                });
        });
    }

    private sensorDataLoop(): Promise<void> {
        const nextDate = new Date();
        const milliseconds = nextDate.getMilliseconds();
        nextDate.setMilliseconds(1000);
        return new Promise((resolve) => {
            let timeoutTime = 1000 - milliseconds - OFFSET;
            if (timeoutTime < 0) timeoutTime += 1000;
            setTimeout(async () => {
                await this.readSensorData(nextDate);
                resolve();
                void this.sensorDataLoop();
            }, timeoutTime);
        });
    }

    getSensorData(timePeriod: number, onlyMinutes = true): SensorDataType[] {
        if (timePeriod > 7 * 24 * 60 * 60) throw new Error('Tried to get sensor data for more than 7 days'); // TODO:

        const date = new Date();
        return this.sensorHistory.filter((sensorData) => {
            const timeDiff = date.getTime() - sensorData.timestamp.getTime();
            return timeDiff < timePeriod * 1000 && (!onlyMinutes || sensorData.timestamp.getSeconds() == 0);
        });
    }

    private async setSensorData(data: SensorDataType): Promise<void> {
        this.sensorHistory.push(data);
        this.sensorHistory = this.sensorHistory.filter((sensorData) => {
            const timeDiff = data.timestamp.getTime() - sensorData.timestamp.getTime();
            return (
                timeDiff < 24 * 60 * 60 * 1000 ||
                (timeDiff < 8 * 24 * 60 * 60 * 1000 && sensorData.timestamp.getSeconds() == 0)
            );
        });

        const year = data.timestamp.getUTCFullYear().toString().padStart(4, '0');
        const month = data.timestamp.getUTCMonth().toString().padStart(4, '2');
        const day = data.timestamp.getUTCDay().toString().padStart(4, '2');
        const filepath = `sensorData/${year}-${month}-${day}.bin`;
        const buffer = Buffer.allocUnsafe(5 * 8);
        buffer.writeBigInt64LE(BigInt(data.timestamp.getTime()));
        buffer.writeFloatLE(data.co2, 8);
        buffer.writeFloatLE(data.temperature, 16);
        buffer.writeFloatLE(data.humidity, 24);
        buffer.writeFloatLE(data.pressure, 32);
        await fs.appendFile(filepath, buffer);
    }

    private async readSensorData(timestamp: Date): Promise<void> {
        await Promise.all([co2Sensor.getData(), envSensor.getData()])
            .then(async ([co2Data, envData]) => {
                this.latestData = {
                    timestamp,
                    co2: co2Data,
                    ...envData,
                };
                await this.setSensorData(this.latestData);
            })
            .catch(console.error);
    }
}

export const sensorData = new SensorData();
