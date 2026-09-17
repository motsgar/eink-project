type EnvData = {
    temperature: number;
    humidity: number;
    pressure: number;
};

type FakeData = { value: number; min: number; max: number; dx: number };
type FakeEnvData = {
    temperature: FakeData;
    humidity: FakeData;
    pressure: FakeData;
};

class FakeEnvSensor {
    private readonly data: EnvData;
    private readonly fakeData: FakeEnvData;

    public constructor() {
        this.data = {
            temperature: 19,
            humidity: 50,
            pressure: 1000,
        };
        this.fakeData = {
            temperature: { value: 19, min: 19, max: 29, dx: 0 },
            humidity: { value: 50, min: 30, max: 70, dx: 0 },
            pressure: { value: 1000, min: 980, max: 1020, dx: 0 },
        };
    }

    private static nextValue(fakeData: FakeData): number {
        const range = fakeData.max - fakeData.min;
        const half = (fakeData.max + fakeData.min) / 2;
        const step = (fakeData.max - fakeData.min) / 2000;
        const maxDx = range / 1000;

        const offset = 0.5 - (0.25 * Math.abs(fakeData.value - half)) / range;

        if (fakeData.value > half) {
            fakeData.dx = Math.max(fakeData.dx - step * (Math.random() - offset), -maxDx);
        } else {
            fakeData.dx = Math.min(fakeData.dx + step * (Math.random() - offset), maxDx);
        }
        fakeData.value += fakeData.dx;
        return fakeData.value;
    }

    public getFakeData(amount: number): EnvData[] {
        const data = [];
        for (let i = 0; i < amount; i++) {
            this.data.temperature = FakeEnvSensor.nextValue(this.fakeData.temperature);
            this.data.humidity = FakeEnvSensor.nextValue(this.fakeData.humidity);
            this.data.pressure = FakeEnvSensor.nextValue(this.fakeData.pressure);
            data.push({ ...this.data });
        }
        return data;
    }

    public async getData(): Promise<EnvData> {
        await new Promise((resolve) => {
            setTimeout(resolve, 100);
        });

        this.data.temperature = FakeEnvSensor.nextValue(this.fakeData.temperature);
        this.data.humidity = FakeEnvSensor.nextValue(this.fakeData.humidity);
        this.data.pressure = FakeEnvSensor.nextValue(this.fakeData.pressure);
        return this.data;
    }
}

export const fakeEnvSensor = new FakeEnvSensor();
