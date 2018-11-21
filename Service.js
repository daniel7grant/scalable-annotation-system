const axios = require('axios');

export default class Service {
	constructor(id, name, image, replicas) {
		this.id = id;
		this.name = name;
		this.image = image;
		this.replicas = replicas;
	}

	static async create(name, image, replicas = 1) {
		try {
			let res = await axios({
				method: 'post',
				socketPath: '/var/run/docker.sock',
				url: '/services/create',
				data: {
					'Name': name,
					'TaskTemplate': {
						'ContainerSpec': {
							'Image': image,
						},
					},
					'Mode': {
						'Replicated': {
							'Replicas': replicas,
						},
					},
				},
			});
			return new Service(res.data.ID, name, image, replicas);
		}
		catch (exception) {
			console.error(exception);
		}
	}

	getVersion() {
		return axios({
			socketPath: '/var/run/docker.sock',
			url: '/services/' + this.name,
		}).then(res => {
			return res.data.Version.Index;
		})
	}

	listContainers() {
		return axios({
			socketPath: '/var/run/docker.sock',
			url: '/containers/json',
		}).then(res => {
			return res.data.filter(container =>
				container.Labels['com.docker.swarm.service.name']
				&& container.Labels['com.docker.swarm.service.name'] === this.name,
			);
		})
	}

	async scale(replicas) {
		let version = await this.getVersion();
		return axios({
			method: 'post',
			socketPath: '/var/run/docker.sock',
			url: `/services/${this.name}/update?version=${version}`,
			data: {
				'Name': this.name,
				'TaskTemplate': {
					'ContainerSpec': {
						'Image': 'php:7.2-alpine',
					},
				},
				'Mode': {
					'Replicated': {
						'Replicas': replicas,
					},
				},
			},
		});
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
			url: `/services/${this.name}`,
		});
	}
}