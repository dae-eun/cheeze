-- 8. Cron 로그 테이블 생성
CREATE TABLE IF NOT EXISTS cron_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    job_name VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL CHECK (status IN ('success', 'failed', 'retrying')),
    message TEXT,
    attempts INTEGER DEFAULT 1,
    total_time_ms INTEGER,
    error_details TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_cron_logs_job_name ON cron_logs(job_name);
CREATE INDEX IF NOT EXISTS idx_cron_logs_status ON cron_logs(status);
CREATE INDEX IF NOT EXISTS idx_cron_logs_created_at ON cron_logs(created_at);

-- RLS 활성화
ALTER TABLE cron_logs ENABLE ROW LEVEL SECURITY;

-- RLS 정책 (서비스 계정만 접근 가능)
CREATE POLICY "service_role_cron_logs" ON cron_logs
    FOR ALL USING (true);
