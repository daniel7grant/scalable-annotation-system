const cv = require('opencv4nodejs');
const zeroPad = require('./utils').zeroPad;

console.log('Connecting to camera.');
const camera = new cv.VideoCapture('rtsp://152.66.221.87:554/video.mp4');
camera.set(cv.CAP_FFMPEG, 1);
console.log('Connected to camera.');

let k = 0, fps = 0;
let frame, prev;

// avgDiff fields
const AVGDIFF_THRESHOLD = 4;
let avgdiff;

// bgSubtract fields
const BGSUB_ARRSIZE = 50;
let bgAvg, bgRemoved;
let frameQueue = Array(BGSUB_ARRSIZE);

setInterval(() => {
	console.log('Current fps:', k - fps);
	fps = k;
}, 1000);

background();

function background() {
	prev = frame;
	frame = camera.read().bgrToGray();

	let avg = avgDiff(frame, prev);
	cv.imwrite('./frames/avg' + zeroPad(k) + '.jpg', avg);
	cv.imwrite('./frames/bin' + zeroPad(k) + '.jpg', avg.threshold(10, 255, cv.THRESH_BINARY));

	++k;
	return setImmediate(() => background());
}

function avgDiff(frame, prev) {
	prev = prev || frame;
	avgdiff = frame.absdiff(prev);
	return avgdiff;
}

function bgSubstract(frame) {
	bgAvg = bgAvg || frame;
	if (k < BGSUB_ARRSIZE) {
		frameQueue[k] = frame;
		bgAvg = bgAvg.addWeighted(k / (k + 1), frame, 1 / (k + 1), 0);
	}
	else {
		bgRemoved = frameQueue.shift();
		frameQueue.push(frame);
		bgAvg = bgAvg.addWeighted(k / (k + 1), frame, 1 / (k + 1), 0).addWeighted((k + 1) / k, bgRemoved, -(1 / k), 0);
	}
}