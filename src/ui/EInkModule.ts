import { Canvas, createCanvas } from 'canvas';

export class EInkModule {
    readyPromise: Promise<void[]>;

    constructor() {
        this.readyPromise = Promise.all([Promise.resolve()]);
    }

    async waitForReady(): Promise<void> {
        await this.readyPromise;
    }

    draw(width: number, height: number): Canvas {
        return createCanvas(width, height);
    }
}
