import Service from './Service';
import ScaleServer from './ScaleServer';

Service.create('web', 'php:7.2-apache', 5)
    .then(async function(service) {
        let server = new ScaleServer(3000);

        server.onRequest('GET /service/containers', async (req, res) =>
            res.end(JSON.stringify(await service.listContainers()))
        );
        server.onRequest('GET /service/container/stats', async (req, res, query) => {
            service
                .retrieveContainerStats(query.id)
                .then(socket => {
                    socket.on('data', chunk => res.write(chunk.toString()));
	                req.on('close', () => socket.destroy());
                })
                .catch(console.error);
            req.on('close', () => res.end());
        });
        server.onRequest('POST /service/increment', async (req, res) =>
            res.end(JSON.stringify(await service.increment()))
        );
        server.onRequest('POST /service/decrement', async (req, res) =>
            res.end(JSON.stringify(await service.decrement()))
        );
        server.onRequest('DELETE /service', async (req, res) => {
            await service.remove();
            res.end();
            return server.close();
        });
        server.onRequestWithBody('POST /service/scale', async (req, res, body) => {
            res.end(JSON.stringify(await service.scale(body.replicas)));
        });
    })
    .catch(console.error);
