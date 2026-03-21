-- 이미지 영역 클릭 퀴즈 방 시스템 스키마
-- Supabase SQL Editor에서 실행
-- 기획서 17.7절 수정 데이터 모델 반영
--
-- Storage 버킷 생성: Supabase Dashboard > Storage > New bucket > "quiz-images" (public)

-- 1. quiz_rooms: 퀴즈 방
CREATE TABLE IF NOT EXISTS quiz_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  thumbnail_url TEXT,
  status TEXT NOT NULL DEFAULT 'preparing' CHECK (status IN ('preparing', 'playing', 'ended')),
  is_public BOOLEAN NOT NULL DEFAULT true,
  play_start_at TIMESTAMPTZ,
  play_end_at TIMESTAMPTZ,
  ranking_visible BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_quiz_rooms_organization ON quiz_rooms(organization_id);
CREATE INDEX IF NOT EXISTS idx_quiz_rooms_created_by ON quiz_rooms(created_by);
CREATE INDEX IF NOT EXISTS idx_quiz_rooms_status ON quiz_rooms(status);

-- 2. quiz_room_rules: 방별 룰
CREATE TABLE IF NOT EXISTS quiz_room_rules (
  room_id UUID PRIMARY KEY REFERENCES quiz_rooms(id) ON DELETE CASCADE,
  problem_order_type TEXT NOT NULL DEFAULT 'RANDOM' CHECK (problem_order_type IN ('FIXED', 'RANDOM')),
  default_click_limit INTEGER NOT NULL DEFAULT 5 CHECK (default_click_limit > 0),
  default_time_limit_sec INTEGER NOT NULL DEFAULT 30 CHECK (default_time_limit_sec > 0),
  allow_only_one_play BOOLEAN NOT NULL DEFAULT true,
  answer_judge_type TEXT NOT NULL DEFAULT 'SERVER' CHECK (answer_judge_type IN ('SERVER', 'CLIENT')),
  correct_effect_enabled BOOLEAN NOT NULL DEFAULT true,
  pause_during_correct_effect BOOLEAN NOT NULL DEFAULT true,
  mobile_supported BOOLEAN NOT NULL DEFAULT true,
  wrong_penalty INTEGER NOT NULL DEFAULT 0 CHECK (wrong_penalty >= 0),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. quiz_problems: 문제
CREATE TABLE IF NOT EXISTS quiz_problems (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES quiz_rooms(id) ON DELETE CASCADE,
  title TEXT,
  description TEXT,
  image_url TEXT NOT NULL,
  image_width INTEGER,
  image_height INTEGER,
  order_no INTEGER NOT NULL DEFAULT 0,
  base_score INTEGER NOT NULL DEFAULT 100 CHECK (base_score >= 0),
  time_limit_sec INTEGER NOT NULL DEFAULT 30 CHECK (time_limit_sec > 0),
  click_limit INTEGER NOT NULL DEFAULT 5 CHECK (click_limit > 0),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_quiz_problems_room ON quiz_problems(room_id);
CREATE INDEX IF NOT EXISTS idx_quiz_problems_room_order ON quiz_problems(room_id, order_no);

-- 4. quiz_answer_areas: 정답 영역
CREATE TABLE IF NOT EXISTS quiz_answer_areas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  problem_id UUID NOT NULL REFERENCES quiz_problems(id) ON DELETE CASCADE,
  shape_type TEXT NOT NULL DEFAULT 'RECT' CHECK (shape_type IN ('RECT', 'POLYGON', 'CIRCLE')),
  points_json JSONB NOT NULL,
  tolerance NUMERIC(5,4) DEFAULT 0,
  normalized_yn BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(problem_id)
);

CREATE INDEX IF NOT EXISTS idx_quiz_answer_areas_problem ON quiz_answer_areas(problem_id);

-- 5. quiz_play_sessions: 플레이 세션
CREATE TABLE IF NOT EXISTS quiz_play_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES quiz_rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  finished_at TIMESTAMPTZ,
  total_score INTEGER NOT NULL DEFAULT 0,
  total_solved_count INTEGER NOT NULL DEFAULT 0,
  total_wrong_count INTEGER NOT NULL DEFAULT 0,
  total_elapsed_ms BIGINT NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'playing' CHECK (status IN ('playing', 'completed', 'abandoned')),
  ranking_eligible BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(room_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_quiz_play_sessions_room ON quiz_play_sessions(room_id);
CREATE INDEX IF NOT EXISTS idx_quiz_play_sessions_user ON quiz_play_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_quiz_play_sessions_status ON quiz_play_sessions(room_id, status);

-- 6. quiz_session_problem_orders: 세션별 랜덤 문제 순서
CREATE TABLE IF NOT EXISTS quiz_session_problem_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES quiz_play_sessions(id) ON DELETE CASCADE,
  problem_id UUID NOT NULL REFERENCES quiz_problems(id) ON DELETE CASCADE,
  order_no INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(session_id, order_no)
);

CREATE INDEX IF NOT EXISTS idx_quiz_session_problem_orders_session ON quiz_session_problem_orders(session_id);

-- 7. quiz_problem_results: 문제별 결과
CREATE TABLE IF NOT EXISTS quiz_problem_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES quiz_play_sessions(id) ON DELETE CASCADE,
  problem_id UUID NOT NULL REFERENCES quiz_problems(id) ON DELETE CASCADE,
  order_no INTEGER NOT NULL,
  is_correct BOOLEAN NOT NULL,
  elapsed_ms BIGINT NOT NULL DEFAULT 0,
  paused_ms BIGINT NOT NULL DEFAULT 0,
  click_count INTEGER NOT NULL DEFAULT 0,
  remaining_click_count INTEGER NOT NULL DEFAULT 0,
  timeout_yn BOOLEAN NOT NULL DEFAULT false,
  earned_score INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(session_id, problem_id)
);

