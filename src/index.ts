import { cleanup, initialize as initDisplay } from './display';
import { webServer } from './webServer';

const initialize = async (): Promise<void> => {
    const webPort = 3000;
    const webPromise = webServer.listen(webPort).then(() => {
        console.log(`HTTP server running on ${webPort}`);
    });

    const initPromises = [initDisplay(), initDataSources(), initUiModules(), webPromise];

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

    await cleanup();

    console.log('Exiting');
    process.exit();
};

process.on('SIGINT', () => {
    shutdown().catch(console.error);
});
process.on('SIGUSR1', () => {
    shutdown().catch(console.error);
});
process.on('SIGUSR2', () => {
    shutdown().catch(console.error);
});
process.on('uncaughtException', () => {
    shutdown().catch(console.error);
});
