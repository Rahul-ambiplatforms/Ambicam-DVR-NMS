const NodeMediaServer = require("node-media-server");
const path = require('path');
const fs = require('fs');
const moment = require("moment")

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
    mediaroot: "/mnt/dvr_volume/Recordings",
  },
  trans: {
    ffmpeg: '/usr/bin/ffmpeg',
    tasks: []
  },
  https: {
    port: 443,
    key: './ambicam.key',
    cert: './ambicam.crt',
  },
};

const nms = new NodeMediaServer(config);


nms.on('postPublish', async (id, StreamPath, args) => {
  try {
  console.log('[NodeEvent on postPublish]', `id=${id} StreamPath=${StreamPath} args=${JSON.stringify(args)}`);
  let uuid = StreamPath.split("/")[2];
  const streamId = StreamPath.split("/")[1];
  const epochTime = moment().format("DD_MM_YY");

  const taskConfig = {
      date:epochTime,
      app: streamId,
      hls: true,
      ac: "aac",
      acParam: ['-ab', '64k', '-ac', '1', '-ar', '44100'],
      hlsFlags: `[hls_time=6:hls_list_size=15000:hls_flags=append_list:strftime=1]`,
      hlsKeep: true, // to prevent hls file delete after end the stream

  };

  // Append the task configuration to the trans tasks
  config.trans.tasks.push(taskConfig);
  console.log('Trans configuration updated:', taskConfig);
} catch (error) {
  console.error('Error in postPublish event handler:', error);
}
});


nms.on('donePublish', async (id, StreamPath, args) => {
  console.log('[NodeEvent on donePublish]', `id=${id} StreamPath=${StreamPath} args=${JSON.stringify(args)}`);
  // Asynchronous operations here
});




nms.run();
