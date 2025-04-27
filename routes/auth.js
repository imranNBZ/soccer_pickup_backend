const express = require("express");
const router = express.Router();
const db = require("../db");

const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

// POST /auth/login
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  
  

  try {
    const result = await db.query("SELECT * FROM users WHERE email = $1", [email,]);
    const user = result.rows[0];
    if (!user) return res.status(401).json({error: "Invalid email or password" });

    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) return res.status(401).json({ error: "Invalid email or password" });

    if (user.is_blocked) {
      return res.status(403).json({ error: "User account is blocked" });
    }

    
    
    
    const token = jwt.sign(
      { userId: user.id, isAdmin: user.is_admin },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.json({
       token,
          user:
             {id: user.id,
               username: user.username,
                email:user.email,
              isAdmin: user.is_admin
              } });
  } catch (err) {
    res.status(500).json({ error: "Login failed" });
  }
});

module.exports = router;
