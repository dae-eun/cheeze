-- 3. 서버 목록 데이터 삽입
INSERT INTO servers (name) VALUES
('데이안'),
('아이라'),
('던컨'),
('알리사'),
('메이븐'),
('라사'),
('칼릭스')
ON CONFLICT (name) DO NOTHING; 