import Service from './Service';
import ScaleServer from './ScaleServer';
import net from 'net';

process.stdout.write('Creating service...\n');
Service.create('web', 'php:7.2-apache', 5)
    .then(async function(service) {
        process.stdout.write('Service created.\n');
        let server = new ScaleServer(3000);
        server
            .onRequest('GET /service/container/stats', async (req, res, query) => {
                service
                    .retrieveContainerStats(query.id)
                    .then(socket => {
                        socket.on('data', chunk => res.write(chunk.toString()));
                        req.on('close', () => socket.destroy());
                    })
                    .catch(console.error);
                req.on('close', () => res.end());
            })
            .onRequest('DELETE /service', async (req, res) => {
                await service.remove();
                res.end();
                return server.close();
            });

        let containers = await service.listContainers();

        let cnt = 0;
        let stats = containers.map(async container => {
            let socket = net.createConnection(
                { host: container.Node.Status.Addr, port: 3000 },
                () => {
                    socket.write(
                        `GET /service/container/stats?id=${
                            container.Status.ContainerStatus.ContainerID
                        } HTTP/1.1\r\n\r\n`
                    );
                    socket.on('data', chunk => {
                        chunk = chunk.toString();
                        if (chunk && chunk.indexOf('{') >= 0)
                            console.log(
                                container.Status.ContainerStatus.ContainerID,
                                (
                                    JSON.parse(chunk.substr(chunk.indexOf('{')).trim()).memory_stats
                                        .usage / 1e6
                                )
                                    .toFixed(2)
                                    .concat('MB')
                            );
                        if (!(++cnt % 5)) console.log();
                    });
                }
            );
            return socket;
        });
    })
    .catch(console.error);
