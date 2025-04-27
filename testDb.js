// db.js
const { Client } = require("pg");
require("dotenv").config();

// Choose DB based on environment
const db = new Client({
  connectionString: process.env.DATABASE_URL || "postgresql:///pickup_soccer",
});

db.connect();

module.exports = db;
