-- ===== 데이터 마이그레이션 스크립트 =====
-- 기존 urls 테이블에 access_key 컬럼을 추가하고 기본값을 설정합니다.

-- 1. access_key 컬럼 추가 (기본값: 'default')
ALTER TABLE urls 
ADD COLUMN IF NOT EXISTS access_key TEXT DEFAULT 'default';

-- 2. 기존 데이터에 기본 액세스 키 설정
UPDATE urls 
SET access_key = 'default' 
WHERE access_key IS NULL;

-- 3. access_key를 NOT NULL로 변경
ALTER TABLE urls 
ALTER COLUMN access_key SET NOT NULL;

-- 4. 기존 인덱스 확인 및 새 인덱스 생성
CREATE INDEX IF NOT EXISTS urls_access_key_idx ON urls(access_key);

-- 5. 마이그레이션 완료 확인
SELECT 
    COUNT(*) as total_urls,
    access_key,
    MIN(created_at) as first_created,
    MAX(created_at) as last_created
FROM urls
GROUP BY access_key
ORDER BY access_key;

-- ===== 마이그레이션 완료 =====
-- 모든 기존 URL은 'default' 키로 마이그레이션되었습니다.
-- 'default' 키로 로그인하면 기존 데이터를 볼 수 있습니다.
