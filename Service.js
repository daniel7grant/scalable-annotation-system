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
			let {status, data} = await axios({
				socketPath: '/var/run/docker.sock',
				url: `/services/${name}`,
				validateStatus: () => true,
			});
			if (status === 404) {
				data = (await axios({
					method: 'post',
					socketPath: '/var/run/docker.sock',
					url: '/services/create',
					data: {
						Name: name,
						TaskTemplate: {
							ContainerSpec: {
								Image: image,
								Env: ['ASDASD=ASDASD'],
							},
						},
						Mode: {
							Replicated: {
								Replicas: replicas,
							},
						},
					},
				})).data;
			}
			let service = new Service(data.ID, name, image, replicas);
			return await service.converge(service, 60, true);
		} catch (exception) {
			console.error(exception);
		}
	}

	async converge(promise, timeoutSec = 60, debug = false) {
		return new Promise(async (resolve, reject) => {
			debug && process.stdout.write('Waiting for converging...\n');
			let timeout = setTimeout(() => {
				reject('Service cannot converge.')
			}, timeoutSec * 1000);
			let containers;
			do {
				containers = await this.listContainers();
				debug &&
				process.stdout.write(
					containers
						.map(c => c.Status.State.padEnd(12, ' '))
						.join('')
						.concat('                      \r'),
				);
			} while (!containers.reduce((acc, c) => acc && c.Status.State === 'running', true));
			debug && process.stdout.write('\n');
			clearTimeout(timeout);
			resolve(promise);
		});
	}

	static getNodesById() {
		return axios({
			socketPath: '/var/run/docker.sock',
			url: '/nodes',
		}).then(({data}) =>
			data.reduce(
				(byid, node) => ({
					...byid,
					[node.ID]: node,
				}),
				{},
			),
		);
	}

	getVersion() {
		return axios({
			socketPath: '/var/run/docker.sock',
			url: '/services/' + this.name,
		}).then(res => {
			return res.data.Version.Index;
		});
	}

	listContainers() {
		return Service.getNodesById().then(nodes =>
			axios({
				socketPath: '/var/run/docker.sock',
				url: '/tasks',
			})
				.then(({data}) => data.filter(task => task.ServiceID === this.id))
				.then(containers =>
					containers.map(container => ({
						...container,
						Node: nodes[container.NodeID],
					})),
				),
		);
	}

	/** @returns Promise<Socket> */
	retrieveContainerStats(containerId) {
		return new Promise((resolve, reject) => {
			let socket = net.createConnection('/var/run/docker.sock', () => {
				socket.write(
					`GET /containers/${containerId}/stats HTTP/1.1\r\n` +
					`Host: localhost\r\n` +
					`\r\n`,
					() => resolve(socket),
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
						Image: this.image,
					},
				},
				Mode: {
					Replicated: {
						Replicas: replicas,
					},
				},
			},
		})
			.then(({data}) => this.converge(data.Warnings))
			.catch(console.error);
	}

	increment() {
		return this.scale(this.replicas + 1);
	}

	decrement() {
		return this.scale(this.replicas - 1);
	}

	attachTo(server) {
		return server
			.onRequest('GET /service/container/stats', async (req, res, query) => {
				this.retrieveContainerStats(query.id)
					.then(socket => {
						socket.on('data', chunk => res.write(chunk.toString()));
						req.on('close', () => socket.destroy());
					})
					.catch(console.error);
				req.on('close', () => res.end());
			})
			.onRequest(`DELETE /service/${this.id}`, async (req, res) => {
				await this.remove();
				res.end();
			})
			.onRequest(`DELETE /service/${this.name}`, async (req, res) => {
				await this.remove();
				res.end();
			});
	}

	remove() {
		return axios({
			method: 'delete',
			socketPath: '/var/run/docker.sock',
			url: `/services/${this.name}`,
		}).then(({data}) => data);
	}
}
