const NodeMediaServer = require("node-media-server");
const fs = require("fs");
const moment = require("moment");
const ffmpeg = require("fluent-ffmpeg");
const NodeRtmpClient = require("node-media-server/src/node_rtmp_client");

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
    mediaroot: "./media",
    allow_origin: "*",
  },
  // https: {
  //   port: 443,
  //   key: fs.readFileSync("./private-key.pem"),
  //   cert: fs.readFileSync("./certificate.pem"),
  //   mediaroot: "./media",
  //   allow_origin: "*",
  // },
};

const nms = new NodeMediaServer(config);


const outputDir = "./Recordings/";

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir);
}

const clients = {}; // Store NodeRtmpClient instances for each stream

nms.on("postPublish", (_, streamPath, _params) => {
  const streamplan = streamPath.split("/")[1];
  const streamId = streamPath.split("/")[2];

  console.log(
    `Incoming streamPath: ${streamPath}, Extracted streamId: ${streamId}`
  );

  const key = `${streamplan}_${streamId}`;
  if (!clients[key]) {
    const inputURL = `rtmp://localhost:1935/${streamPath.replace(/^\/+/, "")}`;
    clients[key] = new NodeRtmpClient(
      inputURL,
      `${outputDir}${streamplan}/${streamId}/`
    );
    clients[key].inputURL = inputURL;
    clients[key].startRecording();
    console.log(`New stream pushed: ${streamplan}/${streamId}/`);
  } else {
    console.log(
      `Stream already exists. Existing streams: ${Object.keys(clients).join(
        ", "
      )}. Rejecting new stream: ${streamplan}/${streamId}/`
    );
  }
});

nms.on("donePublish", (_, streamPath, _params) => {
  const streamplan = streamPath.split("/")[1];
  const streamId = streamPath.split("/")[2];
  const key = `${streamplan}_${streamId}`;
  console.log(`Stream done: ${streamplan}/${streamId}`);

  if (clients[key]) {
    clients[key].stopRecording();
    delete clients[key];
  }
});

nms.run();

// Periodically process streams
setInterval(() => {
  processStreams();
}, 60000);

function processStreams() {
  for (const key in clients) {
    const [streamplan, streamId] = key.split('_');
    const client = clients[key];
    if (client && client.inputURL) {
      saveStream(client.inputURL, outputDir, streamplan, streamId)
        .then(() => {
          console.log(`Stream saved successfully: ${streamplan}/${streamId}`);
        })
        .catch((err) => {
          console.error(`Error saving stream ${streamplan}/${streamId}:`, err);
        });
    }
  }
}

function saveStream(inputURL, outputDir, streamplan, streamId) {

  // const epochTime = moment().format("HH_mm_ss");
  const epochTime = Date.now();
  let currentDate = new Date().toJSON().slice(0, 10);
  // const streamDir = `${outputDir}${streamplan}/${streamId}/${currentDate}/`;
  const streamDir = `${outputDir}${streamplan}/${streamId}/`;

  if (!fs.existsSync(streamDir)) {
    try {
      fs.mkdirSync(streamDir, { recursive: true });
    } catch (err) {
      console.error("Error creating directory:", err);
      // Handle the error as needed
      return Promise.reject(err);
    }
  }
  const outputFilename = `${streamDir}index.m3u8`;

  return new Promise((resolve, reject) => {
    ffmpeg(inputURL)
      .inputFormat("flv")
      .outputOptions([
        `-hls_segment_filename ${streamDir}${epochTime}.ts`,
        "-hls_time 60",
        "-hls_list_size 5",
        "-t 60",
        "-f hls",
        "-hls_flags append_list", 
        "-strftime 1",
      ])
      .output(outputFilename)
      .on("end", () => {
        console.log(`Saved stream to ${outputFilename}`);
        resolve();
      })
      .on("error", (err, stdout, stderr) => {
        console.error("Error:", err);
        console.error("ffmpeg stdout:", stdout);
        console.error("ffmpeg stderr:", stderr);
        reject(err);
      })
      .run();
  });
}
