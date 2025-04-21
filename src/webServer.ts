import bodyParser from 'body-parser';
import express, { type Express } from 'express';
import { readFile } from 'node:fs/promises';
import type { Server } from 'node:http';
import path from 'node:path';

import { draw } from './ui/Draw';
import { ConfigSchema } from '../web/src/schema';

export default class WebServer {
    private http: Express;
    private images: Buffer[];
    private server: Server | null = null;

    constructor() {
        this.images = [];

        this.http = express();
        this.http.use(bodyParser.urlencoded({ extended: true }));
        this.http.use(bodyParser.json());
        
        // TODO: Read images from draw code
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
    serveWebUi(): void {
        this.http.use(express.static(path.join(__dirname, '../', 'webDist')));
        this.http.get('*path', (req, res) => {
            console.log('Serving web ui' + __dirname);
            console.log('Serving web ui' + path.join(__dirname, '../', 'webDist', 'index.html'));
            const manualPath = path.join(__dirname, '../', 'webDist', 'index.html');
            readFile(manualPath).then((data) => {
                console.log('File: ' + data.toString());
            }).catch((err) => {
                console.log('Serving web ui' + err);
            });
            res.sendFile(path.join(__dirname, '../', 'webDist', 'index.html'));
        });
    }

    private registerRoutes(): void {
        const apiRouter = express.Router();

        apiRouter.get('/data', (req, res) => {
            res.sendFile(path.join(__dirname, '../', 'config.json'));
        });

        apiRouter.get('/images/:id', (req, res) => {
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

            // TODO make sure module loaded
            await draw.updateConfig(updatedData);
            this.images = await draw.getAllViewsAsImages();
        });

        this.http.use('/api', apiRouter);
    }

    async listen(port: number): Promise<void> {
        this.registerRoutes();

        return new Promise((resolve) => {
            this.server = this.http.listen(port, () => resolve());
        });
    }

    async close(): Promise<void> {
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
