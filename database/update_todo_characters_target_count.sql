-- 기존 todo_characters 테이블의 target_count를 todos 테이블의 값으로 업데이트
UPDATE todo_characters 
SET target_count = todos.target_count
FROM todos 
WHERE todo_characters.todo_id = todos.id 
AND todo_characters.target_count IS NULL OR todo_characters.target_count = 1;

-- 업데이트된 레코드 수 확인
SELECT COUNT(*) as updated_records 
FROM todo_characters tc
JOIN todos t ON tc.todo_id = t.id
WHERE tc.target_count = t.target_count;
