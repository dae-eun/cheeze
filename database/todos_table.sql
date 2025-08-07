-- 기존 테이블들 삭제 (주의: 데이터가 모두 삭제됩니다!)
DROP TABLE IF EXISTS todo_characters CASCADE;
DROP TABLE IF EXISTS todos CASCADE;

-- 숙제목록 테이블 생성 (기존 구조 유지)
CREATE TABLE IF NOT EXISTS todos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  is_admin_todo BOOLEAN DEFAULT FALSE,
  repeat_cycle TEXT NOT NULL CHECK (repeat_cycle IN ('daily', 'weekly', 'weekend')) DEFAULT 'daily',
  progress_type TEXT NOT NULL CHECK (progress_type IN ('dungeon', 'quest', 'purchase', 'other')) DEFAULT 'other',
  created_by UUID REFERENCES users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 캐릭터별 숙제 매핑 테이블 (다대다 관계)
CREATE TABLE IF NOT EXISTS todo_characters (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  todo_id UUID REFERENCES todos(id) ON DELETE CASCADE,
  character_id UUID REFERENCES characters(id) ON DELETE CASCADE,
  is_completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP WITH TIME ZONE,
  completion_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(todo_id, character_id, completion_date)
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_todos_created_by ON todos(created_by);
CREATE INDEX IF NOT EXISTS idx_todos_organization_id ON todos(organization_id);
CREATE INDEX IF NOT EXISTS idx_todos_is_admin_todo ON todos(is_admin_todo);
CREATE INDEX IF NOT EXISTS idx_todos_created_at ON todos(created_at);
CREATE INDEX IF NOT EXISTS idx_todos_repeat_cycle ON todos(repeat_cycle);
CREATE INDEX IF NOT EXISTS idx_todos_progress_type ON todos(progress_type);

CREATE INDEX IF NOT EXISTS idx_todo_characters_todo_id ON todo_characters(todo_id);
CREATE INDEX IF NOT EXISTS idx_todo_characters_character_id ON todo_characters(character_id);
CREATE INDEX IF NOT EXISTS idx_todo_characters_is_completed ON todo_characters(is_completed);
CREATE INDEX IF NOT EXISTS idx_todo_characters_completion_date ON todo_characters(completion_date);

-- RLS (Row Level Security) 활성화
ALTER TABLE todos ENABLE ROW LEVEL SECURITY;
ALTER TABLE todo_characters ENABLE ROW LEVEL SECURITY;

-- todos 테이블 RLS 정책들
-- 1. 관리자 숙제은 모든 사용자가 볼 수 있음
CREATE POLICY "Admin todos are visible to all users" ON todos
  FOR SELECT USING (is_admin_todo = true);

-- 2. 같은 조직의 사용자들은 서로의 숙제을 볼 수 있음
CREATE POLICY "Users can view todos from same organization" ON todos
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

-- 3. 사용자는 자신의 숙제을 수정할 수 있음
CREATE POLICY "Users can update their own todos" ON todos
  FOR UPDATE USING (created_by = auth.uid());

-- 4. 사용자는 자신의 조직에 숙제을 추가할 수 있음
CREATE POLICY "Users can create todos in their organization" ON todos
  FOR INSERT WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

-- 5. 사용자는 자신이 만든 숙제을 삭제할 수 있음
CREATE POLICY "Users can delete their own todos" ON todos
  FOR DELETE USING (created_by = auth.uid());

-- todo_characters 테이블 RLS 정책들
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

-- 3. 사용자는 자신의 캐릭터에 숙제을 할당할 수 있음
CREATE POLICY "Users can assign todos to their characters" ON todo_characters
  FOR INSERT WITH CHECK (
    character_id IN (
      SELECT id FROM characters WHERE user_id = auth.uid()
    )
  );

-- updated_at 자동 업데이트를 위한 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- 트리거 생성
CREATE TRIGGER update_todos_updated_at 
  BEFORE UPDATE ON todos 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_todo_characters_updated_at 
  BEFORE UPDATE ON todo_characters 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- 자동 갱신을 위한 함수
CREATE OR REPLACE FUNCTION reset_todos_by_cycle()
RETURNS void AS $$
BEGIN
  -- 일간 숙제: 매일 새벽 6시에 갱신
  UPDATE todo_characters 
  SET is_completed = false, 
      completed_at = null,
      completion_date = CURRENT_DATE
  WHERE completion_date < CURRENT_DATE
    AND todo_id IN (
      SELECT id FROM todos WHERE repeat_cycle = 'daily'
    );
  
  -- 주간 숙제: 월요일 새벽 6시에 갱신 (월요일 = 1)
  UPDATE todo_characters 
  SET is_completed = false, 
      completed_at = null,
      completion_date = CURRENT_DATE
  WHERE EXTRACT(DOW FROM CURRENT_DATE) = 1
    AND completion_date < CURRENT_DATE
    AND todo_id IN (
      SELECT id FROM todos WHERE repeat_cycle = 'weekly'
    );
  
  -- 주말 숙제: 토요일 새벽 6시에 갱신 (토요일 = 6)
  UPDATE todo_characters 
  SET is_completed = false, 
      completed_at = null,
      completion_date = CURRENT_DATE
  WHERE EXTRACT(DOW FROM CURRENT_DATE) = 6
    AND completion_date < CURRENT_DATE
    AND todo_id IN (
      SELECT id FROM todos WHERE repeat_cycle = 'weekend'
    );
END;
$$ language 'plpgsql';

-- 자동 갱신을 위한 스케줄러 (PostgreSQL의 pg_cron 확장 필요)
-- 참고: 실제 운영환경에서는 외부 스케줄러(예: cron)를 사용하는 것이 좋습니다
-- SELECT cron.schedule('reset-todos', '0 6 * * *', 'SELECT reset_todos_by_cycle();'); 