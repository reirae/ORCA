USE orca_db;

-- Users (2 workers, 2 experts, 1 admin)
INSERT INTO users (name, email, contact_number, bio, password_hash, role, is_verified, is_approved, created_at, updated_at) VALUES
('John Doe', 'john@orca.com', '91234567', 'Structural engineer with 10 years experience.', '$argon2id$v=19$m=65536,t=3,p=4$placeholder1', 'worker', TRUE, TRUE, NOW(), NOW()),
('Jane Smith', 'jane@orca.com', '92345678', 'Site safety officer.', '$argon2id$v=19$m=65536,t=3,p=4$placeholder2', 'worker', TRUE, TRUE, NOW(), NOW()),
('Bob Chen', 'bob@orca.com', '93456789', 'Civil engineering expert specializing in foundations.', '$argon2id$v=19$m=65536,t=3,p=4$placeholder3', 'expert', TRUE, TRUE, NOW(), NOW()),
('Alice Tan', 'alice@orca.com', '94567890', 'Mechanical systems expert.', '$argon2id$v=19$m=65536,t=3,p=4$placeholder4', 'expert', TRUE, TRUE, NOW(), NOW()),
('Admin User', 'admin@orca.com', '95678901', NULL, '$argon2id$v=19$m=65536,t=3,p=4$placeholder5', 'admin', TRUE, TRUE, NOW(), NOW());

-- Conversations
INSERT INTO conversations (worker_id, expert_id, created_at, updated_at) VALUES
(1, 3, NOW(), NOW()),
(2, 4, NOW(), NOW());

-- Messages
INSERT INTO messages (conversation_id, sender_id, content, sent_at) VALUES
(1, 1, 'Hi Bob, I have a concern about the beam alignment on level 3.', NOW()),
(1, 3, 'Can you send me a photo of the affected area?', NOW()),
(1, 1, 'Sure, uploading now.', NOW()),
(2, 2, 'Alice, the HVAC unit on level 2 is making unusual noises.', NOW()),
(2, 4, 'Noted. I will schedule an inspection tomorrow.', NOW());