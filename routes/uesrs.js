const express = require("express");
const router = express.Router();
const db = require("../db");
const authenticateToken = require("../middlware/auth");

const bcrypt = require("bcrypt");
const SALT_ROUNDS = 10;

// ✅ GET /users - list all users
router.get("/", async (req, res) => {
  try {
    const result = await db.query(
      "SELECT id, username, email, bio, location, profile_pic FROM users ORDER BY id"
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Fetch users error:", err);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

// ✅ GET /users/:id - user profile (include profile_pic!)
router.get("/:id", async (req, res) => {
  try {
    const result = await db.query(
      "SELECT id, username, email, bio, location, profile_pic FROM users WHERE id = $1",
      [req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: "User not found" });
    res.json(result.rows[0]);
  } catch (err) {
    console.error("Fetch user error:", err);
    res.status(500).json({ error: "Failed to fetch user" });
  }
});

// ✅ POST /users - register new user
router.post("/", async (req, res) => {
  const { username, email, password, bio, location, profile_pic } = req.body;
  try {
    const password_hash = await bcrypt.hash(password, SALT_ROUNDS);
    const result = await db.query(
      `INSERT INTO users (username, email, password_hash, bio, location, profile_pic)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, username, email, profile_pic`,
      [username, email, password_hash, bio, location, profile_pic]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ error: "Failed to register user" });
  }
});


 // ✅ GET /users/:id/rsvps - list games the user has RSVP'd to
router.get("/:id/rsvps", authenticateToken, async (req, res) => {
  const userId = parseInt(req.params.id);

  if (userId !== req.user.userId) {
    return res.status(403).json({ error: "Unauthorized" });
  }

  try {
    const result = await db.query(`
      SELECT games.*
      FROM rsvps
      JOIN games ON rsvps.game_id = games.id
      WHERE rsvps.user_id = $1
      ORDER BY games.datetime ASC
    `, [userId]);

    res.json(result.rows);
  } catch (err) {
    console.error("Fetch RSVPs error:", err);
    res.status(500).json({ error: "Failed to fetch RSVP games" });
  }
});

// PUT /users/:id - update profile
router.put("/:id", authenticateToken, async (req, res) => {
  const userId = parseInt(req.params.id);
  if (userId !== req.user.userId) return res.status(403).json({ error: "Unauthorized" });

  const { username, bio, password, profile_pic } = req.body;

  try {
    let updates = [];
    let values = [];
    let idx = 1;

    if (username) {
      updates.push(`username = $${idx++}`);
      values.push(username);
    }

    if (bio) {
      updates.push(`bio = $${idx++}`);
      values.push(bio);
    }

    if (password) {
      const hashed = await bcrypt.hash(password, 10);
      updates.push(`password_hash = $${idx++}`);
      values.push(hashed);
    }

    if (profile_pic) {
      updates.push(`profile_pic = $${idx++}`);
      values.push(profile_pic);
    }
    

    if (updates.length === 0) return res.status(400).json({ error: "Nothing to update" });

    values.push(userId);

    const query = `UPDATE users SET ${updates.join(", ")} WHERE id = $${idx} RETURNING id, username, bio, profile_pic`;
    const result = await db.query(query, values);

    res.json({ message: "Profile updated", user: result.rows[0] });
  } catch (err) {
    console.error("Update error:", err);
    res.status(500).json({ error: "Update failed" });
  }
});


// PATCH /users/:id/profile-pic - update only profile picture
router.patch("/:id/profile-pic", authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { profile_pic } = req.body;

  if (parseInt(id) !== req.user.userId) {
    return res.status(403).json({ error: "Unauthorized" });
  }

  try {
    const result = await db.query(
      "UPDATE users SET profile_pic = $1 WHERE id = $2 RETURNING id, profile_pic",
      [profile_pic, id]
    );
    res.json({ message: "Profile picture updated", user: result.rows[0] });
  } catch (err) {
    console.error("Update profile_pic error:", err);
    res.status(500).json({ error: "Failed to update profile picture" });
  }
});



module.exports = router;
