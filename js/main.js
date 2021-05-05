'use strict';

const mediaStreamConstraints = {
    'video': true,
    'audio': false
};

const configuration = {
    "iceServers": [
        { 
            "url": "stun:stun.zifori.me" },
        {
            "url": "turn:turn.zifori.me",
            username: "turn",
            credential: "turnpw",
        }
    ]
}

var isStarted = false

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

    socket.onmessage = onSocketMessage
}

function onSocketMessage(event) {
    const msg = JSON.parse(event.data)

    switch(msg.type) {
        case "created":
            console.log("server created")
        break;
        case "join" :
            console.log('Another peer a requst to join room ' + msg.room);

            maybeStart()
            isChannelReady = true;
        break;
        case "got user media" :
            console.log("joined : " + msg.room)
            
            isChannelReady = true
        break;
        case "candidate":
            if (isStarted && isChannelReady) {
                console.log('candidate received')
                // ice candidate received
                let candidate = new RTCIceCandidate({
                    sdpMLineIndex: message.label,
                    candidate: message.candidate
                });
                pc.addIceCandidate(candidate)
            }
        break;
    }
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

function maybeStart() {
    if(!isStarted && typeof localStream !== 'undefined' && isChannelReady) {
        createPeerConnection()
        pc.addStream(localStream)
        isStarted = true
    }
}

function handleLocalMediaStreamError(error) {
    trace(`navigator.getUserMedia error: ${error.toString()}.`);
}

function createPeerConnection() {
    try {
        pc = new RTCPeerConnection(null);
        pc.onicecandidate = handleIceCandidate
        // pc.onaddstream = handleRemoteStreamAdded //onRemoteStream Added
        // pc.onremovestream = handleRemoteStreamRemoved //onRemoteStream removed
    } catch(e) {
        console.log('Failed to create PeerConnection : ' + e.message)
        console.log('Can\'t create RTCPeerConnection object')
        return;
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

window.onbeforeunload = function() {
    sendMessage('bye');
  };

init()