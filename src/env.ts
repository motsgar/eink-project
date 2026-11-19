// oxlint-disable node/no-process-env
import 'dotenv/config';
import type { Result } from 'neverthrow';

import { ok, err } from 'neverthrow';
import { z } from 'zod';

import { optToBool, optToInt, toFloat } from './types';
import { isRunningOnPi } from './utils'; // oxlint-disable-line import/no-cycle

export default class Env {
    private isLoaded = false;

    public webPort!: number;
    public emulatedHardware!: boolean;
    public path!: string;
    public fanPwmPin!: number;
    public displayVoltage!: number;
    public FAN_TACH_PIN!: number;

    public async loadEnv(): Promise<Result<void, string>> {
        console.log('Loading env');
        const webPort = optToInt(process.env.WEB_PORT, 3000);
        if (webPort.isErr()) return err(webPort.error);
        this.webPort = webPort.value;

        const runningOnPiRes = await isRunningOnPi();
        if (runningOnPiRes.isErr()) return err(runningOnPiRes.error);
        const runningOnPi = runningOnPiRes.value;

        const emulatedHardware = optToBool(process.env.EMULATED_HARDWARE, !runningOnPi);
        if (emulatedHardware.isErr()) return err(emulatedHardware.error);
        this.emulatedHardware = emulatedHardware.value;

        if (this.emulatedHardware) {
            if (runningOnPi) console.warn('Running in emulated hardware mode even though on Raspberry Pi');
            else console.log('Running in emulated hardware mode');
        } else {
            if (runningOnPi) console.log('Running on hardware');
            else console.warn('Running on hardware even though not on Raspberry Pi');
        }

        this.path = process.env.PATH ?? '/usr/local/sbin:/usr/local/bin:/sbin:/bin:/usr/sbin:/usr/bin';

        const fanPwmPin = optToInt(process.env.FAN_PWM_PIN, 18, z.int().min(0).max(40));
        if (fanPwmPin.isErr()) return err(fanPwmPin.error);
        this.fanPwmPin = fanPwmPin.value;

        const fanTachPin = optToInt(process.env.FAN_TACH_PIN, 23, z.int().min(0).max(40));
        if (fanTachPin.isErr()) return err(fanTachPin.error);
        this.FAN_TACH_PIN = fanTachPin.value;

        if (!this.emulatedHardware) {
            if (process.env.DISPLAY_VOLTAGE === undefined) {
                return err('DISPLAY_VOLTAGE is required when running on hardware');
            }

            const displayVoltage = toFloat(process.env.DISPLAY_VOLTAGE, z.number().min(-5).max(0));
            if (displayVoltage.isErr()) return err(displayVoltage.error);
            this.displayVoltage = displayVoltage.value;
        }

        this.isLoaded = true;
        return ok();
    }

    public get loaded(): boolean {
        return this.isLoaded;
    }
}

const envInstance = new Env();

export const env = new Proxy(envInstance, {
    get(target, prop) {
        // Allow access to loadenv even if the environment is not loaded
        if (prop === 'loadEnv') return target.loadEnv.bind(target);

        if (!target.loaded) {
            throw new Error(`Tried to read environment variable "${String(prop)}" before loading the environment`);
        }

        // Prevent accessing hardware only props in emulated mode because they might be undefined
        const hardwareOnlyProps = ['DISPLAY_VOLTAGE'];
        if (target.emulatedHardware && hardwareOnlyProps.includes(String(prop))) {
            throw new Error(`Tried to read environment variable "${String(prop)}" while in emulated mode`);
        }

        // oxlint-disable-next-line typescript/no-unsafe-return
        return Reflect.get(target, prop);
    },
});
