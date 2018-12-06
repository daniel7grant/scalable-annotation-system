const cv = require('opencv4nodejs');
const fs = require('fs');
const Camera = require('./Camera');

let urls = {
	'a5dfab5d': 'rtsp://152.66.221.87:554/video.mp4',
	'd5ada61e': 'rtsp://152.66.221.87:554/video.mp4',
};
let cameras = {};

Object.keys(urls).forEach(function (key) {
	if (!cameras[key]) {
		cameras[key] = new Camera(key, urls[key]);
		cameras[key].background();
	}
});