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

DROP POLICY IF EXISTS "Users can view their own tasks" ON tasks;
DROP POLICY IF EXISTS "Users can insert their own tasks" ON tasks;
DROP POLICY IF EXISTS "Users can update their own tasks" ON tasks;
DROP POLICY IF EXISTS "Users can delete their own tasks" ON tasks;

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

-- Tasks policies
CREATE POLICY "Users can view their own tasks" ON tasks
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own tasks" ON tasks
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own tasks" ON tasks
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own tasks" ON tasks
  FOR DELETE USING (user_id = auth.uid()); 