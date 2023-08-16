type EnvData = {
    temperature: number;
    humidity: number;
    pressure: number;
};

class EnvSensor {
    data: EnvData;

    constructor() {
        this.data = {
            temperature: 19,
            humidity: 50,
            pressure: 1000,
        };
    }

    async getData(): Promise<EnvData> {
        await new Promise((resolve) => setTimeout(resolve, 100));

        this.data.temperature = this.data.temperature + 0.053 - 0.1 * Math.random();
        this.data.humidity = this.data.humidity + 0.053 - 0.1 * Math.random();
        this.data.pressure = this.data.pressure + 0.53 - Math.random();
        return this.data;
    }
}

export const envSensor = new EnvSensor();
