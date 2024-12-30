import 'dotenv/config';

export const DEV = process.env.DEV ? process.env.DEV === 'true' : false;
export const WEBIMAGES = process.env.WEBIMAGES ? process.env.WEBIMAGES === 'true' : false;
export const DISPLAY_VOLTAGE = parseFloat(process.env.DISPLAY_VOLTAGE!);
export const PATH = process.env.PATH ?? '/usr/local/sbin:/usr/local/bin:/sbin:/bin:/usr/sbin:/usr/bin';

// Arbitrary voltage limits
if (isNaN(DISPLAY_VOLTAGE) || DISPLAY_VOLTAGE < -5 || DISPLAY_VOLTAGE > 0) {
    throw new Error(`Invalid voltage: "${process.env.DISPLAY_VOLTAGE}", must be a float between -5 and 0`);
}
if (DEV) console.log('Running in dev mode');
