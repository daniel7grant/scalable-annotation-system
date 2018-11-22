import http from 'http';
import url from 'url';

import Service from './Service';

Service.create('web', 'php:7.2-apache', 5)
    .then(async function(service) {
        let server = http
            .createServer(async (req, res) => {
                let body = '';
                let requrl = url.parse(req.url, true);
                req.on('data', chunk => (body += chunk.toString()));
                res.writeHead(200, { 'Content-Type': 'application/json' });
                switch (`${req.method} ${requrl.pathname}`) {
                    case 'GET /service/containers':
                        return res.end(JSON.stringify(await service.listContainers()));
                    case 'GET /service/container/stats':
                        service
                            .retrieveContainerStats(requrl.query.id)
                            .then(socket =>
                                socket.on('data', chunk =>
                                    res.write(chunk.toString())
                                )
                            )
                            .catch(console.error);
                        break;
                    case 'POST /service/scale':
                        req.on('end', async () => {
                            body = JSON.parse(body);
                            return res.end(JSON.stringify(await service.scale(body.replicas)));
                        });
                        break;
                    case 'POST /service/increment':
                        return res.end(JSON.stringify(await service.increment()));
                    case 'POST /service/decrement':
                        return res.end(JSON.stringify(await service.decrement()));
                    case 'DELETE /service':
                        await service.remove();
                        res.end();
                        return server.close();
                    default:
                        return res.end(`${req.method} ${req.url}`);
                }
            })
            .listen(3000);
    })
    .catch(console.error);
