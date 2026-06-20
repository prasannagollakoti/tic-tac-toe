const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");

const app = express();
app.use(cors());

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
  },
});

// Store room information
const rooms = {};

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("join_room", ({ room, name }) => {

    if (!rooms[room]) {
      rooms[room] = {
        players: [],
      };
    }

    if (rooms[room].players.length >= 2) {
      socket.emit("room_full");
      return;
    }

    socket.join(room);

    const player = rooms[room].players.length === 0 ? "X" : "O";

    rooms[room].players.push({
      id: socket.id,
      name,
      symbol: player,
    });

    socket.emit("player_assignment", player);

    io.to(room).emit("players_count", rooms[room].players.length);

    // Send players information to both clients
    io.to(room).emit("players_info", {
      xName:
        rooms[room].players.find((p) => p.symbol === "X")?.name || "",
      oName:
        rooms[room].players.find((p) => p.symbol === "O")?.name || "",
    });

    console.log(`${name} joined room ${room} as ${player}`);
  });

  socket.on("send_move", (data) => {
    socket.to(data.room).emit("receive_move", data);
  });

  socket.on("restart_game", (room) => {
    io.to(room).emit("restart_board");
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);

    for (const room in rooms) {
      rooms[room].players = rooms[room].players.filter(
        (p) => p.id !== socket.id
      );

      io.to(room).emit("players_count", rooms[room].players.length);

      io.to(room).emit("players_info", {
        xName:
          rooms[room].players.find((p) => p.symbol === "X")?.name || "",
        oName:
          rooms[room].players.find((p) => p.symbol === "O")?.name || "",
      });

      if (rooms[room].players.length === 0) {
        delete rooms[room];
      }
    }
  });
});

server.listen(5000, () => {
  console.log("Server running on port 5000");
});