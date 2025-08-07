-- 10. 반복횟수 기능 추가

-- todos 테이블에 목표 횟수 필드 추가
ALTER TABLE todos 
ADD COLUMN IF NOT EXISTS target_count INTEGER DEFAULT 1 CHECK (target_count >= 1);

-- todo_characters 테이블에 현재 횟수 필드 추가
ALTER TABLE todo_characters 
ADD COLUMN IF NOT EXISTS current_count INTEGER DEFAULT 0 CHECK (current_count >= 0),
ADD COLUMN IF NOT EXISTS target_count INTEGER DEFAULT 1 CHECK (target_count >= 1);

-- 현재 횟수가 목표 횟수에 도달하면 자동으로 완료되도록 트리거 함수 생성
CREATE OR REPLACE FUNCTION check_completion_by_count()
RETURNS TRIGGER AS $$
BEGIN
  -- 현재 횟수가 목표 횟수에 도달하면 자동 완료
  IF NEW.current_count >= NEW.target_count THEN
    NEW.is_completed = true;
    NEW.completed_at = NOW();
    NEW.completion_date = CURRENT_DATE;
  END IF;
  
  RETURN NEW;
END;
$$ language 'plpgsql';

-- 트리거 생성
DROP TRIGGER IF EXISTS trigger_check_completion_by_count ON todo_characters;
CREATE TRIGGER trigger_check_completion_by_count
  BEFORE UPDATE ON todo_characters
  FOR EACH ROW
  EXECUTE FUNCTION check_completion_by_count();

-- 기존 데이터에 대한 기본값 설정
UPDATE todos SET target_count = 1 WHERE target_count IS NULL;
UPDATE todo_characters SET current_count = 0 WHERE current_count IS NULL;
UPDATE todo_characters SET target_count = 1 WHERE target_count IS NULL;
