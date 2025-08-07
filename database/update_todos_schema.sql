-- todos 테이블 스키마 업데이트
-- progress_type과 repeat_cycle 컬럼의 제약조건을 업데이트

-- 기존 제약조건 삭제
ALTER TABLE todos DROP CONSTRAINT IF EXISTS todos_progress_type_check;
ALTER TABLE todos DROP CONSTRAINT IF EXISTS todos_repeat_cycle_check;

-- 새로운 제약조건 추가
ALTER TABLE todos ADD CONSTRAINT todos_progress_type_check 
  CHECK (progress_type IN ('dungeon', 'quest', 'purchase', 'exchange', 'other'));

ALTER TABLE todos ADD CONSTRAINT todos_repeat_cycle_check 
  CHECK (repeat_cycle IN ('없음', '일간', '주간', '월간'));

-- 기본값 업데이트
ALTER TABLE todos ALTER COLUMN progress_type SET DEFAULT 'other';
ALTER TABLE todos ALTER COLUMN repeat_cycle SET DEFAULT '없음';

-- 기존 데이터 업데이트 (필요한 경우)
UPDATE todos SET progress_type = 'other' WHERE progress_type NOT IN ('dungeon', 'quest', 'purchase', 'exchange', 'other');
UPDATE todos SET repeat_cycle = '없음' WHERE repeat_cycle NOT IN ('없음', '일간', '주간', '월간');
