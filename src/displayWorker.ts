import { ENDIANNESS, IMAGE_ROTATION, IT8951, type PIXEL_PACKING, type SystemInfo, WAVEFORM } from 'it8951';
import { parentPort as _parentPort } from 'node:worker_threads';

import { DisplayOperationError, type FromWorkerMessage, type ToWorkerMessage } from './displayWorkerMessageTypes';
import { DISPLAY_VOLTAGE } from './env';

if (_parentPort === null) {
    throw new Error('Display worker must be run as a worker thread');
}
const parentPort = _parentPort;

let screen: IT8951 | undefined;
let screenInfo: SystemInfo | undefined;
let enabled = false;

const initialize = (): void => {
    const vcom = -DISPLAY_VOLTAGE * 1000;
    
    screen = new IT8951(vcom);
    console.log('worker screen initialize start');
    screenInfo = screen.systemInfo();
    enabled = true;

    screen.displayArea(0, 0, screenInfo.width, screenInfo.height, WAVEFORM.INIT);
};

const enable = async (): Promise<void> => {
    if (screen === undefined) {
        throw new DisplayOperationError('Display not initialized');
    }
    if (enabled) return;
    enabled = true;

    // console.log('worker screen run start');
    screen.run();
    await screen.waitForDisplayReady();
    // console.log('worker screen run end');
};

const disable = (): void => {
    if (screen === undefined) {
        throw new DisplayOperationError('Display not initialized');
    }
    if (!enabled) return;
    enabled = false;

    console.error(Date.now(), 'worker screen sleep start');
    screen.sleep();
    console.error(Date.now(), 'worker screen sleep end');
};

const displayArea = (x: number, y: number, width: number, height: number, mode: WAVEFORM): void => {
    if (screen === undefined) {
        throw new DisplayOperationError('Display not initialized');
    }
    if (!enabled) {
        throw new DisplayOperationError('Display not enabled');
    }
    if (x < 0 || y < 0 || x + width > screenInfo!.width || y + height > screenInfo!.height) {
        throw new DisplayOperationError(`Draw area outside of display: (${x}, ${y}) - (${x + width}, ${y + height})`);
    }
    console.error(Date.now(), 'worker display area start');
    screen.displayArea(x, y, width, height, mode);
    const now = Date.now();
    while (now + 1000 > Date.now()) {
        // TODO:
    }
    console.error(Date.now(), 'worker display area end');
};

const writePixels = (
    x: number,
    y: number,
    width: number,
    height: number,
    image: Buffer,
    bpp: PIXEL_PACKING,
    rotate: IMAGE_ROTATION = IMAGE_ROTATION.ROTATE_0,
    endianism: ENDIANNESS = ENDIANNESS.LITTLE,
): void => {
    if (screen === undefined) {
        throw new DisplayOperationError('Display not initialized');
    }
    if (!enabled) {
        throw new DisplayOperationError('Display not enabled');
    }
    if (x < 0 || y < 0 || x + width > screenInfo!.width || y + height > screenInfo!.height) {
        throw new DisplayOperationError(`Write area outside of display: (${x}, ${y}) - (${x + width}, ${y + height})`);
    }

    screen.writePixels(x, y, width, height, image, bpp, rotate, endianism);
};

const postMessage = <MessageType extends FromWorkerMessage['type']>(
    type: MessageType,
    message: Omit<Extract<FromWorkerMessage, { type: MessageType }>, 'type'>,
): void => {
    parentPort.postMessage({ ...message, type });
};

parentPort.on('message', (msg: ToWorkerMessage) => {
    (async () => {
        try {
            switch (msg.type) {
                case 'initialize':
                    initialize();
                    if (screenInfo === undefined) {
                        throw new Error('Should not happen');
                    }
                    postMessage('initialize', {
                        width: screenInfo.width,
                        height: screenInfo.height,
                        firmware: screenInfo.firmware,
                    });
                    break;
                case 'enable':
                    await enable();
                    postMessage('enable', {});
                    break;
                case 'disable':
                    disable();
                    postMessage('disable', {});
                    break;
                case 'displayArea':
                    displayArea(msg.x, msg.y, msg.width, msg.height, msg.mode);
                    postMessage('displayArea', {});
                    break;
                case 'writePixels':
                    writePixels(msg.x, msg.y, msg.width, msg.height, msg.image, msg.bpp, msg.rotate, msg.endianism);
                    postMessage('writePixels', {});
                    break;
                case 'screenInfo':
                    if (screenInfo === undefined) {
                        throw new DisplayOperationError('Display not initialized');
                    }
                    postMessage('screenInfo', {
                        width: screenInfo.width,
                        height: screenInfo.height,
                        firmware: screenInfo.firmware,
                    });
                    break;
                default:
                    break;
            }
        } catch (error) {
            if (error instanceof DisplayOperationError) {
                postMessage('error', { err: error });
                return;
            }
            throw error;
        }
    })().catch(console.error);
});

parentPort.on('messageerror', (err) => {
    console.error('Display worker thread message error');
    throw err;
});
