const axios = require('axios');

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

    getVersion() {
        return axios({
            socketPath: '/var/run/docker.sock',
            url: '/services/' + this.name
        }).then(res => {
            return res.data.Version.Index;
        });
    }

    listContainers() {
        return axios({
            socketPath: '/var/run/docker.sock',
            url: '/containers/json'
        }).then(res => {
            return res.data.filter(
                container =>
                    container.Labels['com.docker.swarm.service.name'] &&
                    container.Labels['com.docker.swarm.service.name'] === this.name
            );
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
        }).then(({ data }) => data.Warnings);
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
