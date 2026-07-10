# 📲 iOS 단축어 연동 — 스크린샷 공유하면 자동 등록 (설치 5분)

카드앱에서 이용내역 스크린샷 → **공유 버튼 → "가계부에 추가"** 탭 → AI가 알아서 추출·등록.
앱을 열 필요도 없어요. 등록된 건 앱에서 `#단축어입력` 으로 검색해 카테고리만 확인하면 끝.

---

## 1단계. Supabase에 서버 함수 만들기 (PC에서, 1회)

1. https://supabase.com/dashboard → 내 프로젝트(axlxdkybghxcltilsqgj) 로그인
2. 왼쪽 메뉴 **Edge Functions** → **Create a new function** → 이름: `quick-import`
3. 이 폴더의 `quick-import-edge-function.ts` 내용을 **전부 복사해서 붙여넣기** → **Deploy**
4. 함수 상세 화면에서 **"Enforce JWT verification" 을 꺼주세요** (우리는 자체 토큰을 써요)

## 2단계. 비밀값 3개 등록 (1회)

Edge Functions → **Secrets** (또는 Settings → Edge Functions)에서 추가:

| 이름 | 값 |
|---|---|
| `ANTHROPIC_API_KEY` | 앱 설정→고급에 넣은 것과 같은 API 키 (sk-ant-…) |
| `IMPORT_TOKEN` | 아무 긴 비밀 문자열 (예: 아무렇게나 30자) — 3단계에서 똑같이 씀 |
| `OWNER_USER_ID` | `0b0ec254-e366-4f52-a6c3-60546a023372` (정근 계정 ID) |

※ `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` 는 Supabase가 자동으로 넣어줘요.

## 3단계. 아이폰 단축어 만들기 (1회)

단축어 앱 → **+** 새 단축어 → 이름 "가계부에 추가" → 아래 순서로 동작 추가:

1. **(설정 ⓘ 탭)** "공유 시트에 표시" 켜기 → 받는 유형: **이미지**만 체크
2. 동작 추가: **Base64 인코딩** (입력: 단축어 입력)
3. 동작 추가: **URL 콘텐츠 가져오기**
   - URL: `https://axlxdkybghxcltilsqgj.supabase.co/functions/v1/quick-import`
   - 방법: **POST** / 요청 본문: **JSON**
     - `image_b64` = (2번의 Base64 인코딩된 텍스트)
     - `media_type` = `image/png`
   - 헤더: `x-import-token` = (2단계에서 정한 IMPORT_TOKEN 값)
4. 동작 추가: **알림 표시** → 내용: (URL 콘텐츠 결과의) `msg`

## 사용법

카드앱/토스/뱅샐 어디서든 이용내역 화면 스크린샷 → 사진에서 **공유** → **가계부에 추가** → 몇 초 뒤 "✅ N건 등록" 알림. 끝!

- 중복(같은 날·금액·가맹점)은 자동으로 건너뛰어요
- 등록된 거래는 카테고리가 "기타"로 들어와요 → 앱에서 `#단축어입력` 검색해서 카테고리만 손봐주세요
- 취소된 거래·합계 줄은 자동 제외

## 문제 생기면

- "unauthorized" → 단축어 헤더의 토큰과 Supabase Secrets의 IMPORT_TOKEN이 다른 것
- "AI 호출 실패" → ANTHROPIC_API_KEY 확인
- 아무 반응 없음 → 1단계 4번 (JWT 검증 끄기) 확인
