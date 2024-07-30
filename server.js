const express = require("express")
const http = require("http")
const socketIo = require("socket.io")
const path = require("path")

const app = express()
const server = http.createServer(app)
const io = socketIo(server)

// Serve static files from the "public" directory
app.use(express.static(path.join(__dirname, "public")))

// Handle incoming WebSocket connections
io.on("connection", (socket) => {
  console.log("New connection:", socket.id)

  // Handle 'offer' event from client
  socket.on("offer", (offer) => {
    socket.broadcast.emit("offer", offer)
  })

  // Handle 'answer' event from client
  socket.on("answer", (answer) => {
    socket.broadcast.emit("answer", answer)
  })

  // Handle 'iceCandidate' event from client
  socket.on("iceCandidate", (candidate) => {
    socket.broadcast.emit("iceCandidate", candidate)
  })

  // Handle 'endCall' event from client
  socket.on("endCall", () => {
    socket.broadcast.emit("endCall")
  })

  // Handle disconnection
  socket.on("disconnect", () => {
    console.log("Disconnected:", socket.id)
  })
})

// Start the server
const PORT = process.env.PORT || 3000
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`)
})
