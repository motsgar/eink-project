import { Image } from 'canvas';
import { spawn } from 'child_process';

export const ditherImage = async (inputImageBuffer: Buffer, width?: number, height?: number): Promise<Image> => {
    return new Promise((resolve, reject) => {
        if (width === undefined) {
            const image = new Image();
            image.src = inputImageBuffer;
            width = image.width;
            height = image.height;
        }
        const args = [
            '-',
            '-resize',
            `${width}x${height}^`,
            '-gravity',
            'center',
            '-extent',
            `${width}x${height}`,
            '-dither',
            'FloydSteinberg',
            '-remap',
            'resources/colormap.png',
            'PNG:-',
        ];
        const convertProcess = spawn('convert', args);

        convertProcess.stdin.write(inputImageBuffer);
        convertProcess.stdin.end();

        let outputBuffer = Buffer.from([]);

        convertProcess.stdout.on('data', (data) => {
            outputBuffer = Buffer.concat([outputBuffer, data]);
        });

        convertProcess.on('close', (code) => {
            if (code === 0) {
                const image = new Image();
                image.src = outputBuffer;
                resolve(image);
            } else {
                reject(new Error(`Image conversion process exited with code ${code}.`));
            }
        });
    });
};
