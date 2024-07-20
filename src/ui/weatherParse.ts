import { parseString } from 'xml2js';

import { forecastXmlSchema, observationXmlSchema } from './weatherSchema';
export type Forecast = {
    localtime: Date;
    temperature: number;
    feelsLike: number;
    humidity: number;
    windSpeedMS: number;
    windGust: number;
    precipitation1h: number;
    smartSymbol: number;
    dark: boolean;
};
type ForecastRecord = Record<string, Forecast>;

const initForecast: Forecast = {
    localtime: new Date(),
    temperature: 0,
    feelsLike: 0,
    humidity: 0,
    windSpeedMS: 0,
    windGust: 0,
    precipitation1h: 0,
    smartSymbol: 4,
    dark: false,
};

export const parseForecastXml = (xml: string): Promise<Forecast[]> =>
    new Promise((resolve, reject) =>
        parseString(xml, (err, rawResult) => {
            if (err) {
                reject(err);
            } else {
                const forecastResult = forecastXmlSchema.parse(rawResult);

                const forecastMap: ForecastRecord = {};
                const members = forecastResult['wfs:FeatureCollection']['wfs:member'];
                for (const member of members) {
                    const dataPoints =
                        member['omso:PointTimeSeriesObservation'][0]['om:result'][0]['wml2:MeasurementTimeseries'][0];
                    const dataType = dataPoints.$['gml:id'];

                    let key: keyof Forecast | 'invalid' = 'invalid';
                    switch (dataType) {
                        case 'mts-1-1-Temperature':
                            key = 'temperature';
                            break;
                        case 'mts-1-1-FeelsLike':
                            key = 'feelsLike';
                            break;
                        case 'mts-1-1-Humidity':
                            key = 'humidity';
                            break;
                        case 'mts-1-1-WindSpeedMS':
                            key = 'windSpeedMS';
                            break;
                        case 'mts-1-1-WindGust':
                            key = 'windGust';
                            break;
                        case 'mts-1-1-Precipitation1h':
                            key = 'precipitation1h';
                            break;
                        case 'mts-1-1-SmartSymbol':
                            key = 'smartSymbol';
                            break;
                        case 'mts-1-1-Dark':
                            key = 'dark';
                            break;
                        default:
                            break;
                    }
                    if (key === 'invalid') continue;

                    for (const point of dataPoints['wml2:point']) {
                        const date = point['wml2:MeasurementTVP'][0]['wml2:time'][0];
                        const stringVal = point['wml2:MeasurementTVP'][0]['wml2:value'][0];
                        if (date.getTime() < new Date().getTime()) continue;

                        const dateKey = date.toISOString();
                        if (!(dateKey in forecastMap)) {
                            forecastMap[dateKey] = structuredClone(initForecast);
                            forecastMap[dateKey].localtime = date;
                        }
                        if (key === 'dark') forecastMap[dateKey][key] = Boolean(stringVal);
                        else forecastMap[dateKey][key] = parseFloat(stringVal);
                    }
                }

                const forecastData = Object.entries(forecastMap);
                forecastData.sort();
                resolve(forecastData.map(([, forecast]) => forecast));
            }
        }),
    );

export type Observation = {
    localtime: Date;
    temperature: number;
    windSpeedMS: number;
    windGust: number;
    humidity: number;
    precipitation1h: number;
    precipitationIntensity: number;
    pressure: number;
};
const initObservation: Observation = {
    localtime: new Date(),
    temperature: 0,
    windSpeedMS: 0,
    windGust: 0,
    humidity: 0,
    precipitation1h: 0,
    precipitationIntensity: 0,
    pressure: 0,
};

export const parseObservationXml = (xml: string): Promise<Observation> =>
    new Promise((resolve, reject) =>
        parseString(xml, (err, rawResult) => {
            if (err) {
                reject(err);
            } else {
                const observationResult = observationXmlSchema.parse(rawResult);

                const observation: Observation = structuredClone(initObservation);
                observation.localtime = new Date(1970, 0, 1);

                const members = observationResult['wfs:FeatureCollection']['wfs:member'];
                for (const member of members) {
                    const dataPoints =
                        member['omso:PointTimeSeriesObservation'][0]['om:result'][0]['wml2:MeasurementTimeseries'][0];
                    const dataType = dataPoints.$['gml:id'];

                    let key: keyof Observation | 'invalid' = 'invalid';
                    switch (dataType) {
                        case 'obs-obs-1-1-t2m':
                            key = 'temperature';
                            break;
                        case 'obs-obs-1-1-ws_10min':
                            key = 'windSpeedMS';
                            break;
                        case 'obs-obs-1-1-wg_10min':
                            key = 'windGust';
                            break;
                        case 'obs-obs-1-1-rh':
                            key = 'humidity';
                            break;
                        case 'obs-obs-1-1-r_1h':
                            key = 'precipitation1h';
                            break;
                        case 'obs-obs-1-1-ri_10min':
                            // obs-obs-1-1-r_1h Would also be an option
                            key = 'precipitationIntensity';
                            break;
                        case 'obs-obs-1-1-p_sea':
                            key = 'pressure';
                            break;
                        default:
                            break;
                    }
                    if (key === 'invalid') continue;

                    for (const point of dataPoints['wml2:point']) {
                        const date = new Date(point['wml2:MeasurementTVP'][0]['wml2:time'][0]);
                        if (date.getTime() < observation.localtime.getTime()) continue;
                        const stringVal = point['wml2:MeasurementTVP'][0]['wml2:value'][0];
                        observation.localtime = date;
                        observation[key] = parseFloat(stringVal);
                    }
                }

                resolve(observation);
            }
        }),
    );
