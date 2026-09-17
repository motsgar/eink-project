import * as fs from 'node:fs/promises';

import { env } from '../env';
import { co2Sensor } from './sensors/CO2Sensor';
import { envSensor } from './sensors/EnvSensor';
import { fakeCo2Sensor } from './sensors/FakeCO2Sensor';
import { fakeEnvSensor } from './sensors/FakeEnvSensor';

const OFFSET = 200;

export type SensorDataType = {
    timestamp: Date;
    co2: number;
    temperature: number;
    humidity: number;
    pressure: number;
};

class SensorDataSource {
    public latestData?: SensorDataType;
    private sensorHistory: SensorDataType[];
    private dataLoopTimeout?: NodeJS.Timeout;
    private thinDataInterval?: NodeJS.Timeout;

    public constructor() {
        this.sensorHistory = [];
    }

    private static async thinDataFiles(): Promise<void> {
        const dataDir = 'sensorData';

        const now = new Date();
        const files = await fs.readdir(dataDir);
        for (const filename of files) {
            if (!filename.endsWith('.bin') || filename.endsWith('thin.bin')) continue;

            const basename = filename.split('.')[0];
            const date = new Date(basename);
            if (now.getTime() - date.getTime() < 7 * 24 * 60 * 60 * 1000) continue;

            console.log(`Converting ${dataDir}/${filename} to ${dataDir}/${basename}.thin.bin`);

            // TODO: Parallelize
            // oxlint-disable-next-line no-await-in-loop
            const fileData = await fs.readFile(`${dataDir}/${filename}`);
            let data = [];
            for (let i = 0; i < fileData.length; i += 5 * 8) {
                const timestamp = new Date(Number(fileData.readBigInt64LE(i)));
                const co2 = fileData.readFloatLE(i + 8);
                const temperature = fileData.readFloatLE(i + 16);
                const humidity = fileData.readFloatLE(i + 24);
                const pressure = fileData.readFloatLE(i + 32);
                data.push({ timestamp, co2, temperature, humidity, pressure });
            }
            data = data.filter((sensorData) => sensorData.timestamp.getSeconds() === 0);

            const buffer = Buffer.allocUnsafe(5 * 8 * data.length);
            for (const [i, datum] of data.entries()) {
                const offset = i * 5 * 8;
                buffer.writeBigInt64LE(BigInt(datum.timestamp.getTime()), offset);
                buffer.writeFloatLE(datum.co2, offset + 8);
                buffer.writeFloatLE(datum.temperature, offset + 16);
                buffer.writeFloatLE(datum.humidity, offset + 24);
                buffer.writeFloatLE(datum.pressure, offset + 32);
            }

            // TODO: Use try/await instead of [.then().catch()]
            // oxlint-disable-next-line no-await-in-loop
            await fs
                .writeFile(`${dataDir}/${basename}.thin.bin`, buffer)
                .then(async () => {
                    await fs.rm(`${dataDir}/${filename}`);
                    console.log(`Finished converting ${dataDir}/${filename} to ${dataDir}/${basename}.thin.bin`);
                })
                .catch((error) => {
                    throw error;
                });
        }
    }

    public async init(): Promise<void> {
        return env.EMULATED_HARDWARE
            ? this.writeFakeData().then(async () => {
                  await this.readDataFromFile();
              })
            : this.readDataFromFile();
    }

    public async start(): Promise<void> {
        // oxlint-disable-next-line typescript/await-thenable typescript/no-confusing-void-expression
        await Promise.all([co2Sensor.start(), envSensor.start()]);
        await this.sensorDataLoop();

        this.thinDataInterval = setInterval(
            () => {
                SensorDataSource.thinDataFiles().catch(console.error);
            },
            24 * 60 * 60 * 1000,
        );
    }

    public async stop(): Promise<void> {
        clearTimeout(this.dataLoopTimeout);
        this.dataLoopTimeout = undefined;

        // oxlint-disable-next-line typescript/await-thenable typescript/no-confusing-void-expression
        await Promise.all([co2Sensor.stop(), envSensor.stop()]);

        clearInterval(this.thinDataInterval);
        this.thinDataInterval = undefined;
    }

    private async sensorDataLoop(): Promise<void> {
        const nextDate = new Date();
        const milliseconds = nextDate.getMilliseconds();
        nextDate.setMilliseconds(1000);
        return new Promise((resolve) => {
            let timeoutTime = 1000 - milliseconds - OFFSET;
            if (timeoutTime < 0) timeoutTime += 1000;
            this.dataLoopTimeout = setTimeout(() => {
                (async () => {
                    await this.readSensorData(nextDate);
                    resolve();

                    // Avoid race conditions
                    if (this.dataLoopTimeout !== undefined) void this.sensorDataLoop();
                })().catch(console.error);
            }, timeoutTime);
        });
    }

