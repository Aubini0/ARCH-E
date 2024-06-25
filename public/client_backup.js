let audio;
const domain = window.location.origin;
const captions = window.document.getElementById("user-msg");
const llm_captions = window.document.getElementById("llm-msg");


async function getMicrophone() {
  const userMedia = await navigator.mediaDevices.getUserMedia({
    audio: true,
  });

  return new MediaRecorder(userMedia);
}

async function openMicrophone(microphone, socket) {
  await microphone.start(500);

  microphone.onstart = () => {
    console.log("client: microphone opened");

  };

  microphone.onstop = () => {
    console.log("client: microphone closed");
  };

  microphone.ondataavailable = (e) => {
    // sending data to server
    socket.send(e.data);
    console.log(`Data-Sent : ${socket}`)


  };
}

async function closeMicrophone(microphone) {
  microphone.stop();
}

async function start(socket) {
  const listenButton = document.getElementById("record");
  let microphone;

  console.log("client: waiting to open microphone");

  listenButton.addEventListener("click", async () => {
    if (!microphone) {
      // open and close the microphone
      microphone = await getMicrophone();
      await openMicrophone(microphone, socket);
    } else {
      await closeMicrophone(microphone);
      // clearing chat boxes
      captions.innerHTML = ""
      llm_captions.innerHTML = ""

      stopAudio();
      microphone = undefined;
    }
  });
}

function playAudio(data) {
  const audioContext = new (window.AudioContext || window.webkitAudioContext)();
  const sampleRate = 16000;  // Your specified sample rate
  const numChannels = 1;  // Assuming mono audio

  console.log("client: decoding base64 data");
  // Decode base64 to Uint8Array
  const byteString = atob(data);
  const len = byteString.length;
  const uint8Array = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    uint8Array[i] = byteString.charCodeAt(i);
  }

  console.log("client: creating AudioBuffer");
  // Create an AudioBuffer
  const audioBuffer = audioContext.createBuffer(numChannels, uint8Array.length / 2, sampleRate);

  console.log("client: converting PCM to float values");
  // // Convert PCM to float values
  for (let channel = 0; channel < numChannels; channel++) {
    const nowBuffering = audioBuffer.getChannelData(channel);
    for (let i = 0; i < nowBuffering.length; i++) {
      const sample = (uint8Array[i * 2 + 1] << 8) | (uint8Array[i * 2] & 0xff);
      nowBuffering[i] = (sample >= 0x8000 ? sample - 0x10000 : sample) / 32768.0;  // Normalize 16-bit PCM
    }
  }

  console.log("client: playing audio");
  // Play the buffer
  const source = audioContext.createBufferSource();
  source.buffer = audioBuffer;
  source.connect(audioContext.destination);
  source.start(0);
}
// Function to play audio
function playAudioFile(audioUrl) {
  if (audio) {
    stopAudio();
  }
  // domain = "http://localhost:3000"
  currentAudioUrl = domain + audioUrl + "?t=" + new Date().getTime(); // Add cache-busting query parameter
  audio = new Audio(currentAudioUrl);

  audio.play();

  audio.addEventListener("ended", () => {
    console.log("Audio finished playing");
    stopAudio();
  });
}
// Function to stop audio
function stopAudio() {
  if (audio) {
    audio.pause();
    audio.currentTime = 0;
  }

}
// Function to get websocket url
function getWebSocketURL(path = "") {
  var protocolPrefix =
  window.location.protocol === "https:" ? "wss:" : "ws:";
  var host = window.location.host; // Includes hostname and port

  return protocolPrefix + "//" + host + path;
}


window.addEventListener("load", () => {
  const websocketUrl = getWebSocketURL("/ws");
  console.log({websocketUrl})
  socket = new WebSocket(websocketUrl);
  // Handle WebSocket events
  socket.onopen = async() => {
      console.log('WebSocket connection opened');      
      setTimeout(()=>{} , 1000)
      await start(socket);

  };

  socket.onmessage = (event) => {
      let event_parsed = JSON.parse(event.data);
      let audio_data =  event_parsed.audio
      console.log(`Data-Rcvd : ${socket}`)
      playAudio( audio_data )
  };


  socket.onclose = () => {
      console.log('WebSocket connection closed');
  };

    
});