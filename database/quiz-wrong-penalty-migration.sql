-- 오답 시 점수감소 설정 (wrong_penalty) 추가
-- Supabase SQL Editor에서 실행

ALTER TABLE quiz_room_rules
ADD COLUMN IF NOT EXISTS wrong_penalty INTEGER NOT NULL DEFAULT 0 CHECK (wrong_penalty >= 0);

COMMENT ON COLUMN quiz_room_rules.wrong_penalty IS '오답 시 감점 (0이면 감점 없음)';
