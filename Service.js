import net from 'net';
import axios from 'axios';

export default class Service {
    constructor(id, name, image, replicas) {
        this.id = id;
        this.name = name;
        this.image = image;
        this.replicas = replicas;
    }

    /** @returns {Promise<Service>} */
    static async create(name, image, replicas = 1) {
        try {
            let res = await axios({
                method: 'post',
                socketPath: '/var/run/docker.sock',
                url: '/services/create',
                data: {
                    Name: name,
                    TaskTemplate: {
                        ContainerSpec: {
                            Image: image
                        }
                    },
                    Mode: {
                        Replicated: {
                            Replicas: replicas
                        }
                    }
                }
            });
            return await Service.converge(new Service(res.data.ID, name, image, replicas));
        } catch (exception) {
            console.error(exception);
        }
    }

    static async converge(promise, ms = 10000) {
        await new Promise(resolve => setTimeout(resolve, ms));
        return promise;
    }

    static getNodesById() {
        return axios({
            socketPath: '/var/run/docker.sock',
            url: '/nodes'
        }).then(({ data }) =>
            data.reduce(
                (byid, node) => ({
                    ...byid,
                    [node.ID]: node
                }),
                {}
            )
        );
    }

    getVersion() {
        return axios({
            socketPath: '/var/run/docker.sock',
            url: '/services/' + this.name
        }).then(res => {
            return res.data.Version.Index;
        });
    }

    listContainers() {
        return Service.getNodesById().then(nodes =>
            axios({
                socketPath: '/var/run/docker.sock',
                url: '/tasks'
            })
                .then(({ data }) => data.filter(task => task.ServiceID === this.id))
                .then(containers =>
                    containers.map(container => ({
                        ...container,
                        Node: nodes[container.NodeID]
                    }))
                )
        );
    }

    /** @returns Promise<Socket> */
    retrieveContainerStats(containerId) {
        return new Promise((resolve, reject) => {
            let socket = net.createConnection('/var/run/docker.sock', () => {
                socket.write(
                    `GET /containers/${containerId}/stats HTTP/1.1\r\n` + `Host: localhost\r\n\r\n`,
                    () => resolve(socket)
                );
            });
            socket.on('error', reject);
        });
    }

    async scale(replicas) {
        let version = await this.getVersion();
        this.replicas = replicas;
        return axios({
            method: 'post',
            socketPath: '/var/run/docker.sock',
            url: `/services/${this.name}/update?version=${version}`,
            data: {
                Name: this.name,
                TaskTemplate: {
                    ContainerSpec: {
                        Image: this.image
                    }
                },
                Mode: {
                    Replicated: {
                        Replicas: replicas
                    }
                }
            }
        })
            .then(({ data }) => data.Warnings)
            .catch(console.error);
    }

    increment() {
        return this.scale(this.replicas + 1);
    }

    decrement() {
        return this.scale(this.replicas - 1);
    }

    remove() {
        return axios({
            method: 'delete',
            socketPath: '/var/run/docker.sock',
            url: `/services/${this.name}`
        }).then(({ data }) => data);
    }
}
