import { EventEmitter } from 'node:events';
import { SerialPort } from 'serialport';

import { DEV } from '../../env';

const BYTESReadCO2 = [0xff, 0x01, 0x86, 0x00, 0x00, 0x00, 0x00, 0x00, 0x79];
const BYTESABCOff = [0xff, 0x01, 0x79, 0x00, 0x00, 0x00, 0x00, 0x00, 0x86];

class CO2Sensor {
    co2: number;
    private co2SerialBuffer: number[];
    private co2Events: EventEmitter;
    private serialPort?: SerialPort;

    constructor() {
        this.co2 = 600;
        this.co2SerialBuffer = [];
        this.co2Events = new EventEmitter({ captureRejections: true });
    }

    start(): void {
        if (DEV) return;
        this.serialPort = new SerialPort({ path: '/dev/serial0', baudRate: 9600 });
        this.sendPacket(BYTESABCOff);

        this.serialPort.on('close', () => {
            throw new Error('MH-Z19B port closed suddenly');
        });
        this.serialPort.on('error', (err) => {
            throw err;
        });
        this.serialPort.on('data', this.handleSerialData.bind(this));
    }

    stop(): void {
        if (DEV) return;
        this.serialPort?.close();
        this.serialPort = undefined;
    }

    async getData(): Promise<number> {
        let errorCount = 0;

        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        while (true) {
            this.sendPacket(BYTESReadCO2);
            try {
                const co2 = await new Promise<number>((resolve, reject) => {
                    // TODO: implement timeout
                    this.co2Events.once('co2', (reading: number, error?: Error) => {
                        if (error) reject(error);
                        else resolve(reading);
                    });
                });
                return co2;
            } catch (error) {
                console.log('error now');
                if (errorCount > 5) throw error;
                errorCount++;
            }
        }
    }

    private handleSerialData(data: Buffer): void {
        this.co2SerialBuffer.push(...data);
        if (this.co2SerialBuffer.length < 9) return;
        if (this.co2SerialBuffer.length > 9) throw new Error('Received too much data from co2 sensor');

        if (this.getChecksum(this.co2SerialBuffer) !== this.co2SerialBuffer[8]) {
            this.co2SerialBuffer = [];
            this.co2Events.emit('co2', 0, new Error('Bad checksum'));
            return;
        }
        const co2 = this.co2SerialBuffer[2] * 256 + this.co2SerialBuffer[3];
        this.co2SerialBuffer = [];

        this.co2Events.emit('co2', co2);
    }

    private getChecksum(packet: number[]): number {
        let checksum = 0;
        for (let i = 1; i < 8; i++) checksum = (checksum + packet[i]) % 256;
        checksum = 0xff - checksum;
        checksum += 1;
        return checksum % 256;
    }

    private sendPacket(packet: number[]): void {
        if (this.serialPort === undefined) {
            throw new Error('CO2Sensor tried to send package but serialport was undefined');
        }
        this.serialPort.write(packet, (err) => {
            if (err) throw err;
        });
    }
}

export const co2Sensor = new CO2Sensor();
