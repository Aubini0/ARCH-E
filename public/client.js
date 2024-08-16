let chat_socket;
let audioQueue = [];
let isPlaying = false;
const chatContainer = document.getElementById('chat_container');
const inputField = document.getElementById("user-text-msg");
const sendBtn = document.getElementById("user-text-msg");
var llmResponseDiv = null;
let audioContext = new (window.AudioContext || window.webkitAudioContext)();
const currentDomain = window.location.origin;

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

function playNextAudio() {
  if (audioQueue.length > 0 && !isPlaying) {
    isPlaying = true;
    const data = audioQueue.shift();
    playAudio(data);
  }
}

function playAudio(data) {
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
  // Convert PCM to float values
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
  source.onended = () => {
    isPlaying = false;
    playNextAudio();
  };
  source.start(0);
}

function getWebSocketURL(path = "") {
  var protocolPrefix =
  window.location.protocol === "https:" ? "wss:" : "ws:";
  var host = window.location.host; // Includes hostname and port

  return protocolPrefix + "//" + host + path;
}

function addUserMessage(message) {
  const userMsgDiv = document.createElement('div');
  userMsgDiv.className = 'chat right';
  userMsgDiv.innerHTML = message;
  chatContainer.appendChild(userMsgDiv);
}


function addLlmMessage(response, recommendations , web_links) {
  if (response){
      let append_child_flag = false;
      console.log({llmResponseDiv})
      // Create response div
      if (llmResponseDiv == null){
        llmResponseDiv = document.createElement('div');
        llmResponseDiv.className = 'chat left';
        append_child_flag = true
      }

      llmResponseDiv.innerHTML += response;

      if ( append_child_flag == true ){
        chatContainer.appendChild(llmResponseDiv);
      }
  
  }
  // Create recommendations div
  if (recommendations.length > 0 ){
    recommendations = recommendations.map((item)=>{ return `<li>${item}</li>` })
    const llmRecommendationsDiv = document.createElement('div');
    llmRecommendationsDiv.className = 'chat left';
    llmRecommendationsDiv.innerHTML = recommendations;
    chatContainer.appendChild(llmRecommendationsDiv);          

  }
  // create web links div
  if (web_links.length > 0){
    web_links = web_links.map((item)=>{ return `<li>${item}</li>` })
    const webLinksDiv = document.createElement('div');
    webLinksDiv.className = 'chat left';
    webLinksDiv.innerHTML = web_links;
    chatContainer.appendChild(webLinksDiv);  
  }

}


function sendMessage(){
  let user_msg = inputField.value;
  if(user_msg){
    let data_sent = JSON.stringify({ "user_msg" : user_msg , "action" :  false })
    chat_socket.send( data_sent )
    inputField.value = "";
    addUserMessage(user_msg);
  
  }
}


function sendStopMessage(){
  let data_sent = JSON.stringify({ "user_msg" : "" , "action" :  true })
  chat_socket.send( data_sent )
}



inputField.addEventListener('keydown', function(event) {
  if (event.key === 'Enter') {
    sendMessage();
  }
});



function main(user_id){
    const chat_websocketUrl = getWebSocketURL(`/invoke_llm/${user_id}`);
    console.log({ chat_websocketUrl });

    chat_socket = new WebSocket(chat_websocketUrl);
    chat_socket.onopen = async () => {
      console.log('Chat WebSocket connection opened');
    };

    chat_socket.onmessage = (event) => {
      let event_parsed = JSON.parse(event.data);
      console.log(`ChatSocket : Data-Rcvd : ${chat_socket} `);
      console.log( ">>>>" ,{event_parsed})
      if (event_parsed.clear){
        llmResponseDiv = null;
      }
      else{
        addLlmMessage( event_parsed.response , event_parsed.recommendations, event_parsed.web_links )
      }
    };

    chat_socket.onclose = () => {
      console.log('WebSocket connection closed');
    };


    // const websocketUrl = getWebSocketURL("/ws");
    // socket = new WebSocket(websocketUrl);
    // // Handle WebSocket events
    // socket.onopen = async () => {
    //   console.log('WebSocket connection opened');
    //   setTimeout(() => { }, 1000)
    //   await start(socket);
    // };

    // socket.onmessage = (event) => {
    //   let event_parsed = JSON.parse(event.data);
    //   console.log(`Data-Rcvd : ${socket}`);
    //   if (event_parsed.is_text == true){
    //     console.log("---> Text" , {event_parsed})
    //     let msg = event_parsed.msg
    //     if(event_parsed.is_transcription == true){ addUserMessage(msg) }
    //     else{ addLlmMessage(msg.response , msg.recommendations) }
    //   }
    //   else{
    //     console.log("---> Audio")
    //     let audio_data = event_parsed.audio;
    //     audioQueue.push(audio_data);
    //     playNextAudio();  
    //   }
    // };

    // socket.onclose = () => {
    //   console.log('WebSocket connection closed');
    // };

}


window.addEventListener("load", () => {
  // speech comminication
  const user_id = localStorage.getItem("user_id")
  if (!user_id) {
    const apiUrl = `${currentDomain}/user/id`;
    // Make a GET request to fetch user data
    fetch(apiUrl)
      .then(response => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.json();
      })
      .then(data => {
        // Handle the data received from the API
        let user_id = data.data.user_id;
        localStorage.setItem( "user_id" , user_id )
        main(user_id);
        // Further processing of the data
      })
      .catch(error => {
        console.error('There was a problem with the fetch operation:', error);
        // Handle errors appropriately
      });    

  }
  else{ main(user_id) }
});
