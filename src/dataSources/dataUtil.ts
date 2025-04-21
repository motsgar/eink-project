import { sensorDataSource } from './SensorDataSource';
import { weatherDataSource } from './weatherDataSource';

export const initDataSources = async (): Promise<unknown> =>
    Promise.all([sensorDataSource.init(), weatherDataSource.readyPromise]);

export const startDataSources = async (): Promise<unknown> =>
    Promise.all([sensorDataSource.start(), weatherDataSource.start()]);

export const stopDataSources = async (): Promise<unknown> =>
    Promise.all([sensorDataSource.stop(), weatherDataSource.stop()]);
