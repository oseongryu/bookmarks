-- ===== 메모 기능 추가 마이그레이션 =====
-- 메모를 관리하기 위한 새로운 테이블을 생성합니다.

-- 1. memos 테이블 생성 (액세스 키 기반)
CREATE TABLE IF NOT EXISTS memos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    access_key TEXT NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    category TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 인덱스 생성 (성능 향상)
CREATE INDEX IF NOT EXISTS memos_access_key_idx ON memos(access_key);
CREATE INDEX IF NOT EXISTS memos_created_at_idx ON memos(created_at DESC);

-- 3. RLS (Row Level Security) 비활성화 (클라이언트에서 access_key로 필터링)
ALTER TABLE memos DISABLE ROW LEVEL SECURITY;

-- 4. updated_at 자동 업데이트 트리거 생성
CREATE TRIGGER update_memos_updated_at
    BEFORE UPDATE ON memos
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ===== 마이그레이션 완료 =====
-- memos 테이블이 생성되었습니다.
-- 기존 update_updated_at_column() 함수를 재사용합니다.
