# 📅 AI 콘텐츠 캘린더 생성기

채널 주제와 월을 입력하면 한 달치 업로드 스케줄과 영상 아이디어를 자동으로 생성해주는 AI 기반 콘텐츠 플래닝 도구입니다.

---

## 주요 기능

- **월간 캘린더 시각화** — 생성된 스케줄을 캘린더 그리드로 한눈에 확인
- **업로드 빈도 설정** — 주 1회부터 매일까지 원하는 빈도 선택
- **콘텐츠 유형 구분** — 롱폼 / 숏폼 / 혼합 선택, 색상으로 구분 표시
- **AI 운영 전략 제안** — 이달의 채널 운영 방향을 AI가 요약 제공
- **상세 스케줄 목록** — 날짜별 영상 제목 + 컨셉 설명 제공
- **한국어 에러 처리** — API 오류 시 친절한 한국어 메시지 + 재시도 버튼

---

## 기술 스택

| 구분 | 기술 |
|------|------|
| Frontend | React 19, Vite |
| AI | OpenRouter API (`google/gemma-4-31b-it:free`) |
| 스타일링 | CSS (라이트 테마, 커스텀 디자인) |
| 배포 | GitHub |

---

## 스크린샷

> 입력 폼 — 채널 주제와 업로드 설정 입력

![입력 폼](https://via.placeholder.com/800x400?text=Input+Form)

> 결과 화면 — 운영 전략 + 캘린더 + 상세 스케줄

![결과 화면](https://via.placeholder.com/800x600?text=Result+Calendar)

---

## 로컬 실행 방법

### 1. 저장소 클론

```bash
git clone https://github.com/yooona12/content-calendar.git
cd content-calendar
```

### 2. 패키지 설치

```bash
npm install
```

### 3. 환경변수 설정

`.env.example`을 복사해 `.env` 파일을 생성합니다.

```bash
cp .env.example .env
```

`.env` 파일에 OpenRouter API 키를 입력합니다.

```
VITE_OPENROUTER_API_KEY=your_openrouter_api_key_here
```

> OpenRouter API 키는 [openrouter.ai](https://openrouter.ai) 에서 무료로 발급받을 수 있습니다.

### 4. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 `http://localhost:5173` 접속

### 5. 빌드

```bash
npm run build
```

---

## 사용 방법

1. **연도 / 월** 선택
2. **업로드 빈도** 선택 (주 1회 ~ 매일)
3. **콘텐츠 유형** 선택 (롱폼 / 숏폼 / 혼합)
4. **채널 주제** 입력 (예: 30대 직장인을 위한 재테크, 비건 홈쿠킹)
5. **캘린더 생성** 버튼 클릭
6. AI가 생성한 월간 스케줄 확인

---

## 라이선스

MIT
