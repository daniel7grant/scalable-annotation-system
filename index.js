import http from 'http';

import Service from './Service';

Service.create('web', 'php:7.2-apache', 5)
    .then(async function(service) {
        let server = http
            .createServer(async (req, res) => {
                let result = null;
                let body = '';
                req.on('data', chunk => (body += chunk.toString()));
                res.writeHead(200, { 'Content-Type': 'application/json' });
                switch (`${req.method} ${req.url}`) {
                    case 'GET /service/containers':
                        result = await service.listContainers();
                        return res.end(JSON.stringify(result));
                    case 'POST /service/scale':
                        req.on('end', async () => {
                            body = JSON.parse(body);
                            return res.end(JSON.stringify(await service.scale(body.replicas)));
                        });
                        break;
                    case 'POST /service/increment':
                        result = await service.increment();
                        return res.end(JSON.stringify(result));
                    case 'POST /service/decrement':
                        result = await service.decrement();
                        return res.end(JSON.stringify(result));
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
