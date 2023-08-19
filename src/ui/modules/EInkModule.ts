import { Canvas, createCanvas } from 'canvas';

export type ModuleSettings = { timePeriod?: number };

export class EInkModule {
    readyPromise: Promise<void[]>;

    constructor(settings: ModuleSettings) {
        void settings;
        this.readyPromise = Promise.all([Promise.resolve()]);
    }

    async waitForReady(): Promise<void> {
        await this.readyPromise;
    }

    draw(width: number, height: number): Canvas {
        return createCanvas(width, height);
    }
}
