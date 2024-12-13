import type { ENDIANNESS, IMAGE_ROTATION, PIXEL_PACKING, WAVEFORM } from 'it8951';

export class DisplayOperationError extends Error {
    constructor(message: string) {
        super(message);
        Object.setPrototypeOf(this, DisplayOperationError.prototype);
    }
}

export type ToWorkerMessage =
    | {
          type: 'initialize' | 'enable' | 'disable' | 'screenInfo';
      }
    | {
          type: 'displayArea';
          x: number;
          y: number;
          width: number;
          height: number;
          mode: WAVEFORM;
      }
    | {
          type: 'writePixels';
          x: number;
          y: number;
          width: number;
          height: number;
          image: Buffer;
          bpp: PIXEL_PACKING;
          rotate?: IMAGE_ROTATION;
          endianism?: ENDIANNESS;
      };

export type ScreenInfoProps = {
    width: number;
    height: number;
    firmware: string;
};

export type FromWorkerMessage =
    | {
          type: 'enable' | 'disable' | 'displayArea' | 'writePixels';
      }
    | ({
          type: 'initialize';
      } & ScreenInfoProps)
    | ({
          type: 'screenInfo';
      } & ScreenInfoProps)
    | {
          type: 'error';
          err: DisplayOperationError;
      };
