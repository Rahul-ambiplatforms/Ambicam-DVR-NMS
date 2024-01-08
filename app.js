const NodeMediaServer = require("node-media-server");
const path = require('path');
const fs = require('fs');
const moment = require("moment")
const https = require('https');
const express = require('express');
const WebSocket = require('ws');
const axios = require('axios');

// Express app
const app = express();


const config = {
  rtmp: {
    port: 1938,
    chunk_size: 60000,
    gop_cache: true,
    ping: 60,
    ping_timeout: 30,
  },
  http: {
    port: 8080,
    allow_origin: '*',
    mediaroot: "/mnt/Recordings",
  },
  trans: {
    ffmpeg: '/usr/bin/ffmpeg', // Set the path to your FFmpeg binary
    tasks: [],
  },
  https: {
    port: 443,
    key: './ambicam.key',
    cert: './ambicam.crt',
  },
};

const nms = new NodeMediaServer(config);

const wsConnections = new Map();

nms.on('postPublish', async (id, StreamPath, args) => {
  try {
  console.log('[NodeEvent on postPublish]', `id=${id} StreamPath=${StreamPath} args=${JSON.stringify(args)}`);

  const ws = new WebSocket('wss://orca-app-x5vfq.ondigitalocean.app');
   // Create a new WebSocket connection for the stream
   ws.on('open', async function open() {
     console.log('WebSocket connection established.');
     // Get the public IP address of the router using ipify API
    const response = await axios.get('https://api.ipify.org?format=json');
    const routerPublicIP = response.data.ip;


     // Assuming you have some stream stats to send
     const streamStats = {
       streamName: StreamPath.split("/")[2],
       clientIP: routerPublicIP,
     };

     // Send stream stats to the WebSocket server
     ws.send(JSON.stringify(streamStats));
   });

   ws.on('error', function error(err) {
     console.error('WebSocket connection error:', err);
   });

   ws.on('close', function close(code, reason) {
     console.log('WebSocket connection closed:', code, reason);
   });

   // Store the WebSocket connection in the Map with the stream ID as the key
   wsConnections.set(id, ws);


  const streamId = StreamPath.split("/")[1];
  const epochTime = moment().format("DD_MM_YY");

    // Create a folder with today's date inside the StreamPath if it doesn't exist
  const todayFolderPath = path.join('/mnt', 'Recordings', streamId,StreamPath.split('/')[2],epochTime);

  if (!fs.existsSync(todayFolderPath)) {
    fs.mkdirSync(todayFolderPath, { recursive: true });
  }

  // Create the initial m3u8 file only if it doesn't exist
  const m3u8FilePath = path.join(todayFolderPath, 'index.m3u8');
  if (!fs.existsSync(m3u8FilePath)) {
    const m3u8Content = ``;
    fs.writeFileSync(m3u8FilePath, m3u8Content);
  }

  let hlsFlags;

  if (streamId === "live") {
    // If streamId is "live", set hlsFlags to store only 4 HLS segments
    hlsFlags = `[hls_time=6:hls_flags=delete_segments:hls_list_size=5:strftime=1:hls_segment_filename=${todayFolderPath}/%s.ts]`;
  } else {
    //dvr3 //dvr15 .....
    // For other streamIds, use the original hlsFlags
    hlsFlags = `[hls_time=6:hls_list_size=15000:hls_flags=append_list:strftime=1:hls_segment_filename=${todayFolderPath}/%s.ts]`;
  }

  const taskConfig = {
    date:epochTime,
    app: streamId,
    ac: "aac",
    hls: true,
    hlsKeep: true,
    hlsFlags:  hlsFlags,
  };

  // Append the task configuration to the trans tasks
  config.trans.tasks.push(taskConfig);
  console.log('Trans configuration updated:', taskConfig);
} catch (error) {
  console.error('Error in postPublish event handler:', error);
}
});



nms.on('donePublish', (id, StreamPath, args) => {
  console.log('[NodeEvent on donePublish]', `id=${id} StreamPath=${StreamPath} args=${JSON.stringify(args)}`);
  
  const ws = wsConnections.get(id);

  if (ws) {
    // Close the WebSocket connection
    ws.close();
    console.log('WebSocket connection closed for stream ID:', id);

    // Remove the WebSocket connection from the Map
    wsConnections.delete(id);
  } else {
    console.log('WebSocket connection not found for stream ID:', id);
  }
});



nms.run();