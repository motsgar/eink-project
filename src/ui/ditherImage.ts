import { Image } from 'canvas';
import { spawn } from 'child_process';
import * as fs from 'fs/promises';

export const getDitheredImage = async (filepath: string, width: number, height: number): Promise<Image> => {
    const inputBuffer = await fs.readFile(filepath);

    return new Promise((resolve, reject) => {
        const args = [
            '-',
            '-resize',
            `${width}x${height}^`,
            '-gravity',
            'center',
            '-extent',
            `${width}x${height}`,
            '-colorspace',
            'Gray',
            '-dither',
            'FloydSteinberg',
            '-colors',
            '16',
            '-depth',
            '4',
            'PNG:-',
        ];
        const convertProcess = spawn('convert', args);

        convertProcess.stdin.write(inputBuffer);
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
