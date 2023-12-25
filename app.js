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

    // Create a folder with today's date inside the StreamPath if it doesn't exist
  const todayFolderPath = path.join(__dirname, 'Recordings', StreamPath, epochTime);
  if (!fs.existsSync(todayFolderPath)) {
    fs.mkdirSync(todayFolderPath, { recursive: true });
  }

  // Create the initial m3u8 file only if it doesn't exist
  const m3u8FilePath = path.join(todayFolderPath, 'index.m3u8');
  if (!fs.existsSync(m3u8FilePath)) {
    const m3u8Content = ``;
    fs.writeFileSync(m3u8FilePath, m3u8Content);
  }

   
  const taskConfig = {
    app: streamId,
    ac: "aac",
    hls: true,
    hlsKeep: true,
    hlsFlags:  `[hls_time=6:hls_list_size=5000:hls_flags=append_list:strftime=1:hls_segment_filename=./Recordings${StreamPath}/${epochTime}/%s.ts]`,
  };
  // Append the task configuration to the trans tasks
  config.trans.tasks.push(taskConfig);
  console.log('Trans configuration updated:', taskConfig);
});


nms.on('donePublish', (id, StreamPath, args) => {
  console.log('[NodeEvent on donePublish]', `id=${id} StreamPath=${StreamPath} args=${JSON.stringify(args)}`);
});
