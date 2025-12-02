# 데이터베이스 마이그레이션 가이드

## 개요
이 가이드는 기존 URL Manager 데이터를 새로운 멀티 키 시스템으로 마이그레이션하는 방법을 설명합니다.

## 마이그레이션 전 확인사항

### 현재 데이터 백업 (권장)
마이그레이션 전에 데이터를 백업하는 것을 권장합니다:

1. Supabase 대시보드 → **Database** → **Backups**
2. 또는 SQL Editor에서 데이터 내보내기:
```sql
SELECT * FROM urls;
```

## 마이그레이션 실행

### 1. Supabase SQL Editor 열기
1. Supabase 프로젝트 대시보드 접속
2. 좌측 메뉴에서 **SQL Editor** 클릭
3. **New query** 버튼 클릭

### 2. 마이그레이션 스크립트 실행
1. `migration.sql` 파일의 내용을 복사
2. SQL Editor에 붙여넣기
3. **Run** 버튼 클릭

### 3. 마이그레이션 결과 확인
스크립트 실행 후 다음과 같은 결과가 표시됩니다:

```
total_urls | access_key | first_created | last_created
-----------|------------|---------------|-------------
     10    |  default   | 2025-12-01... | 2025-12-02...
```

이는 10개의 URL이 `default` 키로 마이그레이션되었음을 의미합니다.

## 마이그레이션 후 사용법

### 기존 데이터 접근
- 액세스 키: `default` 로 로그인
- 기존의 모든 URL을 볼 수 있습니다

### 새로운 데이터 공간 생성
- 다른 액세스 키(예: `team-a`, `personal` 등)로 로그인
- 완전히 새로운 URL 목록 시작

## 문제 해결

### 마이그레이션 실패 시
1. 에러 메시지 확인
2. 테이블 구조 확인:
```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'urls';
```

### 롤백이 필요한 경우
```sql
-- access_key 컬럼 제거 (주의: 마이그레이션 데이터 손실)
ALTER TABLE urls DROP COLUMN IF EXISTS access_key;
```

## 추가 정보

### 기존 키 변경
기존 데이터의 액세스 키를 `default`에서 다른 키로 변경하려면:

```sql
UPDATE urls 
SET access_key = 'your-new-key' 
WHERE access_key = 'default';
```

### 여러 키로 데이터 분리
특정 조건에 따라 데이터를 여러 키로 분리:

```sql
-- 카테고리별로 다른 키 할당 예시
UPDATE urls 
SET access_key = 'work' 
WHERE category = '업무';

UPDATE urls 
SET access_key = 'personal' 
WHERE category = '개인';
```

## 지원

문제가 발생하면 GitHub Issues에 문의해주세요.
