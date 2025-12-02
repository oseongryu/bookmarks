-- URLs 테이블 생성 (로그인 없이 사용)
CREATE TABLE urls (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    url TEXT NOT NULL,
    category TEXT,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 생성 (성능 향상)
CREATE INDEX urls_created_at_idx ON urls(created_at DESC);

-- RLS (Row Level Security) 활성화
ALTER TABLE urls ENABLE ROW LEVEL SECURITY;

-- RLS 정책 생성 - 모든 사용자가 URL 조회 가능
CREATE POLICY "Anyone can view URLs"
    ON urls FOR SELECT
    USING (true);

-- RLS 정책 생성 - 모든 사용자가 URL 추가 가능
CREATE POLICY "Anyone can insert URLs"
    ON urls FOR INSERT
    WITH CHECK (true);

-- RLS 정책 생성 - 모든 사용자가 URL 수정 가능
CREATE POLICY "Anyone can update URLs"
    ON urls FOR UPDATE
    USING (true);

-- RLS 정책 생성 - 모든 사용자가 URL 삭제 가능
CREATE POLICY "Anyone can delete URLs"
    ON urls FOR DELETE
    USING (true);

-- updated_at 자동 업데이트 트리거 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- updated_at 트리거 생성
CREATE TRIGGER update_urls_updated_at
    BEFORE UPDATE ON urls
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
