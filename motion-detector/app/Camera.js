const cv = require('opencv4nodejs');
const zeroPad = require('./utils').zeroPad;

class Camera {
	constructor(id, url) {
		console.log(id, url);

		this.id = id;
		this.url = url;
		this.camera = new cv.VideoCapture(url);
		this.camera.set(cv.CAP_FFMPEG, 1);
		this.k = 0;
		this.fpsPrev = 0;
		this.BGSUB_ARRSIZE = 120;
		this.frameQueue = Array(this.BGSUB_ARRSIZE);
		this.means = [];

		setInterval(this.calculateFps.bind(this), 1000);
	}

	background() {
		this.prev = this.frame;
		this.frame = this.camera.read().bgrToGray();

		this.bgSubtract();

		let date = (new Date()).getTime();
		cv.imwrite('./frames/' + this.id + '-avg-' + date + '.jpg', this.avg);
		cv.imwrite('./frames/' + this.id + '-bin-' + date + '.jpg', this.threshold);
		this.means.push(this.avg.mean().w);

		++this.k;
		return setImmediate(() => this.background());
	}

	avgDiff() {
		this.prev = this.prev || this.frame;
		return this.frame.absdiff(this.prev);
	};

	bgSubtract() {
		this.bgAvg = this.bgAvg || this.frame;
		if (this.k >= this.BGSUB_ARRSIZE) {
			this.bgRemoved = this.frameQueue.shift();
			this.frameQueue[this.BGSUB_ARRSIZE - 1] = this.frame;
			this.bgAvg = this.bgAvg
				.addWeighted(this.BGSUB_ARRSIZE / (this.BGSUB_ARRSIZE + 1), this.frame, 1 / (this.BGSUB_ARRSIZE + 1), 0)
				.addWeighted((this.BGSUB_ARRSIZE + 1) / this.BGSUB_ARRSIZE, this.bgRemoved, -(1 / this.BGSUB_ARRSIZE), 0);
		}
		else {
			this.frameQueue[this.k] = this.frame;
			this.bgAvg = this.bgAvg.addWeighted(this.k / (this.k + 1), this.frame, 1 / (this.k + 1), 0);
		}
		this.avg = this.frame.absdiff(this.bgAvg);
		this.threshold = this.avg.threshold(40, 255, cv.THRESH_BINARY);
	}

	calculateFps() {
		let diff = this.k - this.fpsPrev;
		this.fpsPrev = this.k;
		this.fps = diff;
		console.log(this.id + ': ' + diff)
	}
}

module.exports = Camera;