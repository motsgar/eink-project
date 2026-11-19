// oxlint-disable unicorn/no-process-exit
import { initDataSources, stopDataSources } from './dataSources/dataUtil';
import { stopDisplay, initialize as initDisplay } from './display';
import { env } from './env';
import { fan } from './fan';
import { errorToString } from './utils';
import { webServer } from './webServer';

let isShuttingDown = false;
const shutdown = async (): Promise<void> => {
    if (isShuttingDown) {
        console.log('shutdown() called while already shutting down, ignoring call');
        return;
    }
    isShuttingDown = true;

    console.log('Setting a 10 second timeout for forceful shutdown');
    const forceShutdownTimeout = setTimeout(() => {
        console.warn('10 second timeout reached. Forcefully shutting down');
        process.exit(1);
    }, 10_000);

    console.log('Stopping display');
    await stopDisplay();

    console.log('Stopping data sources');
    await stopDataSources();

    console.log('Stopping web server');
    await webServer.close();

    console.log('Stopping fan');
    fan.stop();

    clearTimeout(forceShutdownTimeout);
    console.log('Shutdown cleanup complete');
    process.exit(0);
};

process.on('beforeExit', (code) => {
    console.log('Node event loop is empty causing process to exit with code:', code);
});

process.on('exit', (code) => {
    console.log('Process exit event with code:', code);
});

let uncaughtExceptionHappened = false;
process.on('uncaughtException', (error) => {
    if (uncaughtExceptionHappened) {
        console.error(`Uncaught exception happened again, exiting immediately:\n${errorToString(error)}`);
        process.exit(1);
    }
    uncaughtExceptionHappened = true;
    // Make sure to close everything critical and exit immediately.
    // Docs say that async shouldn't be used anymore in uncaughtException,
    // but nothing really prevents it so lets try anyway to close anything possible
    console.error(error);
    console.error(
        'Uncaught exception happened, trying to close everything and exit\nPower might be left on on hardware modules',
    );
    shutdown().catch((newError) => {
        console.error(`Failed to shutdown gracefully:\n${errorToString(newError)}`);
        process.exit(1);
    });
});

const signals: NodeJS.Signals[] = ['SIGINT', 'SIGHUP', 'SIGQUIT', 'SIGTERM'];

const shutdownSignalHandler = (signal: NodeJS.Signals): void => {
    console.log(`\nReceived ${signal}, shutting down...`);
    shutdown().catch((error) => {
        console.error(`Failed to shutdown gracefully:\n${errorToString(error)}`);
        process.exit(1);
    });
};

const setSignalHandlers = (): void => {
    // https://nodejs.org/api/process.html#signal-events
    // Add listeners for all signals that can be caught by Node.js and that would cause the process to exit

    for (const signal of signals) {
        // Remove any existing listeners for the signal to ensure only one handler is active
        process.removeAllListeners(signal);
        process.on(signal, shutdownSignalHandler);
    }

    console.log('Signal handlers reset and registered');
};

const initialize = async (): Promise<void> => {
    const res = await env.loadEnv();
    if (res.isErr()) {
        console.error(res.error);
        process.exit(1);
    }

    // Init display separately first as it has a risk of crashing the whole process if the user
    // can't access the display spi device / IO ports
    await initDisplay(env.emulatedHardware);

    const webPromise = webServer.listen(env.webPort).then(() => {
        console.log(`HTTP server running on ${env.webPort}`);

        console.log('Serving web UI');
        webServer.serveWebUi();
    });

    await Promise.all([
        initDataSources(),
        fan.init().then(() => {
            // This stupid pigpio library that is used for fan control overrides all signals to terminate the
            // program but as a hack resetting signal handlers overrides them back to actually handle graceful shutdown
            setSignalHandlers();
        }),
        webPromise,
    ]);
};

const main = async (): Promise<void> => {
    setSignalHandlers();

    await initialize();
    console.log('Initialized');

    setInterval(() => {
        console.log(`fan speed: ${fan.getRpm()} rpm`);
    }, 1000);
};

main().catch((error) => {
    console.error(`Failed to initialize:${errorToString(error)}`);
    process.exit(1);
});
