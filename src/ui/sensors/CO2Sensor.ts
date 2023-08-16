class CO2Sensor {
    co2: number;

    constructor() {
        this.co2 = 600;
    }

    async getData(): Promise<number> {
        await new Promise((resolve) => setTimeout(resolve, 100));
        this.co2 = this.co2 + 5.3 - 10 * Math.random();
        return this.co2;
    }
}

export const co2Sensor = new CO2Sensor();
