const socket = io()

// Access the local video element
const localVideo = document.getElementById("localVideo")
const remoteVideo = document.getElementById("remoteVideo")

// Variables to hold local stream and peer connection
let localStream
let peerConnection

// Define configuration for the peer connection
const peerConnectionConfig = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
}

// Function to start the video call
document.getElementById("startCall").addEventListener("click", async () => {
  try {
    // Access local media
    localStream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    })
    localVideo.srcObject = localStream

    // Create a new peer connection
    peerConnection = new RTCPeerConnection(peerConnectionConfig)

    // Add local stream tracks to the peer connection
    localStream
      .getTracks()
      .forEach((track) => peerConnection.addTrack(track, localStream))

    // When remote stream is added, set it to the remote video element
    peerConnection.ontrack = (event) => {
      remoteVideo.srcObject = event.streams[0]
    }

    // Handle ICE candidates
    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit("iceCandidate", event.candidate)
      }
    }

    // Create an offer and set it as the local description
    const offer = await peerConnection.createOffer()
    await peerConnection.setLocalDescription(offer)

    // Send the offer to the remote peer
    socket.emit("offer", offer)
  } catch (error) {
    console.error("Error starting call:", error)
  }
})

// Function to end the video call
document.getElementById("endCall").addEventListener("click", () => {
  if (peerConnection) {
    peerConnection.close()
    peerConnection = null
  }

  if (localStream) {
    localStream.getTracks().forEach((track) => track.stop())
    localVideo.srcObject = null
  }

  remoteVideo.srcObject = null

  // Notify the server that the call has ended
  socket.emit("endCall")
})

// Handle incoming offer
socket.on("offer", async (offer) => {
  if (!peerConnection) {
    peerConnection = new RTCPeerConnection(peerConnectionConfig)

    peerConnection.ontrack = (event) => {
      remoteVideo.srcObject = event.streams[0]
    }

    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit("iceCandidate", event.candidate)
      }
    }
  }

  await peerConnection.setRemoteDescription(new RTCSessionDescription(offer))
  const answer = await peerConnection.createAnswer()
  await peerConnection.setLocalDescription(answer)
  socket.emit("answer", answer)
})

// Handle incoming answer
socket.on("answer", (answer) => {
  peerConnection.setRemoteDescription(new RTCSessionDescription(answer))
})

// Handle incoming ICE candidates
socket.on("iceCandidate", (candidate) => {
  peerConnection.addIceCandidate(new RTCIceCandidate(candidate))
})

// Handle call end notification
socket.on("endCall", () => {
  if (peerConnection) {
    peerConnection.close()
    peerConnection = null
  }

  if (localStream) {
    localStream.getTracks().forEach((track) => track.stop())
    localVideo.srcObject = null
  }

  remoteVideo.srcObject = null
})
