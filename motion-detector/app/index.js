const cv = require('opencv4nodejs');
const fs = require('fs');
const zeroPad = require('./utils').zeroPad;

console.log('Connecting to camera.');
const camera = new cv.VideoCapture('rtsp://152.66.221.87:554/video.mp4');
camera.set(cv.CAP_FFMPEG, 1);
console.log('Connected to camera.');

let log = fs.createWriteStream('logs/means.txt');

let k = 0, fps = 0;
let frame, prev, avg, threshold;

// avgDiff fields
const AVGDIFF_THRESHOLD = 4;
let avgdiff;

// bgSubtract fields
const BGSUB_ARRSIZE = 120;
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

	avg = bgSubstract(frame, prev);
	threshold = avg.threshold(40, 255, cv.THRESH_BINARY);
	cv.imwrite('./frames/avg' + zeroPad(k) + '.jpg', avg);
	cv.imwrite('./frames/bg' + zeroPad(k) + '.jpg', bgAvg);
	cv.imwrite('./frames/bin' + zeroPad(k) + '.jpg', threshold);
	log.write(k.toString().concat(': ').concat(avg.mean().w).concat('\n'));

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
	if (k >= BGSUB_ARRSIZE) {
		bgRemoved = frameQueue.shift();
		frameQueue[BGSUB_ARRSIZE - 1] = frame;
		bgAvg = bgAvg
			.addWeighted(BGSUB_ARRSIZE / (BGSUB_ARRSIZE + 1), frame, 1 / (BGSUB_ARRSIZE + 1), 0)
			.addWeighted((BGSUB_ARRSIZE + 1) / BGSUB_ARRSIZE, bgRemoved, -(1 / BGSUB_ARRSIZE), 0);
	}
	else {
		frameQueue[k] = frame;
		bgAvg = bgAvg.addWeighted(k / (k + 1), frame, 1 / (k + 1), 0);
	}
	return frame.absdiff(bgAvg);
}

process.on('exit', () => {
	log.close();
});