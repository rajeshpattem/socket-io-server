const https = require("https");
const express = require("express");
const path = require("path");
const fs = require("fs");
const { Server } = require("socket.io");

const app = express();

options = {
  key: fs.readFileSync("key.pem"),
  cert: fs.readFileSync("cert.pem"),
};

const server = https.createServer(app, options);
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
  });

  socket.on("user-message", (message) => {
    io.emit("message", message);
  });

  socket.on("submitDeviceNames", (data) => {
    const { userId, deviceNames } = data;
    console.log("Users Map ", users);
    console.log(`User ${userId} submitted device names:`, deviceNames);

    const socketId = users.get(userId);

    if (socketId) {
      io.to(socketId).emit("deviceNamesUpdated", deviceNames);
      console.log(`Device names sent to ${userId}`);
    } else {
      console.log(`User ${userId} not found in map`);
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
