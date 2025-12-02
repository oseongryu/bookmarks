# URL Manager 📎

Supabase 기반의 간편한 URL 북마크 관리 서비스입니다.

## ✨ 주요 기능

- 🔐 **사용자 인증** - Supabase Auth를 사용한 안전한 로그인/회원가입
- 📝 **URL 관리** - 계정별로 URL 추가, 수정, 삭제
- 🏷️ **카테고리 분류** - 카테고리별로 URL 정리
- 🔍 **실시간 검색** - 제목, URL, 카테고리, 설명으로 검색
- 🎨 **모던한 UI** - Bootstrap 5 기반의 프리미엄 디자인
- 📱 **반응형 디자인** - 모바일, 태블릿, 데스크톱 지원

## 🚀 빠른 시작

### 1. Supabase 프로젝트 생성

1. [Supabase](https://supabase.com)에 가입하고 새 프로젝트를 생성합니다.
2. 프로젝트 대시보드에서 **Settings** > **API**로 이동합니다.
3. 다음 정보를 복사합니다:
   - `Project URL`
   - `anon public` key

### 2. 데이터베이스 테이블 생성

Supabase 대시보드의 **SQL Editor**에서 다음 SQL을 실행합니다:

```sql
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
```

### 3. 이메일 인증 설정 (선택사항)

개발 중에는 이메일 확인을 비활성화할 수 있습니다:

1. Supabase 대시보드에서 **Authentication** > **Settings**로 이동
2. **Email Auth** 섹션에서 "Enable email confirmations" 체크 해제

### 4. 설정 파일 수정

`config.js` 파일을 열고 Supabase 정보를 입력합니다:

```javascript
const SUPABASE_CONFIG = {
    url: 'https://xxxxxxxxxxxxx.supabase.co', // 여기에 Project URL 입력
    anonKey: 'your-anon-key-here' // 여기에 anon public key 입력
};
```

### 5. 웹사이트 실행

정적 웹사이트이므로 간단한 HTTP 서버로 실행할 수 있습니다:

#### Python 사용:
```bash
# Python 3
python -m http.server 8000

# Python 2
python -m SimpleHTTPServer 8000
```

#### Node.js 사용:
```bash
npx serve
```

#### VS Code Live Server 사용:
1. VS Code에서 `index.html` 파일을 엽니다
2. 우클릭 > "Open with Live Server"

브라우저에서 `http://localhost:8000` (또는 해당 포트)로 접속합니다.

## 📁 프로젝트 구조

```
url-manager/
├── index.html      # 메인 HTML 파일
├── style.css       # 스타일시트
├── app.js          # 애플리케이션 로직
├── config.js       # Supabase 설정
└── README.md       # 프로젝트 문서
```

## 🎯 사용 방법

1. **회원가입/로그인**
   - 우측 상단의 "회원가입" 또는 "로그인" 버튼 클릭
   - 이메일과 비밀번호 입력

2. **URL 추가**
   - 로그인 후 상단 폼에서 URL 정보 입력
   - 제목, URL은 필수, 카테고리와 설명은 선택사항
   - "URL 추가" 버튼 클릭

3. **URL 관리**
   - 목록에서 각 URL의 수정/삭제 버튼 사용
   - URL 클릭 시 새 탭에서 열림

4. **검색**
   - 우측 상단 검색창에서 실시간 검색
   - 제목, URL, 카테고리, 설명 모두 검색 가능

## 🎨 기술 스택

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **UI Framework**: Bootstrap 5.3.2
- **Icons**: Bootstrap Icons
- **Backend**: Supabase (PostgreSQL + Auth)
- **Fonts**: Google Fonts (Inter)

## 🔒 보안

- Row Level Security (RLS)를 통한 데이터 보호
- 사용자는 자신의 URL만 접근 가능
- Supabase Auth를 통한 안전한 인증
- XSS 방지를 위한 HTML 이스케이프 처리

## 🌐 배포

정적 웹사이트이므로 다음 플랫폼에 무료로 배포 가능합니다:

- **Netlify**: 드래그 앤 드롭으로 간편 배포
- **Vercel**: GitHub 연동으로 자동 배포
- **GitHub Pages**: GitHub 저장소에서 직접 호스팅
- **Cloudflare Pages**: 빠른 CDN과 함께 배포

### Netlify 배포 예시:

1. [Netlify](https://netlify.com)에 로그인
2. "Add new site" > "Deploy manually"
3. 프로젝트 폴더를 드래그 앤 드롭
4. 배포 완료!

## 📝 라이선스

MIT License

## 🤝 기여

이슈와 풀 리퀘스트는 언제나 환영합니다!

## 📧 문의

문제가 발생하거나 질문이 있으시면 이슈를 등록해주세요.
