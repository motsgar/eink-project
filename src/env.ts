import 'dotenv/config';
import { runningOnPi } from './utils';

export default class Env {
    private isLoaded = false;

    public EMULATED_HARDWARE!: boolean;
    public DISPLAY_VOLTAGE!: number;
    public PATH!: string;
    public FAN_PWM_PIN!: number;
    public FAN_TACH_PIN!: number;

    public async loadenv(): Promise<void> {
        const runningOnHardware = await runningOnPi();
        if (!runningOnHardware) {
            console.log('Not running on a Raspberry Pi, running emulated display and data sources');
        }
        this.EMULATED_HARDWARE = !runningOnHardware || process.env.EMULATED_HARDWARE === 'true';
        this.PATH = process.env.PATH ?? '/usr/local/sbin:/usr/local/bin:/sbin:/bin:/usr/sbin:/usr/bin';

        this.FAN_PWM_PIN = parseInt(process.env.FAN_PWM_PIN ?? '18', 10);
        if (isNaN(this.FAN_PWM_PIN) || this.FAN_PWM_PIN < 0 || this.FAN_PWM_PIN > 40) {
            throw new Error(`Invalid FAN_PWM_PIN: "${process.env.FAN_PWM_PIN}", must be a number between 0 and 40`);
        }
        this.FAN_TACH_PIN = parseInt(process.env.FAN_TACH_PIN ?? '23', 10);
        if (isNaN(this.FAN_TACH_PIN) || this.FAN_TACH_PIN < 0 || this.FAN_TACH_PIN > 40) {
            throw new Error(`Invalid FAN_TACH_PIN: "${process.env.FAN_TACH_PIN}", must be a number between 0 and 40`);
        }
        
        if (process.env.DISPLAY_VOLTAGE !== undefined) {
            this.DISPLAY_VOLTAGE = parseFloat(process.env.DISPLAY_VOLTAGE);

            // Arbitrary voltage limits
            if (isNaN(this.DISPLAY_VOLTAGE) || this.DISPLAY_VOLTAGE < -5 || this.DISPLAY_VOLTAGE > 0) {
                throw new Error(`Invalid voltage: "${process.env.DISPLAY_VOLTAGE}", DISPLAY_VOLTAGE must be a float between -5 and 0`);
            }
        } else {
            if (runningOnHardware) throw new Error('DISPLAY_VOLTAGE is required when running on hardware or when EMULATED_HARDWARE is not set');
            else console.log('Allowing env DISPLAY_VOLTAGE to be undefined in emulated mode');
        }
        
        this.isLoaded = true;
    }

    public get loaded(): boolean {
        return this.isLoaded;
    }
}

const envInstance = new Env();

export const env = new Proxy(envInstance, {
    get(target, prop) {
        if (prop === 'loadenv') {
            // Allow access to loadenv even if the environment is not loaded
            return target.loadenv.bind(target);
        }

        if (!target.loaded) {
            throw new Error(`Tried to read environment variable "${String(prop)}" before loading the environment`);
        }

        // Check if we are in dev/emulated hardware mode and accessing an allowed undefined variable
        const allowedEmulationUndefinedProps = ['DISPLAY_VOLTAGE'];

        // Typescript doesn't know we have broken types intentionally in the Env class
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        if (target.EMULATED_HARDWARE && allowedEmulationUndefinedProps.includes(String(prop)) && target[prop as keyof Env] === undefined) {
            throw new Error(`Tried to read environment variable "${String(prop)}" while in emulated mode`);
        }

        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        return Reflect.get(target, prop);
    }
});

// export const DEV = process.env.DEV ? process.env.DEV === 'true' : false;
// export const WEBIMAGES = process.env.WEBIMAGES ? process.env.WEBIMAGES === 'true' : false;
// export const DISPLAY_VOLTAGE = parseFloat(process.env.DISPLAY_VOLTAGE!);
// export const PATH = process.env.PATH ?? '/usr/local/sbin:/usr/local/bin:/sbin:/bin:/usr/sbin:/usr/bin';

// Arbitrary voltage limits
// if (isNaN(DISPLAY_VOLTAGE) || DISPLAY_VOLTAGE < -5 || DISPLAY_VOLTAGE > 0) {
//     throw new Error(`Invalid voltage: "${process.env.DISPLAY_VOLTAGE}", must be a float between -5 and 0`);
// }
// if (DEV) console.log('Running in dev mode');
// 