const localVideo = document.getElementById("localVideo")
const remoteVideo = document.getElementById("remoteVideo")
const startCall = document.getElementById("startCall")
const endCall = document.getElementById("endCall")

let localStream
let remoteStream
let peerConnection

const socket = io()

const servers = {
  iceServers: [
    {
      urls: "stun:stun.l.google.com:19302",
    },
  ],
}

const init = async () => {
  localStream = await navigator.mediaDevices.getUserMedia({
    video: true,
    audio: true,
  })
  localVideo.srcObject = localStream

  socket.on("offer", async (offer) => {
    if (!peerConnection) createPeerConnection()

    await peerConnection.setRemoteDescription(new RTCSessionDescription(offer))
    const answer = await peerConnection.createAnswer()
    await peerConnection.setLocalDescription(answer)
    socket.emit("answer", answer)
  })

  socket.on("answer", async (answer) => {
    await peerConnection.setRemoteDescription(new RTCSessionDescription(answer))
  })

  socket.on("candidate", (candidate) => {
    const iceCandidate = new RTCIceCandidate(candidate)
    peerConnection.addIceCandidate(iceCandidate)
  })
}

const createPeerConnection = () => {
  peerConnection = new RTCPeerConnection(servers)
  peerConnection.onicecandidate = (event) => {
    if (event.candidate) {
      socket.emit("candidate", event.candidate)
    }
  }

  peerConnection.ontrack = (event) => {
    remoteStream = event.streams[0]
    remoteVideo.srcObject = remoteStream
  }

  localStream.getTracks().forEach((track) => {
    peerConnection.addTrack(track, localStream)
  })
}

startCall.addEventListener("click", async () => {
  if (!peerConnection) createPeerConnection()

  const offer = await peerConnection.createOffer()
  await peerConnection.setLocalDescription(offer)
  socket.emit("offer", offer)
})

endCall.addEventListener("click", () => {
  peerConnection.close()
  peerConnection = null
})

init()