CREATE INDEX IF NOT EXISTS idx_quiz_problem_results_session ON quiz_problem_results(session_id);

-- 8. quiz_click_logs: 클릭 로그
CREATE TABLE IF NOT EXISTS quiz_click_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES quiz_play_sessions(id) ON DELETE CASCADE,
  problem_id UUID NOT NULL REFERENCES quiz_problems(id) ON DELETE CASCADE,
  click_no INTEGER NOT NULL,
  normalized_x NUMERIC(10,8) NOT NULL,
  normalized_y NUMERIC(10,8) NOT NULL,
  judge_result TEXT NOT NULL CHECK (judge_result IN ('correct', 'wrong')),
  clicked_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_quiz_click_logs_session ON quiz_click_logs(session_id);
CREATE INDEX IF NOT EXISTS idx_quiz_click_logs_session_problem ON quiz_click_logs(session_id, problem_id);

-- updated_at 트리거
CREATE OR REPLACE FUNCTION update_quiz_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS quiz_rooms_updated_at ON quiz_rooms;
CREATE TRIGGER quiz_rooms_updated_at
  BEFORE UPDATE ON quiz_rooms
  FOR EACH ROW EXECUTE FUNCTION update_quiz_updated_at();

DROP TRIGGER IF EXISTS quiz_room_rules_updated_at ON quiz_room_rules;
CREATE TRIGGER quiz_room_rules_updated_at
  BEFORE UPDATE ON quiz_room_rules
  FOR EACH ROW EXECUTE FUNCTION update_quiz_updated_at();

DROP TRIGGER IF EXISTS quiz_problems_updated_at ON quiz_problems;
CREATE TRIGGER quiz_problems_updated_at
  BEFORE UPDATE ON quiz_problems
  FOR EACH ROW EXECUTE FUNCTION update_quiz_updated_at();

DROP TRIGGER IF EXISTS quiz_answer_areas_updated_at ON quiz_answer_areas;
CREATE TRIGGER quiz_answer_areas_updated_at
  BEFORE UPDATE ON quiz_answer_areas
  FOR EACH ROW EXECUTE FUNCTION update_quiz_updated_at();

DROP TRIGGER IF EXISTS quiz_play_sessions_updated_at ON quiz_play_sessions;
CREATE TRIGGER quiz_play_sessions_updated_at
  BEFORE UPDATE ON quiz_play_sessions
  FOR EACH ROW EXECUTE FUNCTION update_quiz_updated_at();

DROP TRIGGER IF EXISTS quiz_problem_results_updated_at ON quiz_problem_results;
CREATE TRIGGER quiz_problem_results_updated_at
  BEFORE UPDATE ON quiz_problem_results
  FOR EACH ROW EXECUTE FUNCTION update_quiz_updated_at();
