import { type Image, loadImage } from 'canvas';
import * as fs from 'node:fs/promises';
import suncalc from 'suncalc';

import { type Forecast, type Observation, parseForecastXml, parseObservationXml } from './weatherParse';

export type Warnings = {
    forestfire: boolean;
    freeze: boolean;
    grassfire: boolean;
    icing: boolean;
    heat: boolean;
    pedestrian: boolean;
    wind: boolean;
    rain: boolean;
    thunder: boolean;
    traffic: boolean;
    ultraviolet: boolean;
    waterlevel: boolean;
    waveheight: boolean;
};

export type WeatherDataType = {
    observation: Observation;
    forecasts: Forecast[];
    sunInfo: suncalc.GetTimesResult;
    warnings: Warnings;
};

class WeatherDataSource {
    weatherData?: WeatherDataType;
    weatherSymbols: { [key: number]: Image };
    readyPromise: Promise<void>;
    fetchInterval?: NodeJS.Timeout;

    constructor() {
        this.weatherSymbols = {};
        this.readyPromise = this.initializeWeatherSymbols();
    }

    async start(): Promise<void> {
        await this.fetchWeatherData();
        this.fetchInterval = setInterval(
            () => {
                this.fetchWeatherData().catch(console.error);
            },
            1000 * 60 * 15,
        );
    }

    stop(): void {
        clearInterval(this.fetchInterval);
        this.fetchInterval = undefined;
    }

    private async fetchWeatherData(): Promise<void> {
        const locationId = 101_004; // 101004 is the observation location id for kumpula.

        const forBaseQuery =
            'https://opendata.fmi.fi/wfs?request=getFeature&storedquery_id=fmi::forecast::harmonie::surface::point::timevaluepair';
        const forDataParams =
            'parameters=Temperature,FeelsLike,Humidity,WindSpeedMS,WindGust,Precipitation1h,SmartSymbol,Dark';
        const forUrl = `${forBaseQuery}&fmisid=${locationId}&${forDataParams}`;
        const forResponse = await fetch(forUrl);
        const forecasts = await parseForecastXml(await forResponse.text());

        const obsStartTime = new Date(new Date(new Date().toUTCString()).getTime() - 15 * 60 * 1000);
        new Date().getTimezoneOffset();
        const obsBaseQuery =
            'https://opendata.fmi.fi/wfs?request=getFeature&storedquery_id=fmi::observations::weather::timevaluepair';
        const obsParams = `fmisid=${locationId}&timezone=Europe/Helsinki&starttime=${obsStartTime.toISOString()}`;
        const obsUrl = `${obsBaseQuery}&${obsParams}`;
        const obsResponse = await fetch(obsUrl);
        const observation = await parseObservationXml(await obsResponse.text());

        const sunInfo = suncalc.getTimes(new Date(), 60.203_07, 24.961_31);

        // TODO: Fix fetch warnings
        this.weatherData = {
            forecasts,
            observation,
            sunInfo,
            warnings: {
                forestfire: false,
                freeze: false,
                grassfire: false,
                icing: false,
                heat: false,
                pedestrian: false,
                wind: false,
                rain: false,
                thunder: false,
                traffic: false,
                ultraviolet: false,
                waterlevel: false,
                waveheight: false,
            },
        };
    }

    private async initializeWeatherSymbols(): Promise<void> {
        const symbolsDir = 'resources/weatherSymbols';
        for (const filename of await fs.readdir(symbolsDir)) {
            if (!filename.endsWith('.svg')) continue;

            const index = parseInt(filename.split('.')[0]);
            const symbol = await loadImage(`${symbolsDir}/${filename}`);
            this.weatherSymbols[index] = symbol;
        }
    }
}

export const weatherDataSource = new WeatherDataSource();
