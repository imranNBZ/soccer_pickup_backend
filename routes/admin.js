const express = require("express");
const router = express.Router();
const db = require("./db");
const authenticateToken = require("./middlware/auth");
const requireAdmin = require("./middlware/requireAdmin");

// 🔐 Get list of all users
router.get("/users", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const result = await db.query(
      "SELECT id, username, email, is_admin, is_blocked FROM users ORDER BY id"
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Admin fetch error:", err);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

// 🚫 Block a user
router.post("/users/:id/block", authenticateToken, requireAdmin, async (req, res) => {
  const userId = parseInt(req.params.id);

  try {
    await db.query("UPDATE users SET is_blocked = TRUE WHERE id = $1", [userId]);
    res.json({ message: "User blocked successfully" });
  } catch (err) {
    console.error("Admin block error:", err);
    res.status(500).json({ error: "Failed to block user" });
  }
});

// 🔓 Unblock a user
router.post("/users/:id/unblock", authenticateToken, requireAdmin, async (req, res) => {
    const userId = parseInt(req.params.id);
  
    try {
      const result = await db.query(
        "UPDATE users SET is_blocked = FALSE WHERE id = $1 RETURNING id, username, is_blocked",
        [userId]
      );
  
      if (result.rows.length === 0) {
        return res.status(404).json({ error: "User not found" });
      }
  
      res.json({ message: "User unblocked", user: result.rows[0] });
    } catch (err) {
      console.error("Unblock user error:", err);
      res.status(500).json({ error: "Failed to unblock user" });
    }
  });
  



module.exports = router;