    private filterSensorData(): void {
        const date = new Date();
        this.sensorHistory = this.sensorHistory.filter((sensorData) => {
            const timeDiff = date.getTime() - sensorData.timestamp.getTime();
            return (
                timeDiff < 60 * 60 * 1000 ||
                (timeDiff < 8 * 24 * 60 * 60 * 1000 && sensorData.timestamp.getSeconds() === 0)
            );
        });
    }

    private async setSensorData(data: SensorDataType): Promise<void> {
        this.sensorHistory.push(data);
        this.filterSensorData();

        const year = data.timestamp.getUTCFullYear().toString().padStart(4, '0');
        const month = (data.timestamp.getUTCMonth() + 1).toString().padStart(2, '0');
        const day = data.timestamp.getUTCDate().toString().padStart(2, '0');
        const filepath = `sensorData/${year}-${month}-${day}.bin`;
        const buffer = Buffer.allocUnsafe(5 * 8);
        buffer.writeBigInt64LE(BigInt(data.timestamp.getTime()));
        buffer.writeFloatLE(data.co2, 8);
        buffer.writeFloatLE(data.temperature, 16);
        buffer.writeFloatLE(data.humidity, 24);
        buffer.writeFloatLE(data.pressure, 32);
        await fs.appendFile(filepath, buffer);
    }

    private async writeFakeData(): Promise<void> {
        const dataDir = 'sensorData';
        try {
            await fs.mkdir(dataDir);
        } catch (error) {
            if (error instanceof Error && 'code' in error && error.code === 'EEXIST') {
                return;
            }
            throw error;
        }

        console.log("\nSensorData history doesn't exist. Creating fake data...");

        const amount = 7 * 24 * 60 * 60;
        const co2Data = fakeCo2Sensor.getFakeData(amount);
        const envData = fakeEnvSensor.getFakeData(amount);
        const date = new Date();
        const now = new Date();
        date.setMilliseconds(0);
        date.setSeconds(0);
        date.setTime(date.getTime() - amount * 1000);
        for (let i = 0; i < amount; i++) {
            if (i % 100_000 === 0) {
                console.log(`${i}/${amount}`);
            }

            const timeDiff = now.getTime() - date.getTime();
            if (timeDiff < 60 * 60 * 1000 || (timeDiff < 8 * 24 * 60 * 60 * 1000 && date.getSeconds() === 0)) {
                const data = {
                    timestamp: new Date(date),
                    co2: co2Data[i],
                    ...envData[i],
                };
                // oxlint-disable-next-line no-await-in-loop -- We want to do this sequentially
                await this.setSensorData(data);
            }

            date.setTime(date.getTime() + 1000);
        }
        this.sensorHistory.length = 0;
        console.log();
    }

    private async readDataFromFile(): Promise<void> {
        const dataDir = 'sensorData';
        // Create dir if it doesn't exist
        await fs.mkdir(dataDir).catch(() => {
            // Ignore error
        });

        const files = await fs.readdir(dataDir);
        for (const filename of files) {
            if (!filename.endsWith('.bin')) continue;

            const basename = filename.split('.')[0];
            if (!filename.endsWith('thin.bin') && files.includes(`${basename}.thin.bin`)) continue;

            // oxlint-disable-next-line no-await-in-loop -- We want to do this sequentially
            const data = await fs.readFile(`${dataDir}/${filename}`);
            for (let i = 0; i < data.length; i += 5 * 8) {
                const timestamp = new Date(Number(data.readBigInt64LE(i)));
                const co2 = data.readFloatLE(i + 8);
                const temperature = data.readFloatLE(i + 16);
                const humidity = data.readFloatLE(i + 24);
                const pressure = data.readFloatLE(i + 32);
                this.sensorHistory.push({ timestamp, co2, temperature, humidity, pressure });
            }
        }

        this.filterSensorData();
    }

    public getSensorData(timePeriod: number, getSeconds = false): SensorDataType[] {
        if (timePeriod > 7 * 24 * 60 * 60) throw new Error('Tried to get sensor data for more than 7 days'); // TODO:

        const date = new Date();
        return this.sensorHistory.filter((sensorData) => {
            const timeDiff = date.getTime() - sensorData.timestamp.getTime();
            return timeDiff < timePeriod * 1000 && (getSeconds || sensorData.timestamp.getSeconds() === 0);
        });
    }

    private async readSensorData(timestamp: Date): Promise<void> {
        const promise = env.EMULATED_HARDWARE
            ? Promise.all([fakeCo2Sensor.getData(), fakeEnvSensor.getData()])
            : Promise.all([co2Sensor.getData(), envSensor.getData()]);
        await promise
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

export const sensorDataSource = new SensorDataSource();
