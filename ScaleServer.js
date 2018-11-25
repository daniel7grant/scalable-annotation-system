import net from 'net';
import axios from 'axios';
import http from 'http';
import url from 'url';

export default class ScaleServer {
    constructor(port) {
        this.server = http.createServer().listen(port);
    }

    onRequest(request, callback) {
        this.server.on('request', (req, res) => {
            let requrl = url.parse(req.url, true);
            if (request === `${req.method} ${requrl.pathname}`) {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                try {
                    return callback(req, res, requrl.query);
                } catch (ex) {
                    console.log(ex);
                }
            }
        });
        return this;
    }

    onRequestWithBody(request, callback) {
        this.server.on('request', (req, res) => {
            let requrl = url.parse(req.url, true);
            if (request === `${req.method} ${requrl.pathname}`) {
                let body = '';
                res.writeHead(200, { 'Content-Type': 'application/json' });
                req.on('data', chunk => (body += chunk.toString()));
                req.on('end', () => callback(req, res, JSON.parse(body)));
            }
        });
        return this;
    }

    close() {
        this.server.close();
    }
}
