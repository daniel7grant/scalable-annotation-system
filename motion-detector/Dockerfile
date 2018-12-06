FROM debian:9

ENV OPENCV4NODEJS_DISABLE_AUTOBUILD=1 \
	OPENCV_VERSION='3.4.4' \
	LIB_PREFIX='/usr/local' \
	FFMPEG_PATH='/usr/bin/ffmpeg' \
	FFPROBE_PATH='/usr/bin/ffprobe'

# INSTALL NODE JS AND FFMPEG
RUN apt-get update && \
	apt-get install -y build-essential curl git python cmake \
		pkg-config libavutil-dev libavcodec-dev libavformat-dev libswscale-dev libavresample-dev \
		libpng-dev libjpeg-dev libwebp-dev libtiff5-dev libopenexr-dev libopenblas-dev libx11-dev ffmpeg && \
	curl -sL https://deb.nodesource.com/setup_11.x | bash && \
	apt-get install -y nodejs && node -v && npm -v && \
	rm -rf /var/lib/apt/lists/*

# INSTALL OPENCV
RUN mkdir opencv && \
	cd opencv && \
	curl -sL https://github.com/opencv/opencv/archive/3.4.4.tar.gz | tar xz && \
	curl -sL https://github.com/opencv/opencv_contrib/archive/3.4.4.tar.gz | tar xz && \
	mkdir opencv-3.4.4/build && \
	cd opencv-3.4.4/build && \
	cmake -D CMAKE_BUILD_TYPE=RELEASE \
		-D BUILD_EXAMPLES=OFF \
		-D BUILD_DOCS=OFF \
		-D BUILD_TESTS=OFF \
		-D BUILD_PERF_TESTS=OFF \
		-D BUILD_JAVA=OFF \
		-D BUILD_opencv_apps=OFF \
		-D BUILD_opencv_aruco=OFF \
		-D BUILD_opencv_bgsegm=OFF \
		-D BUILD_opencv_bioinspired=OFF \
		-D BUILD_opencv_ccalib=OFF \
		-D BUILD_opencv_datasets=OFF \
		-D BUILD_opencv_dnn_objdetect=OFF \
		-D BUILD_opencv_dpm=OFF \
		-D BUILD_opencv_fuzzy=OFF \
		-D BUILD_opencv_hfs=OFF \
		-D BUILD_opencv_java_bindings_generator=OFF \
		-D BUILD_opencv_js=OFF \
		-D BUILD_opencv_img_hash=OFF \
		-D BUILD_opencv_line_descriptor=OFF \
		-D BUILD_opencv_optflow=OFF \
		-D BUILD_opencv_phase_unwrapping=OFF \
		-D BUILD_opencv_python3=OFF \
		-D BUILD_opencv_python_bindings_generator=OFF \
		-D BUILD_opencv_reg=OFF \
		-D BUILD_opencv_rgbd=OFF \
		-D BUILD_opencv_saliency=OFF \
		-D BUILD_opencv_shape=OFF \
		-D BUILD_opencv_stereo=OFF \
		-D BUILD_opencv_stitching=OFF \
		-D BUILD_opencv_structured_light=OFF \
		-D BUILD_opencv_superres=OFF \
		-D BUILD_opencv_surface_matching=OFF \
		-D BUILD_opencv_ts=OFF \
		-D BUILD_opencv_xobjdetect=OFF \
		-D BUILD_opencv_xphoto=OFF \
		-D CMAKE_INSTALL_PREFIX=/usr/local \
		-D OPENCV_EXTRA_MODULES_PATH=../../opencv_contrib-3.4.4/modules \
		.. && \
	make -j $(nproc) && \
	make install && \
	sh -c 'echo "/usr/local/lib" > /etc/ld.so.conf.d/opencv.conf' && \
	ldconfig && \
	cd ../../../ && \
	rm -rf opencv

# INSTALL OPENCV 4 NODEJS
RUN npm install -g opencv4nodejs --unsafe-perm

# CLEAN UP
RUN apt-get purge -y build-essential curl git python cmake \
	pkg-config libavutil-dev libavcodec-dev libavformat-dev libswscale-dev libavresample-dev && \
	apt-get autoremove -y --purge

# COPY APP FILES
COPY app/* /usr/local/lib/motion-detector/

# START NODE APP
WORKDIR /usr/local/lib/motion-detector
ENV NODE_PATH=/usr/lib/node_modules/
CMD ['node', 'index.js']