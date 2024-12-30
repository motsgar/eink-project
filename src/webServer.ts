import bodyParser from 'body-parser';
import express, { type Express } from 'express';
import path from 'node:path';

import { WEBIMAGES } from './env';
import { draw } from './ui/Draw';
import { ConfigSchema } from '../web/src/schema';

export default class WebServer {
    private http: Express;
    private images: Buffer[];

    constructor() {
        this.images = [];

        this.http = express();
        this.http.use(bodyParser.urlencoded({ extended: true }));
        this.http.use(bodyParser.json());

        this.http.get('/data', (req, res) => {
            res.sendFile(path.join(__dirname, '../', 'config.json'));
        });
        this.http.get('/images/:id', (req, res) => {
            const id = parseInt(req.params.id);
            if (id < 0 || id >= this.images.length) {
                res.status(404).send('Image not found');
            } else {
                res.set('Content-Type', 'image/png');
                res.send(this.images[id]);
            }
        });

        this.http.post('/update', async (req, res) => {
            const result = ConfigSchema.safeParse(req.body);
            if (!result.success) {
                console.error(result.error);
                res.status(400).json(result.error);
                return;
            }
            const updatedData = result.data;

            res.json({ message: 'Data updated successfully' });

            await draw.readyPromise;
            await draw.updateConfig(updatedData);
            if (WEBIMAGES) this.images = await draw.getAllViewsAsImages();
        });

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

    async listen(port: number): Promise<void> {
        return new Promise((resolve) => {
            this.http.listen(port, () => resolve());
        });
    }
}

export const webServer = new WebServer();
