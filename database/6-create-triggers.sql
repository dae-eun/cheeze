-- 6. 트리거 생성

-- updated_at 컬럼을 자동으로 업데이트하는 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 각 테이블에 updated_at 트리거 생성
CREATE TRIGGER update_organizations_updated_at
    BEFORE UPDATE ON organizations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_servers_updated_at
    BEFORE UPDATE ON servers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_characters_updated_at
    BEFORE UPDATE ON characters
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_todos_updated_at
    BEFORE UPDATE ON todos
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_todo_characters_updated_at
    BEFORE UPDATE ON todo_characters
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 자동 갱신을 위한 함수
CREATE OR REPLACE FUNCTION reset_todos_by_cycle()
RETURNS void AS $$
BEGIN
  -- 일간 숙제: 매일 새벽 6시에 갱신
  UPDATE todo_characters 
  SET is_completed = false, 
      completed_at = null,
      completion_date = CURRENT_DATE,
      current_count = 0  -- 반복횟수도 초기화
  WHERE completion_date < CURRENT_DATE
    AND todo_id IN (
      SELECT id FROM todos WHERE repeat_cycle = '일간'
    );
  
  -- 주간 숙제: 월요일 새벽 6시에 갱신 (월요일 = 1)
  UPDATE todo_characters 
  SET is_completed = false, 
      completed_at = null,
      completion_date = CURRENT_DATE,
      current_count = 0  -- 반복횟수도 초기화
  WHERE EXTRACT(DOW FROM CURRENT_DATE) = 1
    AND completion_date < CURRENT_DATE
    AND todo_id IN (
      SELECT id FROM todos WHERE repeat_cycle = '주간'
    );
  
  -- 월간 숙제: 매월 1일 새벽 6시에 갱신
  UPDATE todo_characters 
  SET is_completed = false, 
      completed_at = null,
      completion_date = CURRENT_DATE,
      current_count = 0  -- 반복횟수도 초기화
  WHERE EXTRACT(DAY FROM CURRENT_DATE) = 1
    AND completion_date < CURRENT_DATE
    AND todo_id IN (
      SELECT id FROM todos WHERE repeat_cycle = '월간'
    );
END;
$$ language 'plpgsql';

-- 자동 갱신을 위한 스케줄러 (PostgreSQL의 pg_cron 확장 필요)
-- 참고: 실제 운영환경에서는 외부 스케줄러(예: cron)를 사용하는 것이 좋습니다
-- SELECT cron.schedule('reset-todos', '0 6 * * *', 'SELECT reset_todos_by_cycle();'); 