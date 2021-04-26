'use strict';

const mediaStreamConstraints = {
    'video': true,
    'audio': false
};

let localVideo = document.querySelector('video#localVideo')
let remoteVideo = document.querySelector('video#remoteVideo')

let findBtn = document.getElementById('find')
let channelTxt = document.getElementById('channel')
let pc;

let localStream;
let remoteStream;
let localPeerConnection;

function init() {
    navigator.mediaDevices.getUserMedia(mediaStreamConstraints)
    .then(getLocalMediaStream).catch(handleLocalMediaStreamError);
}

findBtn.addEventListener('click', findButtonClicked)

///////////////////////////////////////////////

const userId = createRandomName();
let channel;
let socket;

function findButtonClicked() {
    channel = channelTxt.value;
    connecToSocket(channel)
}

function createRandomName() {
   let res = '';
   for(let i = 0; i < 8; i++){
      const random = Math.floor(Math.random() * 27);
      res += String.fromCharCode(97 + random);
   };
   return res;
}

function connecToSocket(channel) {
    findBtn.disabled = true;

    const url = "ws://www.zifori.me:7080/signaling/".concat(channel).concat('/').concat(userId)
    socket = new WebSocket(url);



}





///////////////////////////////////////////////


function sendMessage(message) {
    console.log('Client sending message: ', message);
    socket.emit('message', message);
}

///////////////////////////////////////////////
  

function getLocalMediaStream(mediaStream) {
    localVideo.srcObject = mediaStream;
    localStream = mediaStream;
    trace("Received local stream.")
}

function handleLocalMediaStreamError(error) {
    trace(`navigator.getUserMedia error: ${error.toString()}.`);
}

function createPeerConnection() {
    try {
        pc = new RTCPeerConnection(null);
        pc.onicecandidate = handleIceCandidate
    } catch {

    }
}

function handleIceCandidate(event) {
    console.log('icecandidate event: ', event);
    if (event.candidate) {
        sendMessage({
            type: 'candidate',
            label: event.candidate.sdpMLineIndex,
            id: event.candidate.sdpMid,
            candidate: event.candidate.candidate
        });
    } else {
        console.log('End of candidate')
    }
}

function trace(text) {
    text = text.trim();
    const now = (window.performance.now() / 1000).toFixed(3);
  
    console.log(now, text);
}

init()