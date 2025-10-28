<!-- ce507758-d01e-441c-b18f-e48993da326c 66c7156f-ba74-41e6-af1b-2a3c4f0ad7d9 -->
# AI 채팅 앱 구현 계획

## 1. 환경 설정

`.env.example` 파일 생성:

```
GEMINI_API_KEY=your_api_key_here
```

## 2. API Route 구현

`app/api/chat/route.ts` 생성:

- `@google/genai` 라이브러리의 `GoogleGenAI` 클래스를 사용해 클라이언트 초기화
- `generateContentStream` 메서드로 스트리밍 응답 처리
- SSE(Server-Sent Events) 형식으로 청크 단위 응답 전송
- 에러 처리 및 AbortController 지원

주요 코드 패턴:

```typescript
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const response = await ai.models.generateContentStream({
  model: 'gemini-2.0-flash-001',
  contents: message
});
```

## 3. 타입 정의

`lib/types.ts` 생성:

- `Message` 타입: id, role(user/assistant), content, timestamp
- localStorage 저장을 위한 타입 정의

## 4. localStorage 유틸리티

`lib/storage.ts` 생성:

- 채팅 내역 저장: `saveChatHistory(messages: Message[])`
- 채팅 내역 로드: `loadChatHistory(): Message[]`
- 브라우저 환경 체크 및 에러 처리

## 5. 채팅 UI 컴포넌트

`app/page.tsx` 전면 수정:

- 레이아웃: 상단 헤더 + 채팅 타임라인 + 하단 입력창
- shadcn/ui 컴포넌트 사용: `Card`, `Input`, `Button`, `ScrollArea`
- Lucide 아이콘: `Send`, `User`, `Bot`
- 메시지 버블: 유저(오른쪽)/AI(왼쪽) 구분
- 스트리밍 중 로딩 인디케이터
- localStorage에서 초기 내역 로드 및 자동 저장

주요 상태 관리:

```typescript
const [messages, setMessages] = useState<Message[]>([]);
const [input, setInput] = useState('');
const [isLoading, setIsLoading] = useState(false);
```

## 6. 스트리밍 처리 로직

- `fetch('/api/chat', { method: 'POST' })` 호출
- ReadableStream을 통한 SSE 청크 읽기
- 실시간으로 메시지 상태 업데이트
- 스크롤 자동 하단 이동

## 7. 보안 배너

공용 PC 사용 시 주의 메시지를 상단에 표시 (dismissable)

## 8. 마크다운 렌더링 (Phase 2)

### 8.1 Streamdown 패키지

**설치**: `pnpm add streamdown`

Streamdown은 AI 스트리밍 콘텐츠 전용 마크다운 렌더러:
- 불완전한 마크다운 블록 자동 완성 (`parseIncompleteMarkdown`)
- 코드 하이라이팅 (Shiki 내장)
- 코드 블록 복사 버튼 (`controls` prop)
- GFM(GitHub Flavored Markdown) 지원
- 수학 수식 (KaTeX)
- Mermaid 다이어그램

### 8.2 Tailwind CSS 설정

`app/globals.css`에 Streamdown 스타일 추가:
```css
@source "../node_modules/streamdown/dist/index.js";
```

### 8.3 MarkdownRenderer 컴포넌트

`components/markdown-renderer.tsx`:
```tsx
import { Streamdown } from 'streamdown';

export function MarkdownRenderer({ content, isStreaming }: Props) {
  return (
    <div className="prose prose-sm max-w-none dark:prose-invert">
      <Streamdown
        parseIncompleteMarkdown={true}
        isAnimating={isStreaming}
        controls={true}
        shikiTheme={['github-light-default', 'github-dark-default']}
      >
        {content}
      </Streamdown>
    </div>
  );
}
```

### 8.4 채팅 UI 통합

- Assistant 메시지에 `<MarkdownRenderer>` 적용
- User 메시지는 일반 텍스트 유지
- 스트리밍 상태 전달

## 구현 순서

### To-dos

#### Phase 1 (완료)
- [x] .env.example 파일 생성 및 환경 변수 템플릿 작성
- [x] lib/types.ts에 Message 타입 정의
- [x] lib/storage.ts에 localStorage 유틸리티 구현
- [x] app/api/chat/route.ts에 스트리밍 API Route 구현
- [x] app/page.tsx를 채팅 UI로 전면 수정

#### Phase 2 (완료)
- [x] streamdown 패키지 설치
- [x] app/globals.css에 Streamdown 스타일 추가
- [x] components/markdown-renderer.tsx 컴포넌트 생성
- [x] app/page.tsx에 마크다운 렌더링 통합

#### Phase 3 (완료)
- [x] @modelcontextprotocol/sdk 패키지 설치
- [x] lib/types.ts에 MCP 타입 추가
- [x] lib/mcp-storage.ts MCP Storage 유틸리티 구현
- [x] lib/mcp-client-manager.ts MCP Client Manager 구현 (싱글톤)
- [x] app/api/mcp/* API Routes 구현 (서버 관리, Tools, Prompts, Resources)
- [x] contexts/mcp-context.tsx Context 구현 (전역 상태 관리)
- [x] app/layout.tsx에 MCPProvider 추가
- [x] components/mcp-server-form.tsx 서버 추가 폼 구현
- [x] components/mcp-server-card.tsx 서버 카드 컴포넌트 구현
- [x] components/mcp-tool-tester.tsx Tool 테스터 컴포넌트 구현
- [x] app/mcp/page.tsx MCP 관리 페이지 구현
- [x] app/page.tsx에 MCP 서버 링크 추가
- [x] README.md 문서화 업데이트

#### Phase 4 (완료)
- [x] lib/types.ts에 ChatSession 타입 추가
- [x] lib/storage.ts 세션 관리 기능 확장 (CRUD, 마이그레이션)
- [x] contexts/chat-context.tsx 구현 (전역 세션 상태 관리)
- [x] app/api/chat/title/route.ts 제목 생성 API 구현
- [x] components/chat-session-item.tsx 세션 아이템 컴포넌트 구현
- [x] components/chat-sidebar.tsx 사이드바 컴포넌트 구현
- [x] app/page.tsx 레이아웃 재구성 (사이드바 + 메인, 반응형)
- [x] app/layout.tsx에 ChatProvider 추가
- [x] 레거시 채팅 데이터 자동 마이그레이션 로직
- [x] README.md 문서화 업데이트