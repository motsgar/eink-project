declare module 'bme280' {
    export enum OVERSAMPLE {
        SKIPPED = 0,
        X1 = 1,
        X2 = 2,
        X4 = 3,
        X8 = 4,
        X16 = 5,
    }

    export enum FILTER {
        OFF = 0,
        F2 = 1,
        F4 = 2,
        F8 = 3,
        F16 = 4,
    }
    export enum STANDBY {
        MS_0_5 = 0,
        MS_62_5 = 1,
        MS_125 = 2,
        MS_250 = 3,
        MS_500 = 4,
        MS_1000 = 5,
        MS_10 = 6,
        MS_20 = 7,
    }

    export type OpenOptions = {
        i2cBusNumber?: number;
        i2cAddress?: number;
        humidityOversampling?: OVERSAMPLE;
        pressureOversampling?: OVERSAMPLE;
        temperatureOversampling?: OVERSAMPLE;
        standby?: STANDBY;
        filterCoefficient?: FILTER;
        forcedMode?: boolean;
    };

    export type Sensor = {
        read(): Promise<{ temperature: number; pressure: number; humidity: number }>;
    };

    export function open(options: OpenOptions): Promise<Sensor>;
}
