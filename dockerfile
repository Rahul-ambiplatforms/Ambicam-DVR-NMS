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

# Run NodeMediaServer when the container starts
CMD [ "npm", "start" ]
