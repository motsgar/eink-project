import { type Canvas, createCanvas } from 'canvas';

import type { ModuleSettings } from '../../../web/src/schema';

export class EInkModule {
    readyPromise?: Promise<unknown>;

    constructor(settings: ModuleSettings) {
        void settings;
    }

    draw(width: number, height: number): Canvas {
        return createCanvas(width, height);
    }
}
