-- Insert test users
INSERT INTO users (username, email, password_hash, bio, location, is_admin)
VALUES
  ('alexkickz', 'alex@example.com', 'hashedpassword1', 'Midfielder, loves 5-a-side.', 'Albany', TRUE),
  ('footiefan', 'fan@example.com', 'hashedpassword2', 'Just here for a good time.', 'Brooklyn', FALSE),
  ('Imran', 'imran.nabizada@icloud.com', 'Internet@11', 'Midfielder, loves 5-a-side.', 'Albany', TRUE);


-- Insert test games
INSERT INTO games (title, datetime, location, skill_level, created_by)
VALUES
  ('Sunday Morning Kickaround', '2025-04-13 10:00:00', 'Washington Park, Albany', 'Intermediate', 1),
  ('Brooklyn Pickup', '2025-04-14 17:30:00', 'Prospect Park, Brooklyn', 'Casual', 2);

-- RSVP sample
INSERT INTO rsvps (user_id, game_id)
VALUES
  (1, 1),
  (2, 2);
