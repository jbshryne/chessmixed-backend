const express = require("express");
const app = express();
const server = require("http").createServer(app);
const { Server } = require("socket.io");

const morgan = require("morgan");
const cors = require("cors");
const session = require("express-session");
require("dotenv").config();

const io = new Server(server, {
  cors: {
    origin: "*",
  },
});
// const socketIo = require("socket.io");
// const io = socketIo(server, );

const userRoutes = require("./controllers/userController");
const gameRoutes = require("./controllers/gameController");

app.use(cors());
app.use(express.json());
app.use(morgan("dev"));
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use(
  session({
    secret: process.env.SECRET,
    cookie: { maxAge: 365 * 24 * 60 * 60 * 1000 },
  })
);

app.use(userRoutes);
app.use("/games", gameRoutes);

app.get("/", (req, res) => {
  res.send("Hello World!");
});

let loggedInUsers = [];

io.on("connection", (socket) => {
  // console.log(socket.id);

  socket.on("login", (currentUser) => {
    console.log("user who's joining:", currentUser.displayName);
    loggedInUsers.push({ ...currentUser, socketId: socket.id });
    console.log("loggedInUsers:", loggedInUsers.length);
    socket.emit(
      "userLoggedIn",
      { ...currentUser, socketId: socket.id },
      loggedInUsers
    );
  });

  // socket.on("leaveLobby", (currentUser) => {
  //   console.log("user who's leaving:", currentUser.displayName);
  //   socket.leave("lobby");
  //   socket
  //     .to("lobby")
  //     .emit("userLeft", { ...currentUser, socketId: socket.id });
  // });

  socket.on("joinRoom", (roomName) => {
    console.log("roomName:", roomName);
    socket.join(roomName);
  });

  socket.on("sendMessage", ({ message, room }) => {
    console.log(message);
    const messageWithRoom = `[ROOM ${room}] ${message}`;
    socket.to(room).emit("getMessage", messageWithRoom);
  });

  socket.on("sendNewMove", (move) => {
    console.log("move:", move);
    socket.broadcast.emit("getNewMove", move);
  });

  socket.on("disconnecting", () => {
    console.log("user disconnecting:", socket.id);
    // const rooms = socket.rooms;
    // console.log("rooms:", socket.rooms);
    // rooms.forEach((room) => {
    loggedInUsers = loggedInUsers.filter((user) => user.socketId !== socket.id);
    socket.emit("userDisconnected", loggedInUsers);
    // });
  });

  // socket.on("disconnect", () => {
  //   console.log("user disconnected:");
  // });
});

const PORT = process.env.PORT || 3200;

server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
