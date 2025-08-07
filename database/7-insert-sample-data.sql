-- 7. 샘플 데이터 삽입 (선택사항)

-- 샘플 조직 생성
INSERT INTO organizations (name, invite_code) VALUES
('테스트 조직', 'TEST123')
ON CONFLICT (invite_code) DO NOTHING; 