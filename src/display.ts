import type { Canvas } from 'canvas';
import { ENDIANNESS, IMAGE_ROTATION, PIXEL_PACKING, WAVEFORM } from 'it8951';
import { EventEmitter, once } from 'node:events';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Worker } from 'node:worker_threads';

import {
    DisplayOperationError,
    type FromWorkerMessage,
    type ScreenInfoProps,
    type ToWorkerMessage,
} from './displayWorkerMessageTypes';

const workerPath = path.dirname(fileURLToPath(import.meta.url));
const worker = new Worker(path.resolve(workerPath, 'displayWorker.js'));

let cleanupRunning = false;
let turnRunning = false;
const nextTurnEvent = new EventEmitter();

const turnWrapper = <ReturnType, Args extends unknown[]>(
    fn: (...args: Args) => Promise<ReturnType>,
): ((...args: Args) => Promise<ReturnType>) => {
    return async (...args) => {
        if (turnRunning) {
            // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
            while (true) {
                await once(nextTurnEvent, 'next');
                if (!turnRunning) break; // eslint-disable-line @typescript-eslint/no-unnecessary-condition
            }
        }
        turnRunning = true;

        const result = await fn(...args);

        turnRunning = false;
        nextTurnEvent.emit('next');
        return result;
    };
};

type ResponseForMessageType<MessageType extends ToWorkerMessage['type']> =
    Extract<FromWorkerMessage, { type: MessageType }> extends never
        ? void
        : Omit<Extract<FromWorkerMessage, { type: MessageType }>, 'type'>;

const postMessage = async <MessageType extends ToWorkerMessage['type']>(
    messageType: MessageType,
    message: Omit<Extract<ToWorkerMessage, { type: MessageType }>, 'type'>,
): Promise<ResponseForMessageType<MessageType>> => {
    worker.postMessage({ ...message, type: messageType });

    return new Promise((resolve, reject) => {
        worker.once('message', (response: FromWorkerMessage) => {
            if (response.type === 'error') {
                reject(response.err);
                return;
            }
            if (response.type !== messageType) {
                reject(
                    new DisplayOperationError(
                        `Received other response type than expected (${messageType}): ${response.type}`,
                    ),
                );
                return;
            }

            const responseData = response as unknown as ResponseForMessageType<MessageType> & {
                type?: MessageType;
            };
            delete responseData.type;

            resolve(responseData);
        });
    });
};

worker.on('error', (err) => {
    console.error('Display worker thread error');
    throw err;
});
worker.on('exit', (code) => {
    throw new Error(`Display worker thread stopped with exit code ${code}`);
});
worker.on('messageError', (err) => {
    console.error('Display worker main message error');
    throw err;
});

const screen = {
    initialize: turnWrapper(async () => postMessage('initialize', {})),
    enable: turnWrapper(async () => postMessage('enable', {})),
    disable: turnWrapper(async () => {
        console.error(Date.now(), 'disable start');
        await postMessage('disable', {});
        console.error(Date.now(), 'disable end');
    }),
    displayArea: turnWrapper(async (x: number, y: number, width: number, height: number, mode: WAVEFORM) => {
        console.error(Date.now(), 'display area start main');
        await postMessage('displayArea', { x, y, width, height, mode });
        console.error(Date.now(), 'display area end main');
    }),
    writePixels: turnWrapper(
        async (
            x: number,
            y: number,
            width: number,
            height: number,
            image: Buffer,
            bpp: PIXEL_PACKING,
            rotate?: IMAGE_ROTATION,
            endianism?: ENDIANNESS,
        ) => postMessage('writePixels', { x, y, width, height, image, bpp, rotate, endianism }),
    ),
    screenInfo: undefined as undefined | ScreenInfoProps,
};

export const initialize = async (): Promise<void> => {
    console.log('Initializing display');

    const screenInfo = await screen.initialize();
    screen.screenInfo = screenInfo;

    console.log('Display initialized');
};

const convertTo4BPP = (image: Canvas): Buffer => {
    const buffer = Buffer.alloc((image.width * image.height) / 2);
    const ctx = image.getContext('2d');

    const data = ctx.getImageData(0, 0, image.width, image.height).data;
    for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        const gray = Math.round(((r + g + b) / 3 / 255) * 15);
        const index = Math.floor(i / 8);
        buffer[index] = buffer[index] | (i % 8 === 0 ? gray << 4 : gray);
    }
    return buffer;
};

export enum BPP {
    BPP1 = 1,
    BPP2 = 2,
    BPP4 = 4,
}

export const writeCanvas = async (x: number, y: number, canvas: Canvas, bpp: BPP): Promise<void> => {
    if (cleanupRunning) return new Promise((resolve) => setImmediate(resolve));

    const image = convertTo4BPP(canvas);

    const conversionTable = {
        [BPP.BPP1]: PIXEL_PACKING.BPP2,
        [BPP.BPP2]: PIXEL_PACKING.BPP2,
        [BPP.BPP4]: PIXEL_PACKING.BPP4,
    };

    await Promise.all([
        screen.enable(),
        screen.writePixels(x, y, canvas.width, canvas.height, image, conversionTable[bpp]),
        screen.disable(),
    ]);
};

export const displayArea = async (x: number, y: number, dx: number, dy: number, mode: WAVEFORM): Promise<void> => {
    if (cleanupRunning) return new Promise((resolve) => setImmediate(resolve));

    await Promise.all([screen.enable(), screen.displayArea(x, y, dx, dy, mode), screen.disable()]);
};

export const drawCanvas = async (x: number, y: number, canvas: Canvas): Promise<void> => {
    if (cleanupRunning) return new Promise((resolve) => setImmediate(resolve));

    const image = convertTo4BPP(canvas);

    await Promise.all([
        screen.enable(),
        screen.writePixels(
            x,
            y,
            canvas.width,
            canvas.height,
            image,
            PIXEL_PACKING.BPP4,
            IMAGE_ROTATION.ROTATE_0,
            ENDIANNESS.BIG,
        ),
        screen.displayArea(x, y, canvas.width, canvas.height, WAVEFORM.GC16),
        screen.disable(),
    ]);
};

export const stopDisplay = async (): Promise<void> => {
    if (cleanupRunning) return;

    console.log('Cleaning up display');
    cleanupRunning = true;

    if (screen.screenInfo !== undefined) {
        await Promise.all([
            screen.enable(),
            screen.displayArea(0, 0, screen.screenInfo.width, screen.screenInfo.height, WAVEFORM.INIT),
            screen.disable(),
        ]).catch((err) => {
            console.error('fail cleanup, try without display clear');
            console.error(err);

            screen.disable().catch((err2) => {
                console.error('fail simple cleanup, display might be left in bad state');
                console.error(err2);
            });
        });
    } else {
        await screen.disable().catch((err) => {
            console.error('fail simple cleanup, display might be left in bad state');
            console.error(err);
        });
    }
    console.log('Display clean up done');
};
