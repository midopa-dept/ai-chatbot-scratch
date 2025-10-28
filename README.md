# AI 채팅 앱

Google Gemini 2.0 Flash를 활용한 간단한 AI 채팅 애플리케이션입니다.

## 주요 기능

### 🤖 AI 채팅
- ✅ 텍스트 입력 및 전송
- ✅ 스트리밍 방식의 실시간 응답 표시
- ✅ Google Gemini SDK 연동 (`@google/genai`)
- ✅ LLM Model: `gemini-2.0-flash-001`
- ✅ **다중 채팅 세션 관리**
  - 여러 채팅방 동시 관리
  - 좌측 사이드바에서 세션 전환
  - AI 기반 제목 자동 생성
  - 세션별 독립적인 메시지 저장
  - 세션 이름 변경 및 삭제
  - 레거시 채팅 자동 마이그레이션

### 📝 마크다운 렌더링
- ✅ **Streamdown** 라이브러리 사용
  - 코드 하이라이팅 (Shiki)
  - 코드 블록 복사 버튼
  - GFM(GitHub Flavored Markdown) 지원
  - 수학 수식 (KaTeX)
  - Mermaid 다이어그램
  - 스트리밍 중 불완전한 마크다운 자동 완성

### 🔌 MCP Client 연동
- ✅ **Model Context Protocol** 지원
  - STDIO, HTTP, SSE Transport 지원
  - 여러 MCP 서버 동시 관리
  - Tools 실행 및 테스트
  - Prompts 조회 및 사용
  - Resources 탐색 및 읽기
  - 서버 설정 가져오기/내보내기 (JSON)
  - 전역 상태 관리 (React Context)

### 🎨 UI/UX
- ✅ shadcn/ui + Tailwind CSS
- ✅ 반응형 디자인
- ✅ 다크 모드 지원

## 시작하기

### 1. 의존성 설치

```bash
pnpm install
```

### 2. 환경 변수 설정

`.env.example` 파일을 복사하여 `.env.local` 파일을 생성합니다:

```bash
cp .env.example .env.local
```

그리고 Gemini API 키를 입력합니다:

```
GEMINI_API_KEY=your_actual_api_key_here
```

API 키는 [Google AI Studio](https://aistudio.google.com/apikey)에서 발급받을 수 있습니다.

### 3. 개발 서버 실행

```bash
pnpm dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)을 열어 애플리케이션을 확인합니다.

## 기술 스택

- **프레임워크**: Next.js 15 (App Router)
- **언어**: TypeScript
- **스타일링**: Tailwind CSS
- **UI 컴포넌트**: shadcn/ui
- **마크다운 렌더링**: Streamdown (Vercel)
- **MCP Client**: @modelcontextprotocol/sdk
- **아이콘**: Lucide React
- **LLM**: Google Gemini 2.0 Flash
- **저장소**: LocalStorage (브라우저)

## 프로젝트 구조

```
.
├── app/
│   ├── api/
│   │   ├── chat/route.ts              # 채팅 API (스트리밍)
│   │   └── mcp/                        # MCP API Routes
│   │       ├── servers/route.ts        # 서버 관리
│   │       └── [serverId]/             # 서버별 작업
│   ├── mcp/page.tsx                    # MCP 서버 관리 페이지
│   ├── page.tsx                        # 채팅 UI 페이지
│   ├── layout.tsx                      # 루트 레이아웃
│   └── globals.css                     # 글로벌 스타일
├── components/
│   ├── ui/                             # shadcn/ui 컴포넌트
│   ├── markdown-renderer.tsx           # 마크다운 렌더링
│   ├── chat-sidebar.tsx                # 채팅 사이드바
│   ├── chat-session-item.tsx           # 채팅 세션 아이템
│   ├── mcp-server-form.tsx             # MCP 서버 추가 폼
│   ├── mcp-server-card.tsx             # MCP 서버 카드
│   └── mcp-tool-tester.tsx             # MCP Tool 테스터
├── contexts/
│   ├── chat-context.tsx                # 채팅 세션 전역 상태
│   └── mcp-context.tsx                 # MCP 전역 상태 관리
├── lib/
│   ├── types.ts                        # TypeScript 타입 정의
│   ├── storage.ts                      # 채팅 localStorage
│   ├── mcp-storage.ts                  # MCP localStorage
│   ├── mcp-client-manager.ts           # MCP Client 싱글톤
│   └── utils.ts                        # 유틸리티 함수
├── .env.example                        # 환경 변수 템플릿
└── package.json
```

## 추가 명령어

타입 체크:
```bash
pnpm typecheck
```

린트 체크:
```bash
pnpm lint
```

포맷 (필요 시):
```bash
pnpm format
```

프로덕션 빌드:
```bash
pnpm build
pnpm start
```

## 사용 가이드

### 다중 채팅 세션

1. **새 채팅 시작**: 사이드바 상단의 "새 채팅" 버튼 클릭
2. **세션 전환**: 사이드바에서 원하는 채팅 클릭
3. **세션 관리**: 
   - 세션 위에 마우스 호버 → 편집/삭제 버튼 표시
   - 세션 이름 변경: 편집 버튼 클릭
   - 세션 삭제: 삭제 버튼 클릭
4. **자동 제목 생성**: 첫 메시지 전송 시 AI가 자동으로 제목 생성
5. **사이드바 토글**: 헤더의 메뉴 버튼으로 사이드바 열기/닫기

## 보안 주의사항

- 모든 채팅 세션은 브라우저의 LocalStorage에 저장됩니다.
- 공용 PC에서는 민감한 정보를 입력하지 마세요.
- API 키는 절대 클라이언트 측에 노출되지 않도록 `.env.local`에 보관합니다.

## MCP 서버 연동 가이드

### 1. MCP 서버 추가

1. 채팅 페이지 상단의 "MCP 서버" 버튼 클릭
2. "서버 추가" 버튼 클릭
3. Transport 타입 선택:
   - **HTTP**: Streamable HTTP 서버
   - **SSE**: Server-Sent Events 서버
   - **STDIO**: 로컬 프로세스 (Node.js, Python 등)
4. 필요한 정보 입력 후 저장

### 2. 서버 연결 및 테스트

1. 서버 카드에서 "연결" 버튼 클릭
2. 연결 성공 시 Tools/Prompts/Resources 자동 조회
3. "서버 관리" 버튼을 눌러 상세 정보 확인
4. Tools 탭에서 Tool 실행 테스트

### 3. 설정 가져오기/내보내기

- **내보내기**: JSON 파일로 모든 서버 설정 다운로드
- **가져오기**: 기존 JSON 파일에서 서버 설정 복원

### 예시: STDIO Transport

```bash
# Node.js MCP 서버 실행 예시
명령어: node
인자: server.js --port 3000
```

### 예시: HTTP Transport

```
URL: http://localhost:3000/mcp
```

## 배포

Vercel을 통한 배포를 권장합니다:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)

배포 시 환경 변수(`GEMINI_API_KEY`)를 설정하는 것을 잊지 마세요.

**주의**: STDIO Transport는 서버 환경에서 동작하지 않을 수 있습니다. HTTP/SSE Transport를 권장합니다.

## 라이선스

MIT
