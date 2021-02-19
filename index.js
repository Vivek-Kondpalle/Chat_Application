const express = require("express");
const socketio = require("socket.io");
const http = require("http");

const PORT = 5000;

const router = require("./router");
const { addUser, removeUser, getUser, getUsersInRoom } = require("./users");

const app = express();
const server = http.createServer(app);
const io = socketio(server);

io.on("connection", (socket) => {
  console.log("We have a new connection");

  socket.on("join", ({ name, room }, callback) => {
    const { error, user } = addUser({ id: socket.id, name, room });
    if (error) return callback(error);

    /* addUser is either going to return an object with key 'error' or return an object with name and room */

    socket.emit("message", {
      user: "admin",
      text: `${user.name},welcome to room ${user.room}`,
    });
    socket.broadcast
      .to(user.room)
      .emit("message", { user: "admin", text: `${user.name} has joined!` });
    /* socket.emit is sending a custom event named 'message' and payload. this will be shown only to the user
    who has joined the room.
    socket.broadcast.to().emit will broadcast the message to everyone in the room except the sender */

    socket.join(user.room); //name of room we want to join

    io.to(user.room).emit("roomData", {
      room: user.room,
      users: getUsersInRoom(user.room),
    });

    callback(); // if no error callback will not pass any arguments.
  });
  /* socket.on allows a callback inside the callback. it can be used for error handling. socket.emit
  takes a 3rd parameter as a function. whatever is passed in callback here is used on client side 
  in socket.emit*/

  socket.on("sendMessage", (message, callback) => {
    const user = getUser(socket.id);

    //console.log(socket.id);
    io.to(user.room).emit("message", { user: user.name, text: message });
    io.to(user.room).emit("roomData", {
      room: user.room,
      users: getUsersInRoom(user.room),
    });

    callback();
  });

  socket.on("disconnect", () => {
    // console.log("User disconnected");

    const user = removeUser(socket.id);
    if (user) {
      io.to(user.room).emit("message", {
        user: "admin",
        text: `${user.name} has left`,
      });

      io.to(user.room).emit("roomData", {
        room: user.room,
        users: getUsersInRoom(user.room),
      });
    }
  });
});

app.use(router);

server.listen(PORT, () => {
  console.log(`Server started at port ${PORT}`);
});
