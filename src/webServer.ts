import type { Express } from 'express';
import type { Server } from 'node:http';

import bodyParser from 'body-parser';
import express from 'express';
import path from 'node:path';

import { ConfigSchema } from '../web/src/schema';
import { draw } from './ui/Draw';

export default class WebServer {
    private readonly http: Express;
    private images: Buffer[];
    private server: Server | null = null;

    public constructor() {
        this.images = [];

        this.http = express();
        this.http.use(bodyParser.urlencoded({ extended: true }));
        this.http.use(bodyParser.json());

        // Todo-soon: Read images from draw code
        // if (WEBIMAGES) {
        //     draw.readyPromise
        //         .then(async () => {
        //             this.images = await draw.getAllViewsAsImages();
        //         })
        //         .catch(console.error);

        //     setInterval(() => {
        //         (async () => {
        //             await draw.readyPromise;
        //             this.images = await draw.getAllViewsAsImages();
        //         })().catch(console.error);
        //     }, 60 * 1000);
        // }
    }
    public serveWebUi(): void {
        this.http.use(express.static(path.join(__dirname, '../', 'webDist')));
        this.http.get('*path', (req, res) => {
            console.log('Serving web ui' + __dirname);
            console.log('Serving web ui' + path.join(__dirname, '../', 'webDist', 'index.html'));
            // Probably not necessary debug print
            // const manualPath = path.join(__dirname, '../', 'webDist', 'index.html');
            // readFile(manualPath)
            //     .then((data) => {
            //         console.log('File: ' + data.toString());
            //     })
            //     .catch((err) => {
            //         console.log('Serving web ui' + err);
            //     });
            res.sendFile(path.join(__dirname, '../', 'webDist', 'index.html'));
        });
    }

    private registerRoutes(): void {
        const apiRouter = express.Router();

        apiRouter.get('/data', (req, res) => {
            res.sendFile(path.join(__dirname, '../', 'config.json'));
        });

        apiRouter.get('/images/:id', (req, res) => {
            // Todo-soon: Use zod to parse the integer
            // oxlint-disable-next-line unicorn/prefer-number-properties radix
            const id = parseInt(req.params.id);
            if (id < 0 || id >= this.images.length) {
                res.status(404).send('Image not found');
            } else {
                res.set('Content-Type', 'image/png');
                res.send(this.images[id]);
            }
        });

        apiRouter.post('/update', async (req, res) => {
            const result = ConfigSchema.safeParse(req.body);
            if (!result.success) {
                console.error(result.error);
                res.status(400).json(result.error);
                return;
            }
            const updatedData = result.data;

            res.json({ message: 'Data updated successfully' });

            // Todo-soon make sure module loaded
            await draw.updateConfig(updatedData);
            this.images = await draw.getAllViewsAsImages();
        });

        this.http.use('/api', apiRouter);
    }

    public async listen(port: number): Promise<void> {
        this.registerRoutes();

        return new Promise((resolve) => {
            this.server = this.http.listen(port, () => resolve());
        });
    }

    public async close(): Promise<void> {
        return new Promise((resolve) => {
            if (this.server) {
                this.server.close(() => {
                    this.server = null;
                    resolve();
                });
            } else {
                resolve();
            }
        });
    }
}

export const webServer = new WebServer();
