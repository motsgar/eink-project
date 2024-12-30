import bme280, { type Sensor } from 'bme280';

import { DEV } from '../../env';

export type EnvData = {
    temperature: number;
    humidity: number;
    pressure: number;
};

class EnvSensor {
    data?: EnvData;
    private sensor?: Sensor;

    async start(): Promise<void> {
        if (DEV) return;
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

    async stop(): Promise<void> {
        if (DEV) return;
        await this.sensor?.close();
        this.sensor = undefined;
    }

    async getData(): Promise<EnvData> {
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
