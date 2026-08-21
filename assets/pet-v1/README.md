# 후추·마요·짜장 아기 고양이 육성 팩 v1

가계부의 기존 성묘 마스코트와 분리된 다마고치형 육성 기능입니다. v157부터 앱의 `🐾 육성` 탭에 연결됐고, v158에서 일일 돌봄·성장 앨범·발바닥 찾기 놀이, v159에서 고양이별 방 꾸미기와 XP 장난감 해금이 추가됐습니다. 육성 상태는 회계 데이터와 분리해 현재 기기의 `localStorage`에만 저장합니다.

## 포함 범위

- 캐릭터 3마리: 후추, 마요, 짜장
- 아기 상태 7종: `idle`, `eat`, `sleep`, `play`, `groom`, `sick`, `love`
- 상태마다 1024px 투명 PNG 원화, 512px 6프레임 WebP, 128px 정적 PNG
- 포만감·에너지·기분·청결·건강·친밀도 시간 경과
- 밥·잠·놀이·빗질·돌봄·쓰다듬기 행동과 개별 쿨다운
- 성장 XP, 아기→성묘 전환, 돌봄 연속일, 오프라인 진행(최대 24시간)
- 사망 없음, 다시 키우기 확인 토큰, 세대 기록
- 밥·놀이·쓰다듬기로 구성한 일일 돌봄 약속 3종
- 0·120·300·600·900·1200 XP 성장 추억 6단계
- 하루 3회 발바닥 찾기 놀이와 성공·실패별 성장 보상
- 배경·러그·침대·스크래처·장난감 5개 방 슬롯과 XP 단계별 해금
- 방 선택은 고양이별로 저장하며 실제 화폐·지출·Supabase와 연결하지 않음
- 모션 감소 환경의 정적 이미지 전환

## 파일 규칙

```text
source/{character}_baby_{state}_master_v01.png
webp/{character}_baby_{state}_512_v01.webp
static/{character}_baby_{state}_frame_01_v01.png
```

`character`는 `huchu`, `mayo`, `jjajang`이고 `state`는 위 7개 상태입니다. 합성 시트가 아니므로 모든 이미지를 독립적으로 사용할 수 있습니다.

## 독립 화면에 연결하는 최소 코드

```html
<link rel="stylesheet" href="./assets/pet-v1/pet-nursery.css">
<script src="./assets/pet-v1/pet-nursery.js"></script>
<script src="./assets/pet-v1/pet-nursery-view.js"></script>
<script src="./assets/pet-v1/pet-nursery-extras.js"></script>
<script src="./assets/pet-v1/pet-nursery-room.js"></script>
<div id="pet-room"></div>
<div id="pet-extras"></div>
<div id="pet-room-customizer"></div>
<script>
  const nursery = BudgetPetNurseryUI.mount(
    document.querySelector("#pet-room"),
    { character: "huchu" },
  );
  const extras = BudgetPetNurseryExtras.mount(
    document.querySelector("#pet-extras"),
    { character: "huchu" },
  );
  const room = BudgetPetNurseryRoom.mount(
    document.querySelector("#pet-room-customizer"),
    { character: "huchu", sceneRoot: nursery.root },
  );
</script>
```

## 안전 규칙

- 고양이 무대는 `.pet-nursery__safe-stage` 안에만 둡니다.
- 금액, 차트, 거래행, 입력 버튼 위에 고양이를 절대 겹치지 않습니다.
- 정보 → 조작 → 장식 순서를 유지합니다.
- 다시 키우기는 `getResetToken(character)`로 확인 문자열을 받은 뒤에만 실행합니다.
- 육성 수치는 실제 가계부 금액이나 Supabase 회계 데이터와 연결하지 않습니다.
- 방 꾸미기와 장난감은 XP로만 열리며 실제 결제나 소비 기록을 만들지 않습니다.
- 돌봄을 쉬어도 캐릭터가 사라지거나 죽지 않습니다.
- 성묘 단계의 기존 마스코트 인계 자산까지 서비스워커에 저장해 오프라인에서도 성장 결과를 표시합니다.
