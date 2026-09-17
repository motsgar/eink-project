import type { Sensor } from 'bme280';

import bme280 from 'bme280';

import { env } from '../../env';

export type EnvData = {
    temperature: number;
    humidity: number;
    pressure: number;
};

class EnvSensor {
    private data?: EnvData;
    private sensor?: Sensor;

    public async start(): Promise<void> {
        if (env.EMULATED_HARDWARE) return;
        await bme280
            .open({
                i2cAddress: 0x76,
                humidityOversampling: bme280.OVERSAMPLE.X1,
                pressureOversampling: bme280.OVERSAMPLE.X16,
                temperatureOversampling: bme280.OVERSAMPLE.X2,
                filterCoefficient: bme280.FILTER.F16,
            })
            .then((sensor) => {
                this.sensor = sensor;
            });
    }

    public async stop(): Promise<void> {
        if (env.EMULATED_HARDWARE) return;
        await this.sensor?.close();
        this.sensor = undefined;
    }

    public async getData(): Promise<EnvData> {
        if (this.sensor === undefined) {
            throw new Error('bme280 sensor is not ready even though readyPromise was awaited');
        }
        const data = await this.sensor.read();

        this.data = {
            temperature: data.temperature,
            humidity: data.humidity,
            pressure: data.pressure,
        };
        return this.data;
    }
}

export const envSensor = new EnvSensor();
