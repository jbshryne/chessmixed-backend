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

io.on("connection", (socket) => {
  console.log(socket.id);

  socket.on("sendMessage", (message) => {
    console.log(message);
    socket.broadcast.emit("getMessage", message);
  });

  socket.on("disconnect", () => {
    console.log("user disconnected");
  });
});

const PORT = process.env.PORT || 3200;

server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
