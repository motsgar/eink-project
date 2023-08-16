class CO2Sensor {
    co2: number;

    constructor() {
        this.co2 = 600;
    }

    getFakeData(amount: number): number[] {
        const data = [];
        for (let i = 0; i < amount; i++) {
            this.co2 = this.co2 + 5.3 - 10 * Math.random();
            data.push(this.co2);
        }
        return data;
    }

    async getData(): Promise<number> {
        await new Promise((resolve) => setTimeout(resolve, 100));
        this.co2 = this.co2 + 5.3 - 10 * Math.random();
        return this.co2;
    }
}

export const co2Sensor = new CO2Sensor();
