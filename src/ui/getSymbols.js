import { promises as fs } from 'fs';
import { get } from 'https';
import { join } from 'path';

const symbolsFolder = 'files/symbols';

const fetchWeatherSymbol = async (symbolId) => {
    const symbolImagePath = join(symbolsFolder, `${symbolId}.svg`);

    // Fetch the symbol image from the URL
    const imageUrl = `https://cdn.fmi.fi/symbol-images/smartsymbol/v3/p/${symbolId}.svg`;
    const response = await new Promise((resolve, reject) => {
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
    if (response[1] === 's') {
        await fs.writeFile(symbolImagePath, response, 'utf8');
    }
};

const fetchWeatherSymbols = async () => {
    for (let i = 1; i < 100; i++) {
        fetchWeatherSymbol(i);
        fetchWeatherSymbol(100 + i);
    }
};

fetchWeatherSymbols();
