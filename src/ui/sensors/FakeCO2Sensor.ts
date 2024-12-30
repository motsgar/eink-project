type FakeData = { value: number; min: number; max: number; dx: number };

class FakeCO2Sensor {
    co2: number;
    private fakeCo2: FakeData;

    constructor() {
        this.co2 = 600;
        this.fakeCo2 = { value: 600, min: 450, max: 4000, dx: 0 };
    }

    private nextValue(fakeData: FakeData): number {
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

    getFakeData(amount: number): number[] {
        const data = [];
        for (let i = 0; i < amount; i++) {
            this.co2 = this.nextValue(this.fakeCo2);
            data.push(this.co2);
        }
        return data;
    }

    async getData(): Promise<number> {
        await new Promise((resolve) => setTimeout(resolve, 100));
        this.co2 = this.nextValue(this.fakeCo2);
        return this.co2;
    }
}

export const fakeCo2Sensor = new FakeCO2Sensor();
