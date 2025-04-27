const db = require("./db"); // adjust path if needed

async function makeAdminByUsername(username) {
  try {
    const result = await db.query(
      `UPDATE users SET is_admin = TRUE WHERE username = $1 RETURNING id, username, is_admin`,
      [username]
    );

    if (result.rows.length === 0) {
      console.log("❌ No user found with that username.");
    } else {
      console.log("✅ User updated:", result.rows[0]);
    }
  } catch (err) {
    console.error("Error promoting user to admin:", err);
  } finally {
    process.exit(); // exit script
  }
}

// Replace with desired username
makeAdminByUsername("IMRNBZ");
