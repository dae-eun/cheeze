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

-- Todos indexes
CREATE INDEX idx_todos_created_by ON todos(created_by);
CREATE INDEX idx_todos_organization_id ON todos(organization_id);
CREATE INDEX idx_todos_is_admin_todo ON todos(is_admin_todo);
CREATE INDEX idx_todos_created_at ON todos(created_at);
CREATE INDEX idx_todos_repeat_cycle ON todos(repeat_cycle);
CREATE INDEX idx_todos_progress_type ON todos(progress_type);

-- Todo Characters indexes
CREATE INDEX idx_todo_characters_todo_id ON todo_characters(todo_id);
CREATE INDEX idx_todo_characters_character_id ON todo_characters(character_id);
CREATE INDEX idx_todo_characters_is_completed ON todo_characters(is_completed);
CREATE INDEX idx_todo_characters_completion_date ON todo_characters(completion_date); 