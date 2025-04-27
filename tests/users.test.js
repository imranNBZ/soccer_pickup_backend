const request = require("supertest");
const express = require("express");
const db = require("../db");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

const SALT_ROUNDS = 1;

let app;
let testUser;
let testToken;

beforeAll(async () => {
  // Create a fresh express app
  app = express();
  app.use(express.json());

  // Route you want to test
  app.get("/users/:id", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const token = authHeader.split(" ")[1];
      const payload = jwt.verify(token, process.env.JWT_SECRET || "testsecret");

      const userResult = await db.query(
        `SELECT id, username, email FROM users WHERE id = $1`,
        [req.params.id]
      );
      const user = userResult.rows[0];

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      return res.json(user);
    } catch (err) {
      console.error(err);
      return res.status(401).json({ error: "Unauthorized" });
    }
  });

  // Insert a test user into DB
  const passwordHash = await bcrypt.hash("password123", SALT_ROUNDS);

  const result = await db.query(`
    INSERT INTO users (username, email, password_hash)
    VALUES ('testuser', 'testuser@example.com', $1)
    RETURNING id, username, email
  `, [passwordHash]);

  testUser = result.rows[0];

  // Create a JWT token for testUser
  testToken = jwt.sign({ id: testUser.id }, process.env.JWT_SECRET || "testsecret");
});

afterAll(async () => {
  // Clean up database
  await db.query("DELETE FROM users WHERE username = 'testuser'");
  await db.end();
});

describe("User Routes", () => {

  test("GET /users/:id - success", async () => {
    const res = await request(app)
      .get(`/users/${testUser.id}`)
      .set("Authorization", `Bearer ${testToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual(expect.objectContaining({
      username: testUser.username,
      email: testUser.email
    }));
  });

  test("GET /users/:id - unauthorized without token", async () => {
    const res = await request(app)
      .get(`/users/${testUser.id}`);

    expect(res.statusCode).toBe(401);
    expect(res.body).toEqual(expect.objectContaining({
      error: expect.any(String)
    }));
  });

  test("GET /users/:id - 404 for wrong user", async () => {
    const res = await request(app)
      .get(`/users/9999999`) // non-existing user
      .set("Authorization", `Bearer ${testToken}`);

    expect(res.statusCode).toBe(404);
    expect(res.body).toEqual(expect.objectContaining({
      error: expect.any(String)
    }));
  });

});
