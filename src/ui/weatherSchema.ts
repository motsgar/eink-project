import { z } from 'zod';

const forecastDataTypeSchema = z.enum([
    'mts-1-1-Temperature',
    'mts-1-1-FeelsLike',
    'mts-1-1-Humidity',
    'mts-1-1-WindSpeedMS',
    'mts-1-1-WindGust',
    'mts-1-1-Precipitation1h',
    'mts-1-1-SmartSymbol',
    'mts-1-1-Dark',
]);
const forecastDataPointSchema = z.object({
    $: z.object({ 'gml:id': forecastDataTypeSchema }),
    'wml2:point': z
        .object({
            'wml2:MeasurementTVP': z
                .object({
                    'wml2:time': z.string().datetime({ offset: true }).pipe(z.coerce.date()).array().nonempty(),
                    'wml2:value': z.string().array().nonempty(),
                })
                .array()
                .nonempty(),
        })
        .array()
        .nonempty(),
});
export const forecastXmlSchema = z.object({
    'wfs:FeatureCollection': z.object({
        'wfs:member': z
            .object({
                'omso:PointTimeSeriesObservation': z
                    .object({
                        'om:result': z
                            .object({
                                'wml2:MeasurementTimeseries': forecastDataPointSchema.array().nonempty(),
                            })
                            .array()
                            .nonempty(),
                    })
                    .array()
                    .nonempty(),
            })
            .array()
            .nonempty(),
    }),
});

const observationDataTypeSchema = z.enum([
    'obs-obs-1-1-t2m',
    'obs-obs-1-1-ws_10min',
    'obs-obs-1-1-wg_10min',
    'obs-obs-1-1-rh',
    'obs-obs-1-1-r_1h',
    'obs-obs-1-1-ri_10min',
    'obs-obs-1-1-p_sea',

    // Not used
    'obs-obs-1-1-td',
    'obs-obs-1-1-snow_aws',
    'obs-obs-1-1-vis',
    'obs-obs-1-1-n_man',
    'obs-obs-1-1-wawa',
    'obs-obs-1-1-wd_10min',
]);
const observationDataPointSchema = z.object({
    $: z.object({ 'gml:id': observationDataTypeSchema }),
    'wml2:point': z
        .object({
            'wml2:MeasurementTVP': z
                .object({
                    'wml2:time': z.string().datetime({ offset: true }).pipe(z.coerce.date()).array().nonempty(),
                    'wml2:value': z.string().array().nonempty(),
                })
                .array()
                .nonempty(),
        })
        .array()
        .nonempty(),
});
export const observationXmlSchema = z.object({
    'wfs:FeatureCollection': z.object({
        'wfs:member': z
            .object({
                'omso:PointTimeSeriesObservation': z
                    .object({
                        'om:result': z
                            .object({
                                'wml2:MeasurementTimeseries': observationDataPointSchema.array().nonempty(),
                            })
                            .array()
                            .nonempty(),
                    })
                    .array()
                    .nonempty(),
            })
            .array()
            .nonempty(),
    }),
});

export type ForecastXml = z.infer<typeof forecastXmlSchema>;
export type ObservationXml = z.infer<typeof observationXmlSchema>;
