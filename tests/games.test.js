const request = require("supertest");
const express = require("express");
const db = require("../db");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const gamesRoutes = require("../routes/game"); 

const SALT_ROUNDS = 1;

let app;
let testUser;
let testToken;
let testGame;

async function resetDatabase() {
    // Turn off foreign key checks temporarily
    await db.query(`TRUNCATE TABLE rsvps, games, users RESTART IDENTITY CASCADE`);
  }
  

beforeAll(async () => {
  app = express();
  app.use(express.json());
  app.use("/games", gamesRoutes);
  await resetDatabase();

  // Create a test user
  const passwordHash = await bcrypt.hash("password123", SALT_ROUNDS);

  const userResult = await db.query(`
    INSERT INTO users (username, email, password_hash)
    VALUES ('gameuser', 'gameuser@example.com', $1)
    RETURNING id, username, email
  `, [passwordHash]);

  testUser = userResult.rows[0];

  testToken = jwt.sign({ 
    userId: testUser.id,
    isAdmin: false
  }, process.env.JWT_SECRET || "testsecret");

  // Create a test game directly in DB
  const gameResult = await db.query(`
    INSERT INTO games (title, datetime, location, skill_level, created_by, latitude, longitude)
    VALUES ('Test Game', NOW(), 'Test Location', 'Beginner', $1, 0, 0)
    RETURNING *
  `, [testUser.id]);

  testGame = gameResult.rows[0];
});

afterAll(async () => {
  await db.query("DELETE FROM rsvps");
  await db.query("DELETE FROM games");
  await db.query("DELETE FROM users");
  await db.end();
});

describe("Games Routes", () => {

  test("GET /games - list all games", async () => {
    const res = await request(app)
      .get("/games");

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body[0]).toHaveProperty("title", testGame.title);
  });

  test("GET /games/:id - get a specific game", async () => {
    const res = await request(app)
      .get(`/games/${testGame.id}`);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("title", testGame.title);
    expect(res.body).toHaveProperty("location", testGame.location);
  });

  test("POST /games - create a new game", async () => {
    const res = await request(app)
      .post("/games")
      .set("Authorization", `Bearer ${testToken}`)
      .send({
        title: "New Game",
        datetime: new Date().toISOString(),
        location: "New York",
        skill_level: "Intermediate"
      });

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty("title", "New Game");
    expect(res.body).toHaveProperty("location", "New York");
  });

});

