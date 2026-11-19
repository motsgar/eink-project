import type { Gpio as GpioType } from 'pigpio';

import { env } from './env.js';

const emulatedFanMaxRpm = 4500;

export default class Fan {
    private pwm: GpioType | null = null;
    private tach: GpioType | null = null;
    private pulseCount = 0;
    private tachCountStartTime = process.hrtime.bigint();
    private tachInterval: NodeJS.Timeout | null = null;
    private speed = 60; // 0-100%
    private rpm = 0;

    public async init(): Promise<void> {
        if (env.emulatedHardware) {
            console.log('Using emulated fan');
        } else {
            // Dynamically load gpio as it is not available in emulated mode.
            const { Gpio } = await import('pigpio');

            this.pwm = new Gpio(env.fanPwmPin, { mode: Gpio.OUTPUT });
            this.tach = new Gpio(env.fanTachPin, {
                mode: Gpio.INPUT,
                pullUpDown: Gpio.PUD_UP,
                alert: true,
            });

            this.pwm.hardwarePwmWrite(25_000, Math.round((this.speed / 100) * 1_000_000));

            this.tach.on('alert', this.tachAlert.bind(this));

            this.pulseCount = 0;
            this.tachCountStartTime = process.hrtime.bigint();
            this.tachInterval = setInterval(() => {
                const now = process.hrtime.bigint();
                const elapsedSeconds = Number(now - this.tachCountStartTime) / 1e9;

                this.rpm = (this.pulseCount / 2) * (60 / elapsedSeconds);
                this.pulseCount = 0;
                this.tachCountStartTime = now;
            }, 1000);
        }
    }

    public stop(): void {
        if (this.pwm) {
            this.pwm.hardwarePwmWrite(0, 0);
            this.pwm = null;
        }
        if (this.tach) {
            this.tach.removeAllListeners('alert');
            this.tach = null;
        }
        if (this.tachInterval) {
            clearInterval(this.tachInterval);
            this.tachInterval = null;
        }
        this.pulseCount = 0;
        this.tachCountStartTime = process.hrtime.bigint();
    }

    public setSpeed(speed: number): void {
        if (speed < 0 || speed > 100) {
            throw new RangeError(`Invalid speed: ${speed}, must be between 0 and 100`);
        }
        this.speed = speed;
        if (this.pwm) {
            const dutyCycle = Math.round((speed / 100) * 1_000_000);
            this.pwm.hardwarePwmWrite(25_000, dutyCycle);
        }
    }

    public getSpeed(): number {
        return this.speed;
    }

    public getRpm(): number {
        if (this.tach) return this.rpm;

        // Simulate RPM if not on hardware
        const emulatedRpm = Math.round((this.speed / 100) * emulatedFanMaxRpm);
        return emulatedRpm;
    }

    private tachAlert(level: number): void {
        if (level === 0) {
            // Falling edge
            this.pulseCount++;
        }
    }
}

export const fan = new Fan();
