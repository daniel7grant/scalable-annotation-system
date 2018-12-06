import Service from './Service';
import ScaleServer from './ScaleServer';
import net from 'net';

process.stdout.write('Creating service...\n');
Service.create('detection', 'motion-detector', 5)
    .then(async function(service) {
        process.stdout.write('Service created.\n');
        let server = new ScaleServer(3000);
        service.attachTo(server);

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
