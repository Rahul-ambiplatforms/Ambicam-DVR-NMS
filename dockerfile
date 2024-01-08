# Use the official Node.js 16 image
FROM node:16

# Set the timezone to India Standard Time
ENV TZ=Asia/Kolkata

# Install required dependencies
RUN apt-get update \
    && apt-get install -y wget apt-utils

# Install dependencies
RUN apt-get update && apt-get install -y ffmpeg

# Create app directory
WORKDIR /usr/src/app

# Copy package.json and package-lock.json to the working directory
COPY package*.json ./

# Install Node.js dependencies
RUN npm install

# Install PM2 globally
RUN npm install -g pm2

# Bundle app source
COPY . .

# Expose RTMP and HTTP ports
EXPOSE 1938 
EXPOSE 8080
EXPOSE 443

# Run blobfuse to mount Azure Blob Storage
CMD /usr/src/app/run.sh