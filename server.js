// server.js
require("dotenv").config();
const express = require("express");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3001;

// routes
const gameRoutes = require("./routes/game");
const userRoutes = require("./routes/uesrs");
const authRoutes = require("./routes/auth");
const adminRoutes = require("./routes/admin");


// Middleware
app.use(cors());
app.use(express.json());

app.use("/games", gameRoutes);
app.use("/users", userRoutes);
app.use("/auth", authRoutes);
app.use("/admin", adminRoutes);


// Test route
app.get("/", (req, res) => {
  res.send("Pickup Soccer Game API is running! ⚽");
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
