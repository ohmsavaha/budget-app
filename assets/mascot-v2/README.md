# 후마짜 마스코트 V2 · Phase 3 런타임

가계부 v129에서 후추·마요·짜장 V2 애니메이션을 안전하게 재생하는 경량 런타임입니다.

- `phase2a`: 숨쉬기·귀 씰룩·꼬리 살랑 등 기본 대기 동작
- `phase2b`: 걷기·달리기·점프/착지
- `phase2c`: 고개 갸웃·하품·하트·기쁨 등 반응 동작
- `phase2d`: 금액 입력·결제·공용통장·정산·고정비·흑자/적자
- `phase2e`: 구독·예산·무지출·투자·환불·비상금·부채 상환
- `phase2f`: 잠깨기·기지개·그루밍·놀이·빼꼼·탐색·기록·응원·그룹 상호작용
- `phase2g`: 고정비·빈 상태·재시도·동기화·수입·저축·이체·투자 점검·그룹 휴식

앱은 512px Animated WebP를 이벤트 발생 시에만 지연 로드합니다. 모션 감소 환경에서는 같은 동작의 128px 정적 첫 프레임으로 자동 전환합니다.
Phase 2F 생활 동작은 탭별 후보 중 하나만 25~45초 간격으로 재생되며, 모션 감소 환경과 숨겨진 탭에서는 자동 재생하지 않습니다.

## 호출

```js
window.dispatchEvent(new CustomEvent("budget-mascot", {
  detail: { action: "shared_deposit", character: "mayo" }
}));
```

또는:

```js
window.BudgetMascot.play({ action: "happy_hop" });
```

마스코트 자산이나 런타임의 실패는 거래 저장·합계 계산·Supabase 요청 결과에 영향을 주지 않습니다.
