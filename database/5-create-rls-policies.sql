-- 5. RLS 정책 생성

-- 기존 정책들 삭제 (idempotent)
DROP POLICY IF EXISTS "Anyone can view organizations" ON organizations;
DROP POLICY IF EXISTS "Anyone can view organizations by invite code" ON organizations;
DROP POLICY IF EXISTS "service_role_organizations" ON organizations;

DROP POLICY IF EXISTS "Users can view their own profile" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;
DROP POLICY IF EXISTS "service_role_users" ON users;

DROP POLICY IF EXISTS "Anyone can view servers" ON servers;
DROP POLICY IF EXISTS "service_role_servers" ON servers;

DROP POLICY IF EXISTS "authenticated_select_characters" ON characters;
DROP POLICY IF EXISTS "authenticated_insert_characters" ON characters;
DROP POLICY IF EXISTS "authenticated_update_characters" ON characters;
DROP POLICY IF EXISTS "authenticated_delete_characters" ON characters;
DROP POLICY IF EXISTS "service_role_characters" ON characters;

DROP POLICY IF EXISTS "Admin todos are visible to all users" ON todos;
DROP POLICY IF EXISTS "Users can view todos from same organization" ON todos;
DROP POLICY IF EXISTS "Users can update their own todos" ON todos;
DROP POLICY IF EXISTS "Users can create todos in their organization" ON todos;
DROP POLICY IF EXISTS "Users can delete their own todos" ON todos;
DROP POLICY IF EXISTS "service_role_todos" ON todos;
DROP POLICY IF EXISTS "Users can view todos" ON todos;
DROP POLICY IF EXISTS "Users can insert todos" ON todos;
DROP POLICY IF EXISTS "Users can update todos" ON todos;
DROP POLICY IF EXISTS "Users can delete todos" ON todos;

DROP POLICY IF EXISTS "Users can view their character todo status" ON todo_characters;
DROP POLICY IF EXISTS "Users can update their character todo status" ON todo_characters;
DROP POLICY IF EXISTS "Users can assign todos to their characters" ON todo_characters;

-- Organizations policies
-- 모든 사용자가 초대코드로 조직을 조회할 수 있도록
CREATE POLICY "Anyone can view organizations" ON organizations
  FOR SELECT USING (true);

-- Users policies
-- 회원가입 시 사용자 생성 허용 (인증되지 않은 사용자도)
CREATE POLICY "Allow user registration" ON users
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can view their own profile" ON users
  FOR SELECT USING (id = auth.uid());

CREATE POLICY "Users can update their own profile" ON users
  FOR UPDATE USING (id = auth.uid());

-- Servers policies
CREATE POLICY "Anyone can view servers" ON servers
  FOR SELECT USING (true);

-- Characters policies
-- 인증된 사용자 정책
CREATE POLICY "authenticated_select_characters" ON characters
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "authenticated_insert_characters" ON characters
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "authenticated_update_characters" ON characters
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "authenticated_delete_characters" ON characters
  FOR DELETE USING (auth.uid() = user_id);

-- Todos policies
-- 1. 관리자 숙제는 모든 사용자가 볼 수 있음
CREATE POLICY "Admin todos are visible to all users" ON todos
  FOR SELECT USING (is_admin_todo = true);

-- 2. 같은 조직의 사용자들은 서로의 숙제를 볼 수 있음
CREATE POLICY "Users can view todos from same organization" ON todos
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

-- 3. 사용자는 자신의 숙제를 수정할 수 있음
CREATE POLICY "Users can update their own todos" ON todos
  FOR UPDATE USING (created_by = auth.uid());

-- 4. 사용자는 자신의 조직에 숙제를 추가할 수 있음
CREATE POLICY "Users can create todos in their organization" ON todos
  FOR INSERT WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

-- 5. 사용자는 자신이 만든 숙제를 삭제할 수 있음
CREATE POLICY "Users can delete their own todos" ON todos
  FOR DELETE USING (created_by = auth.uid());

-- Todo Characters policies
-- 1. 사용자는 자신의 캐릭터의 숙제 완료 상태를 볼 수 있음
CREATE POLICY "Users can view their character todo status" ON todo_characters
  FOR SELECT USING (
    character_id IN (
      SELECT id FROM characters WHERE user_id = auth.uid()
    )
  );

-- 2. 사용자는 자신의 캐릭터의 숙제 완료 상태를 수정할 수 있음
CREATE POLICY "Users can update their character todo status" ON todo_characters
  FOR UPDATE USING (
    character_id IN (
      SELECT id FROM characters WHERE user_id = auth.uid()
    )
  );

-- 3. 사용자는 자신의 캐릭터에 숙제를 할당할 수 있음
CREATE POLICY "Users can assign todos to their characters" ON todo_characters
  FOR INSERT WITH CHECK (
    character_id IN (
      SELECT id FROM characters WHERE user_id = auth.uid()
    )
  ); 