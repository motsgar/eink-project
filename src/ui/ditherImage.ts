import { Image } from 'canvas';
import { spawn } from 'node:child_process';

import { getResolvedPath } from '@/utils';

export const ditherImage = async (inputImageBuffer: Buffer, width?: number, height?: number): Promise<Image> => {
    // TODO make more robust with e.g. more process lifecycle handling and timeouts
    
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
        const fullPath = getResolvedPath('convert');
        console.log('fullPath', fullPath);
        const convertProcess = spawn(fullPath, args);

        convertProcess.on('error', (error) => {
            reject(error);
        });

        convertProcess.stdin.write(inputImageBuffer);
        convertProcess.stdin.end();

        let outputBuffer = Buffer.from([]);

        convertProcess.stdin.on('error', (error) => {
            // For now just ignore errors. Mainly EPIPE as it happens when trying to write to a closed process.
            // That also in our case can only happen if the process crashes.
            console.error(error);
        });

        convertProcess.stdout.on('data', (data) => {
            outputBuffer = Buffer.concat([outputBuffer, data]);
        });


        convertProcess.stderr.on('data', (data) => {
            console.error(`Image conversion process: ${data}`);
        });

        convertProcess.on('close', (code, signal) => {
            if (code === null) {
                reject(new Error(`Image conversion process exited with signal ${signal}.`));
                return;
            }
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
