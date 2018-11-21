import Service from './Service';

Service.create('web', 'php:7.2-apache', 5).then(async function (service) {
	await new Promise(resolve => setTimeout(resolve, 10000));
	let version = await service.getVersion();
	console.log(version);
	let containers = await service.listContainers();
	console.log(containers);
	// await service.increment();
	await service.remove();
});
