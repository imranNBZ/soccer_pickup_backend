-- Drop tables if they exist (order matters due to foreign keys)
DROP TABLE IF EXISTS rsvps;
DROP TABLE IF EXISTS games;
DROP TABLE IF EXISTS users;

-- Users table
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  bio TEXT,
  location TEXT,
  is_admin BOOLEAN DEFAULT FALSE,
  is_blocked BOOLEAN DEFAULT FALSE
);

ALTER TABLE users ADD COLUMN profile_pic TEXT;



-- admin user 
UPDATE users
SET is_admin = TRUE
WHERE id = 3;


-- Games table
CREATE TABLE games (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  datetime TIMESTAMP NOT NULL,
  location TEXT NOT NULL,
  skill_level TEXT,
  created_by INTEGER REFERENCES users(id) ON DELETE CASCADE
);

-- Add coordinates after creating games
ALTER TABLE games
  ADD COLUMN latitude FLOAT,
  ADD COLUMN longitude FLOAT;

-- RSVPs table
CREATE TABLE rsvps (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  game_id INTEGER REFERENCES games(id) ON DELETE CASCADE,
  UNIQUE(user_id, game_id) -- prevent duplicate RSVPs
);



-- Add admin ability
-- ALTER TABLE users ADD COLUMN is_admin BOOLEAN DEFAULT FALSE;
-- ALTER TABLE users ADD COLUMN is_blocked BOOLEAN DEFAULT FALSE;

-- Insert a admin user
-- INSERT INTO users (username, email, password_hash, bio, location, is_admin)
-- VALUES ('alexkickz', 'alex@example.com', 'hashedpassword1', 'Midfielder, loves 5-a-side.', 'Albany', TRUE)
