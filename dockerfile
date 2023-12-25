# Use the official Node.js 14 image
FROM node:16

# Install ffmpeg
RUN apt-get update && apt-get install -y ffmpeg

# Create app directory
WORKDIR /usr/src/app

# Copy package.json and package-lock.json to the working directory
COPY package*.json ./

# Install Node.js dependencies
RUN npm install

# Bundle app source
COPY . .

# Expose RTMP and HTTP ports
EXPOSE 1935 
EXPOSE 8000

# Install s3fs dependencies
RUN apt-get update && \
    apt-get install -y fuse automake autotools-dev g++ git libcurl4-gnutls-dev libfuse-dev libssl-dev libxml2-dev make pkg-config && \
    rm -rf /var/lib/apt/lists/*

# Clone and build s3fs
ARG S3FS_VERSION=v1.86
RUN git clone https://github.com/s3fs-fuse/s3fs-fuse.git && \
    cd s3fs-fuse && \
    git checkout tags/${S3FS_VERSION} && \
    ./autogen.sh && \
    ./configure --prefix=/usr && \
    make && \
    make install && \
    make clean && \
    cd .. && \
    rm -rf s3fs-fuse

# Create mount point
ENV MNT_POINT /usr/src/app/Recordings/
RUN mkdir -p "$MNT_POINT"

# Copy run.sh script
COPY run.sh /usr/src/app/run.sh
RUN chmod +x /usr/src/app/run.sh  # Make the script executable
# Run NodeMediaServer when the container starts
CMD /usr/src/app/run.sh && npm start
