const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const db = require("../db");

let testUser;
let testToken;

beforeAll(async () => {
  // ✅ Delete old test user if already exists
  await db.query(`DELETE FROM users WHERE username = 'testuser'`);

  const hashedPassword = await bcrypt.hash("testpassword", 1);

  const userResult = await db.query(
    `INSERT INTO users (username, email, password_hash)
     VALUES ('testuser', 'testuser@example.com', $1)
     RETURNING id, username, email`,
    [hashedPassword]
  );

  testUser = userResult.rows[0];

  testToken = jwt.sign({ userId: testUser.id }, process.env.JWT_SECRET || "test-secret");
});

module.exports = {
  testUser,
  testToken
};
