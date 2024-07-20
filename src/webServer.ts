import bodyParser from 'body-parser';
import express, { Express } from 'express';
import path from 'path';

import { draw } from './ui/Draw';
import { ConfigSchema } from '../web/src/schema';

export default class HttpServer {
    private http: Express;
    private images: Buffer[];

    constructor() {
        this.images = [];

        this.http = express();
        this.http.use(express.static('webdist'));
        this.http.use(
            bodyParser.urlencoded({
                extended: true,
            }),
        );
        this.http.use(bodyParser.json());

        this.http.get('/config', (req, res) => {
            res.sendFile('config.html', { root: 'webdist' });
        });
        this.http.get('/', (req, res) => {
            res.sendFile('index.html', { root: 'webdist' });
        });
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

        // eslint-disable-next-line @typescript-eslint/no-misused-promises
        this.http.post('/update', async (req, res) => {
            const result = ConfigSchema.safeParse(req.body);
            if (!result.success) {
                console.error(result.error);
                return res.status(400).json(result.error);
            }
            const updatedData = result.data;

            res.json({ message: 'Data updated successfully' });

            await draw.readyPromise;
            await draw.updateConfig(updatedData);
            if (process.env.WEBIMAGES === 'true') {
                this.images = await draw.getAllViewsAsImages();
            }
        });

        this.http.listen(3000, () => {
            console.log('Server running on 3000');
        });

        if (process.env.WEBIMAGES === 'true') {
            draw.readyPromise
                .then(async () => {
                    this.images = await draw.getAllViewsAsImages();
                })
                .catch(console.error);

            setInterval(() => {
                (async () => {
                    await draw.readyPromise;
                    this.images = await draw.getAllViewsAsImages();
                })().catch(console.error);
            }, 60 * 1000);
        }
    }
}

export const httpServer = new HttpServer();
