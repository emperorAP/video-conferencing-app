const express = require("express")
const http = require("http")
const socketIo = require("socket.io")
const path = require("path")

const app = express()
const server = http.createServer(app)
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
})

app.use(express.static(path.join(__dirname, "public")))

io.on("connection", (socket) => {
  console.log("a user connected")

  socket.on("disconnect", () => {
    console.log("user disconnected")
  })

  socket.on("offer", (offer) => {
    console.log("offer received:", offer)
    socket.broadcast.emit("offer", offer)
  })

  socket.on("answer", (answer) => {
    console.log("answer received:", answer)
    socket.broadcast.emit("answer", answer)
  })

  socket.on("candidate", (candidate) => {
    console.log("candidate received:", candidate)
    socket.broadcast.emit("candidate", candidate)
  })
})

const PORT = process.env.PORT || 3000
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`)
})
