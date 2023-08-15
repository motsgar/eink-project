import { Canvas, createCanvas } from 'canvas';

export class EInkModule {
    async draw(width: number, height: number): Promise<Canvas> {
        return createCanvas(width, height);
    }
}
