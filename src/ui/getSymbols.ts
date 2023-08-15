import { promises as fs } from 'fs';
import { get } from 'https';
import { join } from 'path';

const symbolsFolder = 'files/symbols';

const fetchWeatherSymbol = async (symbolId: number): Promise<void> => {
    const symbolImagePath = join(symbolsFolder, `${symbolId}.svg`);

    // Fetch the symbol image from the URL
    const imageUrl = `https://cdn.fmi.fi/symbol-images/smartsymbol/v3/p/${symbolId}.svg`;
    const imageResponse: string = await new Promise((resolve, reject) => {
        get(imageUrl, (response) => {
            let data = '';
            response.on('data', (chunk) => {
                data += chunk;
            });

            response.on('end', () => {
                resolve(data);
            });

            response.on('error', (error) => {
                reject(error);
            });
        });
    });

    if (imageResponse[1] === 's') {
        await fs.writeFile(symbolImagePath, imageResponse, 'utf8');
    }
};

const fetchWeatherSymbols = async (): Promise<void> => {
    for (let i = 0; i < 100; i++) {
        await fetchWeatherSymbol(i);
        await fetchWeatherSymbol(100 + i);
    }
};

fetchWeatherSymbols().then().catch(console.log);
