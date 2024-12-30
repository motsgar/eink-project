import bme280 from 'bme280';

export type EnvData = {
    temperature: number;
    humidity: number;
    pressure: number;
};

type Sensor = {
    read: () => Promise<{ temperature: number; humidity: number; pressure: number }>;
};

class EnvSensor {
    data?: EnvData;
    private readyPromise?: Promise<void>;
    private sensor?: Sensor;

    constructor() {
        if (process.env.DEV === 'true') return;
        this.readyPromise = bme280
            .open({
                i2cAddress: 0x76,
                humidityOversampling: bme280.OVERSAMPLE.X1,
                pressureOversampling: bme280.OVERSAMPLE.X16,
                temperatureOversampling: bme280.OVERSAMPLE.X2,
                filterCoefficient: bme280.FILTER.F16,
            })
            .then((sensor: Sensor) => {
                this.sensor = sensor;
            });
    }

    async getData(): Promise<EnvData> {
        await this.readyPromise;
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
