const axios = require('axios');
const crypto = require('crypto');
const Camera = require('./Camera');

const selfId = crypto.randomBytes(16).toString('hex');

let cameras = {};

setInterval(() => {
	axios({
		method: 'post',
		baseURL: 'http://80.211.1.84:3000/',
		url: '/report',
		data: {
			id: selfId,
			cameras: Object.entries(cameras).map((entry) => ({
				id: entry[1].id,
				fps: entry[1].fps,
				means: entry[1].resetMeans(),
				lightness: entry[1].resetLightness(),
			})),
		},
	}).then((response) => {
		console.log(response.data);
		transferUrlsToCamera(response.data);
	}).catch((error) => {
		console.log('Service not ready yet.')
	});
}, 1000);

function transferUrlsToCamera(urls) {
	Object.keys(urls).forEach(function (key) {
		if (!cameras[key]) {
			cameras[key] = new Camera(key, urls[key]);
			cameras[key].background();
		}
		if (!urls[key]) {
			console.log(key);
			delete cameras[key];
		}
	});
}