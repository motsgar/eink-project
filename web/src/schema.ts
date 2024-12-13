import { z } from 'zod';

const moduleEnum = z.enum([
    'CO2Graph',
    'EnvGraph',
    'Status',
    'TemperatureGraph',
    'Weather',
    'WeatherGraph',
    'HorizontalWeather',
]);

const settingsSchema = z.object({
    timePeriod: z.number().min(1).int().optional(),
    detailedSensorData: z.boolean().optional(),
    times: z.array(z.number().int()).min(1).optional(),
});

const moduleSchema = z.object({
    module: moduleEnum,
    x: z.number().min(0).int(),
    y: z.number().min(0).int(),
    width: z.number().min(1).int(),
    height: z.number().min(1).int(),
    settings: settingsSchema,
});

const viewSchema = z.object({
    width: z.number().min(1).int(),
    height: z.number().min(1).int(),
    insidePadding: z.number().min(0),
    roundness: z.number().min(0),
    outsidePadding: z.number().min(0),
    fillStyle: z
        .string()
        .regex(/^#[0-9a-fA-F]+$/u)
        .min(7)
        .max(9),
    strokeStyle: z
        .string()
        .regex(/^#[0-9a-fA-F]+$/u)
        .min(7)
        .max(9),
    backgroundSrc: z.string(),
    modules: z.array(moduleSchema).min(1),
});

export const ConfigSchema = z.object({
    views: z.array(viewSchema).min(1),
});

export type ModuleSettings = z.infer<typeof settingsSchema>;
export type Config = z.infer<typeof ConfigSchema>;
