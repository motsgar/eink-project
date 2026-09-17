import type { Canvas } from 'canvas';

import { createCanvas } from 'canvas';

import type { ModuleSettings } from '../../../web/src/schema';

export class EInkModule {
    public readyPromise?: Promise<unknown>;

    public constructor(settings: ModuleSettings) {
        void settings;
    }

    // oxlint-disable-next-line class-methods-use-this
    public draw(width: number, height: number): Canvas {
        return createCanvas(width, height);
    }
}
