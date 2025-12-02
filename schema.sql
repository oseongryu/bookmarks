-- URLs 테이블 생성
CREATE TABLE urls (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    url TEXT NOT NULL,
    category TEXT,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 생성 (성능 향상)
CREATE INDEX urls_user_id_idx ON urls(user_id);
CREATE INDEX urls_created_at_idx ON urls(created_at DESC);

-- RLS (Row Level Security) 활성화
ALTER TABLE urls ENABLE ROW LEVEL SECURITY;

-- RLS 정책 생성 - 사용자는 자신의 URL만 조회 가능
CREATE POLICY "Users can view their own URLs"
    ON urls FOR SELECT
    USING (auth.uid() = user_id);

-- RLS 정책 생성 - 사용자는 자신의 URL만 추가 가능
CREATE POLICY "Users can insert their own URLs"
    ON urls FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- RLS 정책 생성 - 사용자는 자신의 URL만 수정 가능
CREATE POLICY "Users can update their own URLs"
    ON urls FOR UPDATE
    USING (auth.uid() = user_id);

-- RLS 정책 생성 - 사용자는 자신의 URL만 삭제 가능
CREATE POLICY "Users can delete their own URLs"
    ON urls FOR DELETE
    USING (auth.uid() = user_id);

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
