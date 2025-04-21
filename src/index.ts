import { initDataSources, stopDataSources } from './dataSources/dataUtil';
// import { initialize as initDisplay, stopDisplay } from './display';
// import { draw } from './ui/Draw';
import { env } from './env';
import { fan } from './fan';
import { webServer } from './webServer';

const webPort = 3000;

const initialize = async (): Promise<void> => {
    // Init display separately first as it has a risk of crashing the whole process if the user
    // can't access the display spi device / IO ports
    // await initDisplay(useHardware);
    await env.loadenv();

    const webPromise = webServer.listen(webPort).then(() => {
        console.log(`HTTP server running on ${webPort}`);
        
        if (false) {
            console.log('Serving web UI');
            webServer.serveWebUi();
        }
    });

    const initPromises = [initDataSources(), fan.init(), webPromise];

    await Promise.all(initPromises);
};

const shutdown = async (): Promise<void> => {
    console.log('\nShutting down');

    // await stopDisplay();
    await stopDataSources();

    process.exit();
};

initialize()
    .then(() => {
        console.log('Initialized');
        setInterval(() => {
            console.log('fan speed:', fan.getSpeed());
        }, 1000);
    })
    .catch((error) => {
        console.error('Failed to initialize');
        console.error(error);
    });


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
        console.log(`\nReceived ${signal}, shutting down...`);
        shutdown().catch((error) => {
            console.error(error);
            console.error('Failed to shutdown gracefully');
            process.exit(1);
        });
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
    // Docs says that this async shouldn't be used anymore in uncaughtException,
    // but nothing really prevents it so lets try anyway to close anything possible
    console.error(error);
    console.error('Uncaught exception happened, trying to close everything and exit\nPower might be left on on hardware modules');
    shutdown().catch((newError) => {
        console.error(newError);
        console.error('Failed to shutdown gracefully');
        process.exit(1);
    });
});
