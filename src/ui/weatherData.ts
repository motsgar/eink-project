import { Image, loadImage } from 'canvas';
import * as fs from 'fs/promises';
import * as moment from 'moment-timezone';
import fetch from 'node-fetch';

type WindCompass = 'N' | 'NE' | 'E' | 'SE' | 'S' | 'SW' | 'W' | 'NW';
type shortTime = `${number}`;
type longTime = `${number}T${number}`;
type RawObservation = {
    distance: string;
    stationname: string;
    localtime: shortTime;
    Temperature: string;
    DewPoint: string;
    WindSpeedMS: string;
    WindCompass8: WindCompass;
    WindGust: string;
    Humidity: string;
    Pressure: string;
    SnowDepth: string;
    TotalCloudCover: string;
    Visibility: string;
    RI_10MIN: string;
};

type RawForecast = {
    latitude: string;
    longitude: string;
    localtime: longTime;
    Temperature: string;
    SmartSymbol: string;
    PoP: string;
    WindSpeedMS: string;
    WindDirection: string;
    WindCompass8: WindCompass;
    Precipitation1h: string;
    FeelsLike: string;
    dark: string;
};

type RawSunInfo = {
    suntxt: string;
    sunrise: longTime;
    sunset: longTime;
    sunrisetoday: string;
    sunsettoday: string;
};

type RawWarnings = {
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

type RawWeatherData = {
    observations: { [key: number]: RawObservation[] };
    forecasts: { forecast: RawForecast[] }[];
    suninfo: { [key: number]: RawSunInfo };
    warnings: { [key: number]: RawWarnings };
};

export type Observation = {
    distance: number;
    stationname: string;
    localtime: Date;
    temperature: number;
    dewPoint: number;
    windSpeedMS: number;
    windCompass8: WindCompass;
    windGust: number;
    humidity: number;
    pressure: number;
    snowDepth: number;
    totalCloudCover: number;
    visibility: number;
    RI_10MIN: number;
};

export type Forecast = {
    latitude: number;
    longitude: number;
    localtime: Date;
    temperature: number;
    smartSymbol: number;
    PoP: number;
    windSpeedMS: number;
    windDirection: number;
    windCompass8: WindCompass;
    precipitation1h: number;
    feelsLike: number;
    dark: boolean;
};

export type SunInfo = {
    suntxt: string;
    sunrise: Date;
    sunset: Date;
    sunrisetoday: boolean;
    sunsettoday: boolean;
};

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
    sunInfo: SunInfo;
    warnings: Warnings;
};

class WeatherData {
    weatherData?: WeatherDataType;
    weatherSymbols: { [key: number]: Image };
    readyPromise: Promise<void>;

    constructor() {
        this.weatherSymbols = {};

        this.readyPromise = new Promise((resolve, reject) => {
            Promise.all([this.initializeWeatherSymbols(), this.fetchWeatherData()])
                .then(() => {
                    resolve();
                    setInterval(
                        async () => {
                            await this.fetchWeatherData().catch(console.error);
                        },
                        1000 * 60 * 15,
                    );
                })
                .catch((error) => {
                    reject(error);
                });
        });
    }

    private parseShortTime(dateString: shortTime): Date {
        return moment.tz(dateString, 'YYYYMMDDhhmm', 'Europe/Helsinki').toDate();
    }
    private parseLongTime(dateString: longTime): Date {
        return moment.tz(dateString, 'YYYYMMDDThhmmdd', 'Europe/Helsinki').toDate();
    }
    private parseObservation(observation: RawObservation): Observation {
        return {
            distance: parseFloat(observation.distance),
            stationname: observation.stationname,
            localtime: this.parseShortTime(observation.localtime),
            temperature: parseFloat(observation.Temperature),
            dewPoint: parseFloat(observation.DewPoint),
            windSpeedMS: parseFloat(observation.WindSpeedMS),
            windCompass8: observation.WindCompass8,
            windGust: parseFloat(observation.WindGust),
            humidity: parseFloat(observation.Humidity),
            pressure: parseFloat(observation.Pressure),
            snowDepth: parseFloat(observation.SnowDepth),
            totalCloudCover: parseFloat(observation.TotalCloudCover),
            visibility: parseFloat(observation.Visibility),
            RI_10MIN: parseFloat(observation.RI_10MIN),
        };
    }
    private parseForecast(forecast: RawForecast): Forecast {
        return {
            latitude: parseFloat(forecast.latitude),
            longitude: parseFloat(forecast.longitude),
            localtime: this.parseLongTime(forecast.localtime),
            temperature: parseInt(forecast.Temperature),
            smartSymbol: parseInt(forecast.SmartSymbol),
            PoP: parseInt(forecast.PoP),
            windSpeedMS: parseInt(forecast.WindSpeedMS),
            windDirection: parseInt(forecast.WindDirection),
            windCompass8: forecast.WindCompass8,
            precipitation1h: parseFloat(forecast.Precipitation1h),
            feelsLike: parseInt(forecast.FeelsLike),
            dark: forecast.dark === '1',
        };
    }
    private parseSunInfo(sunInfo: RawSunInfo): SunInfo {
        return {
            suntxt: sunInfo.suntxt,
            sunrise: this.parseLongTime(sunInfo.sunrise),
            sunset: this.parseLongTime(sunInfo.sunset),
            sunrisetoday: sunInfo.sunrisetoday === '1',
            sunsettoday: sunInfo.sunsettoday === '1',
        };
    }

    private async fetchWeatherData(): Promise<void> {
        const locationId = 843429; // 843429 is the observation location id for kumpula.
        const url = `https://m.fmi.fi/mobile/interfaces/weatherdata.php?l=en&locations=${locationId}`;

        const response = await fetch(url);
        if (!response.ok) {
            throw new Error('Failed to get weather data');
        }
        const rawWeatherData: RawWeatherData = await response.json();

        this.weatherData = {
            forecasts: rawWeatherData.forecasts[0].forecast.map((forecast) => this.parseForecast(forecast)),
            observation: this.parseObservation(rawWeatherData.observations[locationId][0]),
            sunInfo: this.parseSunInfo(rawWeatherData.suninfo[locationId]),
            warnings: rawWeatherData.warnings[locationId],
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

export const weatherData = new WeatherData();
