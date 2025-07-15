const { io } = require("socket.io-client");

// 🔑 1. Paste your JWT token here (from /api/auth/login)
const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MiwidXNlcm5hbWUiOiJyYW1pbSIsImlhdCI6MTc1MTc5NDcwOSwiZXhwIjoxNzUxODgxMTA5fQ.KcYd11IZ_8DVm2NHf8-UQzZad3ZeuFy7pkLhGHVvhtA";

// 2. Set your current username and the recipient username
const myUsername = "ramim";
const friendUsername = "hamim";

// 3. Connect with JWT token (auth param)
const socket = io("http://localhost:5000", {
  auth: { token }
});

socket.on("connect", () => {
  console.log("Connected! My socket ID:", socket.id);

  // (Optional) Join your own room (not needed if backend already does this)
  socket.emit("join", myUsername);

  // Send a message to friend
  setTimeout(() => {
    socket.emit("send_message", {
      recipient: friendUsername,
      content: "Hello from ramim (JWT Socket.IO test)!"
    });
    console.log(`Sent message to ${friendUsername}`);
  }, 1000);
});

socket.on("receive_message", (msg) => {
  console.log("Received real-time message:", msg);
});

socket.on("connect_error", (err) => {
  console.error("Connection/auth error:", err.message);
});

socket.on("disconnect", () => {
  console.log("Disconnected from server.");
});
