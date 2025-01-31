import { initDataSources, stopDataSources } from './dataSources/dataUtil';
import { initialize as initDisplay, stopDisplay } from './display';
import { draw } from './ui/Draw';
import { runningOnPi } from './utils';
import { webServer } from './webServer';

const webPort = 3000;

const initialize = async (): Promise<void> => {
    const useHardware = await runningOnPi();
    if (!useHardware) {
        console.log('Not running on a Raspberry Pi, running emulated display and data sources');
    }
    const serveWebUi = true;

    // Init display separately first as it has a risk of crashing the whole process if the user
    // can't access the display spi device / IO ports
    await initDisplay(useHardware);

    const webPromise = webServer.listen(webPort, serveWebUi).then(() => {
        console.log(`HTTP server running on ${webPort}`);
    });

    const initPromises = [initDataSources(), draw.readyPromise, webPromise];

    await Promise.all(initPromises);
};

initialize()
    .then(() => {
        console.log('Initialized');
    })
    .catch((error) => {
        console.error('Failed to initialize');
        console.error(error);
    });

const shutdown = async (): Promise<void> => {
    console.log('\nShutting down');

    // await stopDisplay();
    await stopDataSources();

    console.log('Exiting');
    process.exit();
};

process.on('beforeExit', (code) => {
    console.log('Node event loop is empty causing process to exit with code:', code);
});

process.on('exit', (code) => {
    console.log('Process exit event with code:', code);
});

// https://nodejs.org/api/process.html#signal-events
// Adding listeners for all signals that can be caught by Node.js
// and that would cause the process to exit
const signals: NodeJS.Signals[] = [
    'SIGINT',
    'SIGHUP',
    'SIGQUIT',
    'SIGTERM',
];

for (const signal of signals) {
    process.on(signal, () => {
        shutdown().catch(console.error);
    });
}

let uncaughtExceptionHappened = false;
process.on('uncaughtException', (error) => {
    if (uncaughtExceptionHappened) {
        console.error(error);
        console.error('Uncaught exception happened again, exiting immediately');
        process.exit(1);
    }
    uncaughtExceptionHappened = true;
    // Make sure to close everything critical and exit immediately
    // Should not be used in a async way but it it's still possible so
    // try once to close everything and then exit
    console.error(error);
    console.error('Uncaught exception happened, trying to close everything and exit');
    shutdown().catch(console.error);
});
