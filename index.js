const http = require("http");
const express = require("express");
const path = require("path");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});
const users = new Map();

// Socket.io
io.on("connection", (socket) => {
  console.log("New user connected");

  socket.on("username", (username) => {
    console.log("Username received:", username);
    users.set(username, socket.id);
    console.log("Users:", users);
    //socket.emit("username-received", username);
  });

  socket.on("user-message", (message) => {
    io.emit("message", message);
  });

  socket.on("submitDeviceNames", (data) => {
    console.log(
      "User " + data.userId + " submitted device names:",
      data.deviceNames
    );
    const username = data.userId;
    const deviceNames = data.deviceNames;
    const socketId = users.get(username);

    if (socketId) {
      io.to(socketId).emit("deviceNamesUpdated", deviceNames);
      console.log(`Device names sent to ${username}`);
    } else {
      console.log(`User ${username} not found`);
    }
  });

  // Clean up when user disconnects
  socket.on("disconnect", () => {
    console.log("User disconnected");
    // Find the user in the map and remove
    for (const [key, value] of users.entries()) {
      if (value === socket.id) {
        console.log(`Removing user ${key}`);
        users.delete(key);
        break; // Stop searching after finding and removing the user
      }
    }
  });
});

// Serve static files
app.use(express.static(path.resolve(__dirname, "./public")));

// Serve main page
app.get("/", (req, res) => {
  res.sendFile(path.resolve(__dirname, "./public/index.html"));
});

const PORT = process.env.PORT || 9000;
server.listen(PORT, () => console.log(`Server started at PORT:${PORT}`));
