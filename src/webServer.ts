import bodyParser from 'body-parser';
import express, { Express } from 'express';
import path from 'path';
import { draw } from './ui/Draw';

export default class HttpServer {
    private http: Express;

    constructor() {
        this.http = express();
        this.http.use(express.static('webdist'));
        this.http.use(
            bodyParser.urlencoded({
                extended: true,
            }),
        );
        this.http.use(bodyParser.json());

        this.http.get('/', (req, res) => {
            res.sendFile('index.html', { root: 'webdist' });
        });
        this.http.get('/data', (req, res) => {
            res.sendFile(path.join(__dirname, '../', 'config.json'));
        });
        this.http.post('/update', (req, res) => {
            const updatedData = req.body;

            draw.readyPromise
                .then(() => {
                    draw.updateConfig(updatedData).catch(console.error);
                })
                .catch(console.error);

            res.json({ message: 'Data updated successfully' });
        });

        this.http.listen(3000, () => {
            console.log('Server running on 3000');
        });
    }
}

export const httpServer = new HttpServer();
