const request = require("supertest");
const express = require("express");
const db = require("../db");
const authRoutes = require("../routes/auth"); // adjust path if needed
const bcrypt = require("bcrypt");

const SALT_ROUNDS = 1;

let app;
let testUser;

beforeAll(async () => {
  app = express();
  app.use(express.json());
  app.use("/auth", authRoutes);

  // Insert a test user
  const passwordHash = await bcrypt.hash("password123", SALT_ROUNDS);

  const result = await db.query(`
    INSERT INTO users (username, email, password_hash, is_admin)
    VALUES ('authuser', 'authuser@example.com', $1, false)
    RETURNING id, username, email, is_admin
  `, [passwordHash]);

  testUser = result.rows[0];
});

afterAll(async () => {
  await db.query("DELETE FROM users");
  await db.end();
});

describe("Auth Routes", () => {

  test("POST /auth/login - successful login", async () => {
    const res = await request(app)
      .post("/auth/login")
      .send({ email: testUser.email, password: "password123" });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("token");
    expect(res.body.user).toEqual(expect.objectContaining({
      id: testUser.id,
      username: testUser.username,
      email: testUser.email,
      isAdmin: false
    }));
  });

  test("POST /auth/login - invalid password", async () => {
    const res = await request(app)
      .post("/auth/login")
      .send({ email: testUser.email, password: "wrongpassword" });

    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty("error", "Invalid email or password");
  });

  test("POST /auth/login - invalid email", async () => {
    const res = await request(app)
      .post("/auth/login")
      .send({ email: "wrongemail@example.com", password: "password123" });

    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty("error", "Invalid email or password");
  });

});

