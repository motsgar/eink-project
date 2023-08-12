import { Canvas } from 'canvas';

const convertTo4BPP = (image: Canvas): Buffer => {
    const buffer = Buffer.alloc((image.width * image.height) >> 1);
    const ctx = image.getContext('2d');

    const data = ctx.getImageData(0, 0, image.width, image.height).data;
    for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        const pixelI = i >> 2;
        const gray = Math.round(0.299 * r + 0.587 * g + 0.114 * b) >> 4;
        const index = pixelI >> 1; // ⌊i/2⌋
        buffer[index] = buffer[index] | (gray << ((1 - (pixelI % 2)) << 2));
    }
    return buffer;
};

const convertTo2BPP = (image: Canvas): Buffer => {
    const buffer = Buffer.alloc((image.width * image.height) >> 2);
    const ctx = image.getContext('2d');

    const data = ctx.getImageData(0, 0, image.width, image.height).data;
    for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        const pixelI = i >> 2;
        const gray = Math.round(0.299 * r + 0.587 * g + 0.114 * b) >> 6;
        const index = pixelI >> 2; // ⌊i/4⌋
        buffer[index] = buffer[index] | (gray << ((3 - (pixelI % 4)) << 1));
    }
    return buffer;
};

const convertTo1BPP = (image: Canvas): Buffer => {
    const buffer = Buffer.alloc((image.width * image.height) >> 3);
    const ctx = image.getContext('2d');

    const data = ctx.getImageData(0, 0, image.width, image.height).data;
    for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        const pixelI = i >> 2;
        const gray = Math.round(0.299 * r + 0.587 * g + 0.114 * b) >> 7;
        const index = pixelI >> 3; // ⌊i/8⌋
        buffer[index] = buffer[index] | (gray << (7 - (pixelI % 8)));
    }
    return buffer;
};
