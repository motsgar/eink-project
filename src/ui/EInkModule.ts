import { Canvas, createCanvas } from 'canvas';

export class EInkModule {
    draw(width: number, height: number): Canvas {
        return createCanvas(width, height);
    }
}
