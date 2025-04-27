const express = require("express");
const router = express.Router();
const db = require("../db");
const authenticateToken = require("./middlware/auth");
const axios = require("axios");

// GET /games - list all games
router.get("/", async (req, res) => {
  try {
    const result = await db.query(
      "SELECT games.*, users.username FROM games JOIN users ON games.created_by = users.id ORDER BY datetime"
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch games" });
  }
});

// GET /games/:id - game details
router.get("/:id", async (req, res) => {
  try {
    const result = await db.query(
      "SELECT games.*, users.username FROM games JOIN users ON games.created_by = users.id WHERE games.id = $1",
      [req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: "Game not found" });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch game details" });
  }
});

// POST /games - create new game
router.post("/", authenticateToken, async (req, res) => {
  const { title, datetime, location, skill_level } = req.body;
  const created_by = req.user.userId; // from token
  try {
     // Call Mapbox Geocoding API
     const mapboxToken = process.env.MAPBOX_API_KEY;
     const geoRes = await axios.get("https://api.mapbox.com/geocoding/v5/mapbox.places/" +
       encodeURIComponent(location) +
       `.json?access_token=${mapboxToken}`);
 
     const coords = geoRes.data.features[0]?.center || [0, 0]; // [lng, lat]
     const longitude = coords[0];
     const latitude = coords[1];


    const result = await db.query(
      `INSERT INTO games (title, datetime, location, skill_level, created_by, latitude, longitude)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [title, datetime, location, skill_level, created_by, latitude, longitude]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Create game error:", err);
    res.status(500).json({ error: "Failed to create game" });
  }
});

// put  /games/:id - update a game
router.put("/:id", authenticateToken, async (req, res) => {
  const gameId = parseInt(req.params.id);
  const userId = req.user.userId;
  const { title, datetime, location, skill_level } = req.body;

  try {
    const gameRes = await db.query("SELECT * FROM games WHERE id = $1", [gameId]);
    const game = gameRes.rows[0];

    if (!game) return res.status(404).json({ error: "Game not found" });

    if (game.created_by !== userId && !req.user.isAdmin) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    const result = await db.query(
      `UPDATE games
       SET title = $1, datetime = $2, location = $3, skill_level = $4
       WHERE id = $5
       RETURNING *`,
      [title, datetime, location, skill_level, gameId]
    );

    res.json({ message: "Game updated", game: result.rows[0] });
  } catch (err) {
    console.error("Update error:", err);
    res.status(500).json({ error: "Failed to update game" });
  }
});


// delete /game/:id - delete a game
router.delete("/:id", authenticateToken, async (req, res) => {
  const gameId = parseInt(req.params.id);
  const userId = req.user.userId;

  try {
    const gameRes = await db.query("SELECT * FROM games WHERE id = $1", [gameId]);
    const game = gameRes.rows[0];

    if (!game) return res.status(404).json({ error: "Game not found" });

    // Allow only creator or admin to delete
    if (game.created_by !== userId && !req.user.isAdmin) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    await db.query("DELETE FROM games WHERE id = $1", [gameId]);
    res.json({ message: "Game deleted" });
  } catch (err) {
    console.error("Delete error:", err);
    res.status(500).json({ error: "Failed to delete game" });
  }
});


// POST /games/:id/rsvp - join a game
router.post("/:id/rsvp", authenticateToken, async (req, res) => {
  const gameId = req.params.id;
  const userId = req.user.userId;

  try {
    const result = await db.query(
      `INSERT INTO rsvps (user_id, game_id)
       VALUES ($1, $2)
       ON CONFLICT (user_id, game_id) DO NOTHING
       RETURNING *`,
      [userId, gameId]
    );

    console.log("RSVP insert result:", result.rows); // ✅ now it's safe

    if (result.rows.length === 0) {
      console.log("User already RSVP'd.");
      return res.status(200).json({ message: "Already RSVP'd" });
    }

    res.json({ message: "RSVP successful" });
  } catch (err) {
    console.error("RSVP error:", err);
    res.status(500).json({ error: "Failed to RSVP" });
  }
});

// ✅ GET /games/:id/rsvps - list all users who RSVP'd to this game
router.get("/:id/rsvps", async (req, res) => {
  const gameId = parseInt(req.params.id);

  try {
    const result = await db.query(`
      SELECT users.id, users.username
      FROM rsvps
      JOIN users ON rsvps.user_id = users.id
      WHERE rsvps.game_id = $1
      ORDER BY users.username
    `, [gameId]);

    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching RSVPs for game:", err);
    res.status(500).json({ error: "Failed to fetch RSVP users" });
  }
});

// delet /games/:id/resvps - delete the user's route who opt out of the game
router.delete("/:id/rsvp", authenticateToken, async (req, res) => {
  const userId = req.user.userId;
  const gameId = parseInt(req.params.id);

  try {
  const user = await db.query("SELECT is_blocked FROM users WHERE id = $1", [req.user.userId]);
    if (user.rows[0].is_blocked) {
    return res.status(403).json({ error: "Blocked users cannot RSVP" });
}


    const result = await db.query(
      `DELETE FROM rsvps WHERE user_id = $1 AND game_id = $2 RETURNING id`,
      [userId, gameId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "RSVP not found" });
    }

    res.json({ message: "RSVP cancelled" });
  } catch (err) {
    console.error("RSVP cancel error:", err);
    res.status(500).json({ error: "Failed to cancel RSVP" });
  }
});



module.exports = router;
