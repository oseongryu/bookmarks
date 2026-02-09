# URL & Memo Manager 📎✍️

간편한 URL 북마크 및 메모 관리 서비스입니다.

## ✨ 주요 기능

- 🔐 **간단한 인증** - 액세스 키 기반 로그인
- 🔄 **이중 모드** - URL 모드와 메모 모드 간 전환 가능
- 📝 **빠른 URL 등록** - URL만 입력하면 자동으로 제목 생성
- ✍️ **메모 작성** - 간단한 텍스트 메모 작성 및 관리
- 📋 **원클릭 복사** - URL을 클립보드에 빠르게 복사
- 🏷️ **선택적 정보** - 제목, 카테고리, 설명은 선택사항
- ✏️ **편집 모드** - 토글 스위치로 수정/삭제 버튼 표시/숨김
- 🔍 **실시간 검색** - 제목, URL/내용, 카테고리, 설명으로 검색
- 🎨 **모던한 UI** - 깔끔하고 직관적인 디자인
- 📱 **반응형 디자인** - 모바일, 태블릿, 데스크톱 지원

## 🚀 빠른 시작

### 1. Supabase 프로젝트 생성

1. [Supabase](https://supabase.com)에 가입하고 새 프로젝트를 생성합니다.
2. 프로젝트 대시보드에서 **Settings** > **API**로 이동합니다.
3. 다음 정보를 복사합니다:
   - `Project URL`
   - `anon public` key

### 2. 데이터베이스 테이블 생성

#### 새로 설치하는 경우:

Supabase 대시보드의 **SQL Editor**에서 `schema.sql` 파일의 내용을 실행합니다.

#### 기존 데이터가 있는 경우 (마이그레이션):

Supabase 대시보드의 **SQL Editor**에서 `migration.sql` 파일의 내용을 실행합니다.

- 기존 모든 URL은 `default` 액세스 키로 마이그레이션됩니다
- `default` 키로 로그인하면 기존 데이터를 볼 수 있습니다

### 3. 설정 파일 수정

`config.js` 파일을 열고 Supabase 정보를 입력합니다:

```javascript
const SUPABASE_CONFIG = {
  url: "https://xxxxxxxxxxxxx.supabase.co", // 여기에 Project URL 입력
  anonKey: "your-anon-key-here", // 여기에 anon public key 입력
};
```

### 4. 웹사이트 실행

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

## 🔑 액세스 키 시스템

이 앱은 **멀티 키 시스템**을 사용합니다:

- 각 사용자는 원하는 액세스 키를 입력하여 로그인합니다
- 각 액세스 키마다 **별도의 URL 목록**이 생성됩니다
- 같은 키로 로그인하면 동일한 URL 목록을 볼 수 있습니다
- 다른 키로 로그인하면 완전히 다른 URL 목록이 표시됩니다

**예시:**

- `mykey123`로 로그인 → A 사용자의 URL 목록
- `anotherkey`로 로그인 → B 사용자의 URL 목록
- 각 키는 독립적인 데이터 공간을 가집니다

## 📁 프로젝트 구조

```
url-manager/
├── index.html      # 메인 HTML 파일
├── style.css       # 스타일시트
├── app.js          # 애플리케이션 로직
├── config.js       # Supabase 설정
├── schema.sql      # 데이터베이스 스키마 (새 설치용)
├── migration.sql   # 데이터베이스 마이그레이션 (기존 데이터용)
└── README.md       # 프로젝트 문서
```

## 🎯 사용 방법

1. **로그인**
   - 원하는 액세스 키를 입력하여 로그인
   - 처음 사용하는 키라면 새로운 데이터 공간이 생성됩니다
   - 이전에 사용한 키라면 저장된 URL/메모 목록을 볼 수 있습니다
   - 로그인 정보는 브라우저에 저장됩니다

2. **모드 전환**
   - 헤더 중앙의 URL/메모 토글 버튼으로 모드 전환
   - URL 모드: URL 북마크 관리
   - 메모 모드: 텍스트 메모 관리

3. **URL 추가 (URL 모드)**
   - URL 입력란에 URL만 입력하고 추가 (제목은 자동 생성)
   - 또는 "추가 옵션"을 열어 제목, 카테고리, 설명 입력
   - 여러 URL을 한 번에 추가 가능 (줄바꿈으로 구분)

4. **메모 추가 (메모 모드)**
   - 메모 제목 입력 (선택사항, 비워두면 타임스탬프 사용)
   - 메모 내용 입력 (필수)
   - 카테고리 추가 가능 (선택사항)

5. **URL 복사**
   - 각 URL 항목의 초록색 복사 버튼 클릭
   - URL이 클립보드에 복사됨

6. **수정/삭제**
   - 헤더의 편집 모드 토글 스위치 활성화
   - 수정/삭제 버튼이 나타남
   - URL 또는 메모 수정/삭제 진행

7. **메모 확장/축소**
   - 메모 모드에서 긴 내용은 자동으로 축소됨
   - "더 보기" 버튼으로 전체 내용 확인
   - "접기" 버튼으로 다시 축소

8. **검색**
   - 검색창에서 실시간 검색
   - URL 모드: 제목, URL, 카테고리, 설명 검색
   - 메모 모드: 제목, 내용, 카테고리 검색

9. **로그아웃**
   - 헤더의 로그아웃 버튼 클릭

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
