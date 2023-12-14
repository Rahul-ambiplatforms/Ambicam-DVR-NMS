const NodeMediaServer = require("node-media-server");
const path = require('path');
const fs = require('fs');
const moment = require("moment")

const config = {
  rtmp: {
    port: 1935,
    chunk_size: 60000,
    gop_cache: true,
    ping: 60,
    ping_timeout: 30,
  },
  http: {
    port: 8000,
    allow_origin: '*',
    mediaroot: "./Recordings",
  },
  trans: {
    ffmpeg: '/usr/bin/ffmpeg', // Set the path to your FFmpeg binary
    tasks: [],
  },
};

const nms = new NodeMediaServer(config);

nms.run();

nms.on('postPublish', (id, StreamPath, args) => {
  console.log('[NodeEvent on postPublish]', `id=${id} StreamPath=${StreamPath} args=${JSON.stringify(args)}`);
  const streamId = StreamPath.split("/")[1];
  const epochTime = moment().format("DD_MM_YY");
  const taskConfig = {
    app: streamId,
    ac: "aac",
    hls: true,
    hlsKeep: true,
    hlsFlags:  `[hls_time=30:hls_list_size=5000:hls_flags=append_list:strftime=1:hls_segment_filename=./Recordings${StreamPath}/${epochTime}/%s.ts]`,
  };
  // Append the task configuration to the trans tasks
  config.trans.tasks.push(taskConfig);
  console.log('Trans configuration updated:', taskConfig);
});


nms.on('donePublish', (id, StreamPath, args) => {
  console.log('[NodeEvent on donePublish]', `id=${id} StreamPath=${StreamPath} args=${JSON.stringify(args)}`);
});
