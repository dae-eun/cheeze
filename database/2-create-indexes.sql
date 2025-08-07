-- 2. 인덱스 생성
-- Organizations indexes
CREATE INDEX idx_organizations_invite_code ON organizations(invite_code);

-- Users indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_organization_id ON users(organization_id);

-- Characters indexes
CREATE INDEX idx_characters_user_id ON characters(user_id);
CREATE INDEX idx_characters_server_id ON characters(server_id);
CREATE INDEX idx_characters_is_main ON characters(is_main);

-- Tasks indexes
CREATE INDEX idx_tasks_user_id ON tasks(user_id);
CREATE INDEX idx_tasks_character_id ON tasks(character_id);
CREATE INDEX idx_tasks_completed ON tasks(completed);
CREATE INDEX idx_tasks_due_date ON tasks(due_date); 