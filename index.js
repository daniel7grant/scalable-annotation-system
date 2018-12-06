import fs from 'fs';
import Service from './Service';
import ScaleServer from './ScaleServer';

const LOW_FPS = 12;

let replicas = 1;
let server = new ScaleServer(3000);
let cameras = {
	'a5dfab5d': 'rtsp://152.66.221.87:554/video.mp4',
	'd5ada61e': 'rtsp://152.66.221.87:554/video.mp4',
};
let distribution = {};
let log = fs.createWriteStream('logs/cameras.log');

process.stdout.write('Creating service...\n');
Service.create('detection', 'motion-detector', replicas)
	.then(async function (service) {
		process.stdout.write('Service created.\n');
		service.attachTo(server);

		server.onRequestWithBody('POST /report', (req, res, body) => {
			// Log for whatever reason
			console.log(body);
			log.write(JSON.stringify(body).concat('\n'));
			return res.end(JSON.stringify(cameras));

			// // First case, just fill the first replica
			// if (Object.keys(distribution).length === 0) {
			// 	distribution[body.id] = Object.keys(cameras);
			// }
			//
			// When FPS is too low, UPSCALE the container number
			if (body.cameras.length &&
				body.cameras.reduce((acc, cam) => acc && cam.fps <= LOW_FPS, true)) {
				console.log('UPSCALE');
				//
				// 	// One camera cannot be on multiple containers
				// 	if (replicas < cameras.length) {
				// 		++replicas;
				// 		for (let i = 0; i < cameras.length / replicas; ++i) {
				// 			let maxkey = Object.entries(distribution).reduce((acc, entry) => entry[1].length > acc ? entry[0] : acc, -1);
				// 			let moveId = distribution[maxkey].shift();
				//
				// 		}
				// 		service.increment();
				// 	}
			}
			//
			// distribution[body.id].map(id => cameras)

		});

		process.on('exit', () => {
			service.remove();
			server.close();
		});
	})
	.catch(console.error);