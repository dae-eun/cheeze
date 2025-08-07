-- todos 테이블 progress_type 컬럼 업데이트
-- 새로운 진행종류: 던전, 퀘스트, 구매, 교환, 기타

-- 기존 제약조건 삭제
ALTER TABLE todos DROP CONSTRAINT IF EXISTS todos_progress_type_check;

-- 새로운 제약조건 추가
ALTER TABLE todos ADD CONSTRAINT todos_progress_type_check 
  CHECK (progress_type IN ('dungeon', 'quest', 'purchase', 'exchange', 'other'));

-- 기본값 업데이트
ALTER TABLE todos ALTER COLUMN progress_type SET DEFAULT 'other';

-- 기존 데이터 업데이트
-- 아르바이트 → other로 변경
UPDATE todos SET progress_type = 'other' WHERE progress_type = '아르바이트';

-- 한글 값들을 영문으로 변경
UPDATE todos SET progress_type = 'dungeon' WHERE progress_type = '던전';
UPDATE todos SET progress_type = 'quest' WHERE progress_type = '퀘스트';
UPDATE todos SET progress_type = 'purchase' WHERE progress_type = '구매';
UPDATE todos SET progress_type = 'exchange' WHERE progress_type = '교환';
UPDATE todos SET progress_type = 'other' WHERE progress_type = '기타';

-- 알 수 없는 값들을 other로 변경
UPDATE todos SET progress_type = 'other' 
WHERE progress_type NOT IN ('dungeon', 'quest', 'purchase', 'exchange', 'other');
