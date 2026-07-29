const ROOT = "./assets/mascot-v2";
const CHARACTERS = new Set(["huchu", "mayo", "jjajang", "group"]);
const REDUCED_MOTION = window.matchMedia("(prefers-reduced-motion: reduce)");
const ENABLED_KEY = "mascot_v2_enabled";

const PHASE_ACTIONS = Object.freeze({
  phase2k: new Set([
    "fixed_plan_saved", "fixed_plan_updated", "fixed_archived",
    "fixed_reactivated", "shared_fixed_saved", "expense_excluded",
    "transaction_corrected", "networth_goal", "investment_note",
    "market_refresh", "portfolio_repaired", "classification_rule_saved",
    "fixed_schedule_adjusted", "investment_trade_logged",
    "group_fixed_plan", "group_goal_map",
  ]),
  phase2i: new Set([
    "shopping_item_add", "purchase_complete", "repurchase_pick",
    "product_register", "price_record", "price_compare",
    "loan_plan", "loan_progress", "savings_maturity", "account_link",
    "investment_snapshot", "holding_add", "shared_plan_saved",
    "split_created", "group_shopping_plan", "group_household_inventory",
  ]),
  phase2h: new Set([
    "month_close", "backup_complete", "restore_complete",
    "notification_ready", "card_bill_review", "installment_plan",
    "duplicate_review", "import_review", "goal_achieved",
    "account_balance_check", "recurring_found", "annual_review",
    "report_share", "calendar_export", "group_month_review",
    "group_plan_next",
  ]),
  phase2g: new Set([
    "fixed_due_check", "autopay_confirm", "monthly_fixed_complete",
    "search_no_results", "history_empty", "calendar_empty",
    "retry_calm", "sync_success", "income_received", "savings_progress",
    "transfer_complete", "investment_review", "investment_diversify",
    "market_shelter", "group_highfive", "group_rest",
  ]),
  phase2f: new Set([
    "wake_up", "stretch", "yawn", "face_groom", "body_groom",
    "tail_chase", "yarn_play", "box_enter", "card_peek", "call_owner",
    "head_tilt", "explore", "focus_record", "encourage",
    "group_cuddle", "group_ball_play",
  ]),
  phase2a: new Set(["blink", "breathe", "ear_twitch", "tail_sway"]),
  phase2b: new Set(["walk", "run", "jump_land"]),
  phase2c: new Set([
    "head_tilt", "look_around", "yawn", "doze_wake", "paw_tap",
    "paw_wave", "send_heart", "happy_hop", "body_shake",
  ]),
  phase2d: new Set([
    "amount_entry", "card_payment", "cash_payment", "shared_deposit",
    "shared_withdrawal", "split_bill", "joint_settlement", "fixed_cost",
    "budget_warning", "savings_mode", "surplus", "deficit_support",
  ]),
  phase2e: new Set([
    "subscription_payment", "card_bill_worry", "budget_set",
    "budget_exceeded", "no_spend_day", "impulse_stop", "investment_up",
    "investment_down", "dividend_interest", "networth_record", "refund",
    "lowest_price", "emergency_fund", "debt_payoff",
  ]),
});

const AMBIENT_BY_TAB = Object.freeze({
  home: [
    { character: "mayo", action: "face_groom", message: "마요가 잠깐 세수를 하며 쉬고 있어요." },
    { character: "huchu", action: "head_tilt", message: "후추가 이번 달 기록을 궁금하게 바라봐요." },
    { character: "jjajang", action: "encourage", message: "짜장이 오늘 기록도 잘하고 있다고 응원해요." },
    { character: "group", action: "group_rest", message: "세 마리가 기록 곁에서 잠깐 함께 쉬고 있어요." },
  ],
  spend: [
    { character: "huchu", action: "focus_record", message: "후추가 새 지출을 빠짐없이 기록하고 있어요." },
    { character: "mayo", action: "body_groom", message: "마요가 기록 사이에 잠깐 몸단장을 해요." },
    { character: "huchu", action: "card_bill_review", message: "후추가 카드 청구 내용을 차분히 살펴봐요." },
    { character: "group", action: "group_shopping_plan", message: "세 마리가 장바구니 계획을 함께 살펴봐요." },
  ],
  shared: [
    { character: "group", action: "group_cuddle", message: "세 마리가 공용통장 기록을 함께 지키고 있어요." },
    { character: "mayo", action: "card_peek", message: "마요가 공용 내역 카드 뒤에서 살펴봐요." },
  ],
  assets: [
    { character: "huchu", action: "explore", message: "후추가 자산 변화를 차근차근 탐색해요." },
    { character: "jjajang", action: "head_tilt", message: "짜장이 자산 흐름을 유심히 바라봐요." },
    { character: "huchu", action: "account_balance_check", message: "후추가 계좌 잔액을 하나씩 대조해요." },
    { character: "group", action: "group_goal_map", message: "세 마리가 자산 목표로 가는 길을 함께 정리해요." },
  ],
  calendar: [
    { character: "mayo", action: "focus_record", message: "마요가 날짜별 기록을 하나씩 정리해요." },
    { character: "huchu", action: "card_peek", message: "후추가 달력 카드 뒤에서 빼꼼 바라봐요." },
  ],
  fixed: [
    { character: "mayo", action: "focus_record", message: "마요가 고정비 납부 기록을 확인해요." },
    { character: "jjajang", action: "encourage", message: "짜장이 이번 달 고정비 관리도 응원해요." },
    { character: "mayo", action: "fixed_due_check", message: "마요가 다가오는 고정비 예정일을 살펴봐요." },
    { character: "huchu", action: "recurring_found", message: "후추가 반복되는 결제 기록을 확인해요." },
    { character: "group", action: "group_fixed_plan", message: "세 마리가 반복되는 고정비 계획을 함께 맞춰봐요." },
  ],
  invest: [
    { character: "huchu", action: "explore", message: "후추가 투자 흐름을 성급하지 않게 살펴봐요." },
    { character: "mayo", action: "head_tilt", message: "마요가 투자 변화를 차분히 바라봐요." },
    { character: "huchu", action: "investment_review", message: "후추가 투자 구성을 차분히 점검해요." },
    { character: "mayo", action: "investment_diversify", message: "마요가 자산이 한곳에 몰리지 않았는지 살펴봐요." },
  ],
  yearly: [
    { character: "group", action: "group_cuddle", message: "세 마리가 올해 쌓아온 기록을 함께 보고 있어요." },
    { character: "jjajang", action: "encourage", message: "짜장이 꾸준히 이어온 한 해를 응원해요." },
    { character: "jjajang", action: "annual_review", message: "짜장이 열두 달 기록을 차분히 돌아봐요." },
  ],
  db: [
    { character: "huchu", action: "explore", message: "후추가 우리집 품목과 가격 기록을 찾아봐요." },
    { character: "jjajang", action: "box_enter", message: "짜장이 보관 품목 상자 안을 살펴봐요." },
    { character: "group", action: "group_household_inventory", message: "세 마리가 우리집 품목을 함께 정리해요." },
  ],
});

const IDLE_BY_TAB = Object.freeze({
  home: { character: "mayo", action: "breathe", message: "마요가 이번 달 가계부를 차분히 살펴보고 있어요." },
  spend: { character: "huchu", action: "ear_twitch", message: "후추가 새 지출과 예산 변화를 놓치지 않고 있어요." },
  shared: { character: "mayo", action: "tail_sway", message: "마요가 공용통장과 공동정산을 함께 확인하고 있어요." },
  assets: { character: "jjajang", action: "breathe", message: "짜장이 자산과 저축 목표를 든든하게 지키고 있어요." },
  calendar: { character: "mayo", action: "ear_twitch", message: "마요가 날짜별 기록을 하나씩 확인하고 있어요." },
  fixed: { character: "mayo", action: "tail_sway", message: "마요가 이번 달 고정비 납부 상태를 챙기고 있어요." },
  invest: { character: "jjajang", action: "tail_sway", message: "짜장이 투자 흐름을 너무 들뜨지 않고 지켜보고 있어요." },
  yearly: { character: "jjajang", action: "breathe", message: "짜장이 올해의 변화와 성과를 한눈에 보고 있어요." },
  db: { character: "huchu", action: "ear_twitch", message: "후추가 우리집 품목과 최저가 기록을 찾고 있어요." },
});

const PREFERRED_CHARACTER = Object.freeze({
  fixed_plan_saved: "huchu",
  fixed_plan_updated: "mayo",
  fixed_archived: "huchu",
  fixed_reactivated: "jjajang",
  shared_fixed_saved: "mayo",
  expense_excluded: "huchu",
  transaction_corrected: "mayo",
  networth_goal: "jjajang",
  investment_note: "mayo",
  market_refresh: "huchu",
  portfolio_repaired: "jjajang",
  classification_rule_saved: "huchu",
  fixed_schedule_adjusted: "mayo",
  investment_trade_logged: "jjajang",
  group_fixed_plan: "group",
  group_goal_map: "group",
  shopping_item_add: "huchu",
  purchase_complete: "jjajang",
  repurchase_pick: "mayo",
  product_register: "mayo",
  price_record: "huchu",
  price_compare: "jjajang",
  loan_plan: "huchu",
  loan_progress: "mayo",
  savings_maturity: "jjajang",
  account_link: "mayo",
  investment_snapshot: "jjajang",
  holding_add: "huchu",
  shared_plan_saved: "mayo",
  split_created: "jjajang",
  group_shopping_plan: "group",
  group_household_inventory: "group",
  month_close: "jjajang",
  backup_complete: "huchu",
  restore_complete: "mayo",
  notification_ready: "mayo",
  card_bill_review: "huchu",
  installment_plan: "mayo",
  duplicate_review: "huchu",
  import_review: "mayo",
  goal_achieved: "jjajang",
  account_balance_check: "huchu",
  recurring_found: "huchu",
  annual_review: "jjajang",
  report_share: "mayo",
  calendar_export: "mayo",
  group_month_review: "group",
  group_plan_next: "group",
  fixed_due_check: "mayo",
  autopay_confirm: "huchu",
  monthly_fixed_complete: "jjajang",
  search_no_results: "huchu",
  history_empty: "mayo",
  calendar_empty: "mayo",
  retry_calm: "mayo",
  sync_success: "huchu",
  income_received: "mayo",
  savings_progress: "jjajang",
  transfer_complete: "huchu",
  investment_review: "huchu",
  investment_diversify: "mayo",
  market_shelter: "mayo",
  group_highfive: "group",
  group_rest: "group",
  wake_up: "mayo",
  stretch: "huchu",
  face_groom: "mayo",
  body_groom: "mayo",
  tail_chase: "jjajang",
  yarn_play: "jjajang",
  box_enter: "huchu",
  card_peek: "huchu",
  call_owner: "jjajang",
  explore: "huchu",
  focus_record: "mayo",
  encourage: "jjajang",
  group_cuddle: "group",
  group_ball_play: "group",
  amount_entry: "huchu",
  card_payment: "huchu",
  cash_payment: "mayo",
  shared_deposit: "mayo",
  shared_withdrawal: "mayo",
  split_bill: "huchu",
  joint_settlement: "mayo",
  fixed_cost: "mayo",
  budget_warning: "huchu",
  savings_mode: "jjajang",
  surplus: "jjajang",
  deficit_support: "mayo",
  subscription_payment: "huchu",
  card_bill_worry: "huchu",
  budget_set: "huchu",
  budget_exceeded: "huchu",
  no_spend_day: "jjajang",
  impulse_stop: "jjajang",
  investment_up: "mayo",
  investment_down: "mayo",
  dividend_interest: "mayo",
  networth_record: "mayo",
  refund: "jjajang",
  lowest_price: "jjajang",
  emergency_fund: "mayo",
  debt_payoff: "jjajang",
  head_tilt: "huchu",
  look_around: "huchu",
  yawn: "mayo",
  doze_wake: "mayo",
  paw_tap: "huchu",
  paw_wave: "mayo",
  send_heart: "mayo",
  happy_hop: "jjajang",
  body_shake: "jjajang",
  walk: "mayo",
  run: "huchu",
  jump_land: "jjajang",
});

const ACTION_COPY = Object.freeze({
  fixed_plan_saved: ["고정비 계획 저장", "새 고정비의 금액과 납부일을 계획에 넣었어요.", "good"],
  fixed_plan_updated: ["고정비 계획 수정", "바뀐 금액과 결제 정보를 최신 상태로 맞췄어요.", "good"],
  fixed_archived: ["고정비 보관", "지금은 쓰지 않는 고정비를 나중에 다시 찾을 수 있게 보관했어요.", "neutral"],
  fixed_reactivated: ["고정비 다시 활성화", "보관했던 고정비를 이번 달 계획에 다시 넣었어요.", "good"],
  shared_fixed_saved: ["공용 고정비 저장", "함께 부담할 고정비와 결제 방법을 저장했어요.", "good"],
  expense_excluded: ["소비 합계에서 제외", "이체나 충전처럼 실제 소비가 아닌 기록을 합계에서 뺐어요.", "neutral"],
  transaction_corrected: ["거래 수정 완료", "날짜·금액·계정·결제수단을 바뀐 내용으로 맞췄어요.", "good"],
  networth_goal: ["순자산 목표 설정", "현재 자산에서 목표까지 갈 기준점을 세웠어요.", "good"],
  investment_note: ["투자 판단 기록", "매수·매도 이유와 생각을 나중에 복기할 수 있게 남겼어요.", "neutral"],
  market_refresh: ["시세 새로고침 완료", "현재 환율과 시세로 투자 평가액을 다시 맞췄어요.", "good"],
  portfolio_repaired: ["포트폴리오 값 교정", "비정상 평가액을 현재가와 환율 기준으로 바로잡았어요.", "good"],
  classification_rule_saved: ["분류 규칙 저장", "같은 사용처를 다음부터 더 정확히 자동 분류할 수 있어요.", "good"],
  fixed_schedule_adjusted: ["고정비 일정 조정", "납부 주기나 공용 부담 비율을 새 계획에 맞췄어요.", "good"],
  investment_trade_logged: ["투자 거래 기록", "보유 수량 변화를 매수·매도 일지로 자동 기록했어요.", "neutral"],
  group_fixed_plan: ["함께 고정비 계획", "세 마리가 공용 고정비와 반복 일정을 함께 확인해요.", "neutral"],
  group_goal_map: ["함께 목표 지도", "세 마리가 여러 자산 목표로 가는 길을 함께 정리해요.", "neutral"],
  shopping_item_add: ["장바구니에 담았어요", "살 품목과 예상 금액을 장보기 계획에 추가했어요.", "good"],
  purchase_complete: ["구매 완료", "실제 구매 금액과 구입처를 장바구니 기록에 남겼어요.", "good"],
  repurchase_pick: ["재구매 품목 저장", "다시 사고 싶은 품목을 가성비 픽으로 표시했어요.", "good"],
  product_register: ["품목 등록 완료", "우리집 가격사전에 새 품목을 등록했어요.", "good"],
  price_record: ["가격 기록 추가", "구입처와 가격을 다음 비교에 쓸 수 있게 남겼어요.", "good"],
  price_compare: ["가격 비교 준비", "두 곳 이상의 가격을 모아 더 좋은 선택을 비교할 수 있어요.", "neutral"],
  loan_plan: ["대출 계획 등록", "원금·금리·상환액을 한곳에서 볼 수 있게 정리했어요.", "neutral"],
  loan_progress: ["대출 상환 진척", "줄어든 대출 잔액을 자산 기록에 반영했어요.", "good"],
  savings_maturity: ["저축 만기 기록", "만기일과 예상 수령액을 확인할 수 있게 저장했어요.", "good"],
  account_link: ["카드 계좌 연결", "카드 대금이 빠지는 계좌를 연결했어요.", "good"],
  investment_snapshot: ["투자 현황 저장", "오늘의 평가액과 손익을 스냅샷으로 남겼어요.", "neutral"],
  holding_add: ["보유 종목 추가", "새 종목과 수량을 투자 계산 목록에 넣었어요.", "good"],
  shared_plan_saved: ["공용 계획 저장", "함께 쓸 예산과 부담 비율을 저장했어요.", "good"],
  split_created: ["나눠내기 생성", "총 결제액과 내 몫, 받을 돈을 나눠 기록했어요.", "good"],
  group_shopping_plan: ["함께 장보기 계획", "세 마리가 여러 품목의 장보기 계획을 함께 확인해요.", "neutral"],
  group_household_inventory: ["함께 품목 정리", "세 마리가 우리집 품목과 가격 기록을 나란히 살펴봐요.", "neutral"],
  month_close: ["이번 달 마감 완료", "이번 달 기록을 안전하게 결산으로 남겼어요.", "good"],
  backup_complete: ["전체 백업 완료", "거래와 설정을 다시 꺼낼 수 있는 파일로 저장했어요.", "good"],
  restore_complete: ["공유 기록 복구 완료", "빠져 있던 공용 기록 연결을 다시 맞췄어요.", "good"],
  notification_ready: ["알림 준비 완료", "선택한 결제일과 예산 알림을 받을 준비가 됐어요.", "good"],
  card_bill_review: ["카드 청구 확인", "명세서의 실제 청구액을 기록에 반영했어요.", "neutral"],
  installment_plan: ["할부 계획 기록", "나눠 낼 금액과 기간을 차분히 기록했어요.", "neutral"],
  duplicate_review: ["중복 기록 점검", "비슷한 거래를 비교해 필요한 항목만 남길 수 있어요.", "neutral"],
  import_review: ["가져온 기록 확인", "중복을 걸러낸 거래를 검토하고 안전하게 저장했어요.", "good"],
  goal_achieved: ["저축 목표 달성", "꾸준히 모은 금액이 드디어 목표에 닿았어요!", "good"],
  account_balance_check: ["계좌 잔액 확인", "바뀐 계좌 잔액을 자산 기록에 반영했어요.", "neutral"],
  recurring_found: ["반복 결제 발견", "매달 비슷하게 나가는 기록을 고정비로 정리했어요.", "neutral"],
  annual_review: ["한 해 기록 점검", "열두 달의 흐름을 차분히 돌아보고 있어요.", "neutral"],
  report_share: ["결산표 복사 완료", "월 결산을 메모나 문서에 옮길 준비가 됐어요.", "good"],
  calendar_export: ["결제일 내보내기 완료", "결제일 일정을 캘린더에 추가할 수 있게 만들었어요.", "good"],
  group_month_review: ["함께 월 결산", "세 마리가 이번 달 기록을 나란히 검토해요.", "neutral"],
  group_plan_next: ["다음 달 준비", "이번 달을 닫고 다음 달 계획을 함께 시작해요.", "good"],
  fixed_due_check: ["고정비 예정 확인", "다가오는 납부일과 금액을 미리 살펴봤어요.", "neutral"],
  autopay_confirm: ["자동이체 확인", "자동이체로 납부된 고정비를 확인했어요.", "good"],
  monthly_fixed_complete: ["이번 달 고정비 완료", "이번 달 고정비 납부를 모두 정리했어요.", "good"],
  search_no_results: ["검색 결과 없음", "일치하는 기록이 없어요. 검색어나 필터를 바꿔볼까요?", "neutral"],
  history_empty: ["아직 기록이 없어요", "첫 기록을 남기면 이곳에서 흐름을 함께 볼 수 있어요.", "neutral"],
  calendar_empty: ["기록 없는 날짜", "이 날짜에는 기록이 없어요. 쉬어간 날이어도 괜찮아요.", "neutral"],
  retry_calm: ["다시 시도해 주세요", "기록은 보존했어요. 연결을 확인하고 다시 시도해 주세요.", "warn"],
  sync_success: ["기록 동기화 완료", "개인·공용 기록을 최신 상태로 맞췄어요.", "good"],
  income_received: ["수입 기록 완료", "들어온 금액을 빠짐없이 기록했어요.", "good"],
  savings_progress: ["저축 목표 한 걸음", "작은 금액도 목표를 향한 분명한 전진이에요.", "good"],
  transfer_complete: ["계좌 이동 완료", "옮긴 금액을 두 계좌에 정확히 반영했어요.", "good"],
  investment_review: ["투자 구성 점검", "등락보다 계획과 자산 비중을 먼저 살펴봐요.", "neutral"],
  investment_diversify: ["자산 배분 확인", "한곳에 몰리지 않았는지 차분히 점검했어요.", "neutral"],
  market_shelter: ["변동이 큰 날이에요", "급하게 판단하지 말고 계획과 비중부터 확인해요.", "warn"],
  group_highfive: ["함께 목표 완료", "함께 관리한 기록을 세 마리가 축하해요.", "good"],
  group_rest: ["잠깐 함께 쉬어요", "기록은 안전하게 남았으니 잠깐 쉬어가도 좋아요.", "neutral"],
  wake_up: ["오늘 기록 시작", "마요가 천천히 일어나 가계부를 함께 열었어요.", "neutral"],
  stretch: ["잠깐 기지개", "오래 머물렀다면 어깨도 한 번 가볍게 펴주세요.", "neutral"],
  yawn: ["늦은 시간이에요", "기록은 저장됐으니 무리하지 말고 쉬어가도 좋아요.", "neutral"],
  face_groom: ["잠깐 쉬는 중", "마요가 세수를 하며 다음 기록을 기다려요.", "neutral"],
  body_groom: ["차분한 정리", "기록 사이에 잠깐 몸단장을 하고 있어요.", "neutral"],
  tail_chase: ["놀이 시간", "짜장이 자기 꼬리를 발견하고 신나게 놀아요.", "neutral"],
  yarn_play: ["털실 놀이", "짜장이 털실을 굴리며 잠깐 쉬고 있어요.", "neutral"],
  box_enter: ["상자 탐색", "후추가 보관할 품목이 있는지 상자를 살펴봐요.", "neutral"],
  card_peek: ["기록 살펴보기", "카드 뒤에서 새 내역을 조심스럽게 확인해요.", "neutral"],
  call_owner: ["집사 기다리는 중", "기록할 일이 생기면 언제든 다시 불러주세요.", "neutral"],
  head_tilt: ["궁금한 기록", "후추가 숫자의 변화를 유심히 바라보고 있어요.", "neutral"],
  explore: ["차근차근 탐색", "후추가 필요한 기록을 하나씩 찾아보고 있어요.", "neutral"],
  focus_record: ["입력에 집중", "마요가 지금 입력하는 내용을 함께 기록하고 있어요.", "neutral"],
  encourage: ["잘하고 있어요", "작은 기록도 이어지면 분명한 변화가 돼요.", "good"],
  group_cuddle: ["함께 정리 완료", "세 마리가 함께 관리한 기록을 나란히 확인해요.", "good"],
  group_ball_play: ["잠깐 놀이", "세 마리가 공을 굴리며 잠깐 쉬고 있어요.", "neutral"],
  amount_entry: ["금액 입력 완료", "후추가 입력한 금액을 확인했어요.", "good"],
  card_payment: ["카드 결제 기록 완료", "카드 결제 내역이 안전하게 저장됐어요.", "good"],
  cash_payment: ["현금 결제 기록 완료", "현금으로 쓴 금액까지 빠짐없이 기록했어요.", "good"],
  shared_deposit: ["공용통장 입금 완료", "함께 쓸 생활비가 공용통장에 들어왔어요.", "good"],
  shared_withdrawal: ["공용 지출 기록 완료", "공용비용으로 나간 금액을 정확히 남겼어요.", "good"],
  split_bill: ["더치페이 계산 완료", "내 몫과 받을 돈을 나눠 기록했어요.", "good"],
  joint_settlement: ["공동정산 완료", "받을 돈과 계좌 잔액까지 정리됐어요.", "good"],
  fixed_cost: ["고정비 납부 확인", "이번 달 고정비 하나를 깔끔하게 체크했어요.", "good"],
  budget_warning: ["예산 확인", "예산을 넘기기 전에 남은 금액을 확인해봐요.", "warn"],
  budget_exceeded: ["예산 초과 확인", "괜찮아요. 남은 기간의 지출 계획부터 다시 잡아봐요.", "warn"],
  savings_mode: ["절약모드 시작", "작은 절약도 모이면 분명한 변화가 돼요.", "good"],
  surplus: ["이번 달 흑자", "남은 돈을 지켜낸 걸 짜장이 크게 축하해요!", "good"],
  deficit_support: ["이번 달 점검", "자책하지 말고 큰 지출부터 하나씩 정리해봐요.", "warn"],
  subscription_payment: ["구독 결제 확인", "반복 결제를 확인하고 다음 결제일까지 기록했어요.", "good"],
  card_bill_worry: ["카드대금 점검", "청구 예정액을 보고 납부 계획을 미리 세워봐요.", "warn"],
  budget_set: ["예산 설정 완료", "이번 달에 지킬 기준이 생겼어요.", "good"],
  no_spend_day: ["무지출데이 달성", "오늘은 지출 없이 잘 지켜냈어요!", "good"],
  impulse_stop: ["충동지출 방어", "잠깐 멈춘 선택이 예산을 지켜줬어요.", "good"],
  investment_up: ["투자 상승 기록", "오른 날도 들뜨지 않고 기록으로 남겼어요.", "good"],
  investment_down: ["투자 하락 확인", "내려간 날도 계획과 비중부터 차분히 확인해요.", "warn"],
  dividend_interest: ["배당·이자 기록", "자산이 만든 수입을 빠짐없이 기록했어요.", "good"],
  networth_record: ["순자산 최고 기록", "꾸준히 쌓아온 변화가 새 기록이 됐어요!", "good"],
  refund: ["환불·취소 기록 완료", "돌아온 금액을 소비에서 정확히 반영했어요.", "good"],
  lowest_price: ["최저가 발견", "후추가 더 좋은 가격 기록을 찾았어요.", "good"],
  emergency_fund: ["비상금 업데이트", "갑작스러운 지출을 버틸 안전망이 더 단단해졌어요.", "good"],
  debt_payoff: ["부채 상환 완료", "하나의 부담을 끝까지 정리해냈어요.", "good"],
  paw_tap: ["입력 확인", "필수 항목을 한 번만 더 확인해 주세요.", "warn"],
  send_heart: ["함께해서 든든해요", "공용정산과 저축을 함께 이어가고 있어요.", "good"],
  happy_hop: ["목표 달성", "짜장이 기쁨을 참지 못하고 폴짝 뛰었어요!", "good"],
});

const PRIORITY = Object.freeze({
  fixed_plan_saved: 4,
  fixed_plan_updated: 4,
  fixed_archived: 3,
  fixed_reactivated: 4,
  shared_fixed_saved: 4,
  expense_excluded: 3,
  transaction_corrected: 3,
  networth_goal: 4,
  investment_note: 3,
  market_refresh: 4,
  portfolio_repaired: 5,
  classification_rule_saved: 4,
  fixed_schedule_adjusted: 3,
  investment_trade_logged: 4,
  group_fixed_plan: 3,
  group_goal_map: 3,
  purchase_complete: 4,
  shared_plan_saved: 4,
  split_created: 4,
  loan_progress: 4,
  savings_maturity: 4,
  account_link: 3,
  investment_snapshot: 3,
  holding_add: 3,
  shopping_item_add: 3,
  repurchase_pick: 3,
  product_register: 3,
  price_record: 3,
  price_compare: 3,
  loan_plan: 3,
  group_shopping_plan: 3,
  group_household_inventory: 2,
  backup_complete: 5,
  restore_complete: 5,
  notification_ready: 4,
  month_close: 4,
  goal_achieved: 4,
  group_plan_next: 4,
  import_review: 4,
  calendar_export: 3,
  report_share: 3,
  card_bill_review: 3,
  installment_plan: 3,
  duplicate_review: 3,
  account_balance_check: 3,
  recurring_found: 3,
  annual_review: 3,
  group_month_review: 3,
  retry_calm: 5,
  market_shelter: 5,
  sync_success: 4,
  monthly_fixed_complete: 4,
  group_highfive: 4,
  income_received: 3,
  transfer_complete: 3,
  savings_progress: 3,
  paw_tap: 5,
  budget_exceeded: 5,
  budget_warning: 5,
  card_bill_worry: 4,
  deficit_support: 4,
  joint_settlement: 4,
  debt_payoff: 4,
  surplus: 4,
  refund: 4,
  happy_hop: 4,
});

let timer = 0;
let ambientTimer = 0;
let activePriority = -1;
let lastStage = null;
let lastAmbient = "";
let lastInputFocusAt = 0;

function isEnabled() {
  return localStorage.getItem(ENABLED_KEY) !== "0";
}

function phaseFor(action) {
  return Object.keys(PHASE_ACTIONS).find((phase) => PHASE_ACTIONS[phase].has(action)) || null;
}

function animatedName(phase, character, action) {
  const suffix = ["phase2a", "phase2b", "phase2c", "phase2f", "phase2g", "phase2h", "phase2i", "phase2k"].includes(phase) ? "_512_v01.webp" : "_v01.webp";
  return `${character}_${action}${suffix}`;
}

function staticName(character, action) {
  return `${character}_${action}_frame_01_v01.png`;
}

function assetPath(phase, character, action, reduced = REDUCED_MOTION.matches) {
  return reduced
    ? `${ROOT}/${phase}/static/${staticName(character, action)}`
    : `${ROOT}/${phase}/webp/${animatedName(phase, character, action)}`;
}

function masterPath(character) {
  const fallback = character === "group" ? "mayo" : character;
  return `${ROOT}/phase2a/static/${fallback}_master_front_sit_v01.png`;
}

function getStage() {
  return document.querySelector("[data-budget-mascot-stage]");
}

function ensureStageContent(stage) {
  if (!stage || stage.dataset.mascotReady === "1") return stage;
  stage.dataset.mascotReady = "1";
  stage.classList.add("budget-mascot-stage");
  stage.setAttribute("role", "status");
  stage.setAttribute("aria-live", "polite");
  stage.innerHTML = `
    <div class="budget-mascot-copy">
      <div class="budget-mascot-eyebrow">후추 · 마요 · 짜장</div>
      <div class="budget-mascot-message"></div>
      <div class="budget-mascot-note">정보와 버튼을 가리지 않는 전용 안전영역에서만 움직여요.</div>
    </div>
    <div class="budget-mascot-visual" aria-hidden="true">
      <img class="budget-mascot-image" alt="" decoding="async">
    </div>
    <button class="budget-mascot-toggle" type="button" title="마스코트 숨기기" aria-label="마스코트 숨기기">×</button>
  `;
  stage.querySelector(".budget-mascot-toggle")?.addEventListener("click", () => setEnabled(!isEnabled()));
  lastStage = stage;
  return stage;
}

function setImage(stage, { phase, character, action }) {
  const image = stage.querySelector(".budget-mascot-image");
  if (!image) return;
  image.onerror = () => {
    image.onerror = null;
    image.src = masterPath(character);
  };
  image.src = assetPath(phase, character, action);
}

function renderIdle() {
  const stage = ensureStageContent(getStage());
  if (!stage) return false;
  stage.classList.toggle("is-disabled", !isEnabled());
  const toggle = stage.querySelector(".budget-mascot-toggle");
  if (toggle) {
    toggle.textContent = isEnabled() ? "×" : "🐾 다시 보기";
    toggle.title = isEnabled() ? "마스코트 숨기기" : "마스코트 다시 보기";
    toggle.setAttribute("aria-label", toggle.title);
  }
  window.clearTimeout(timer);
  window.clearTimeout(ambientTimer);
  if (!isEnabled()) return false;
  activePriority = -1;
  const tab = document.body.dataset.budgetTab || "home";
  const idle = IDLE_BY_TAB[tab] || IDLE_BY_TAB.home;
  stage.dataset.state = "idle";
  stage.dataset.tone = "neutral";
  stage.querySelector(".budget-mascot-eyebrow").textContent = "후추 · 마요 · 짜장";
  stage.querySelector(".budget-mascot-message").textContent = idle.message;
  setImage(stage, { phase: "phase2a", ...idle });
  scheduleAmbient();
  return true;
}

function scheduleAmbient() {
  window.clearTimeout(ambientTimer);
  if (!isEnabled() || REDUCED_MOTION.matches || document.hidden) return;
  const delay = 25000 + Math.floor(Math.random() * 20001);
  ambientTimer = window.setTimeout(playAmbient, delay);
}

function playAmbient() {
  if (!isEnabled() || REDUCED_MOTION.matches || document.hidden) return false;
  const tab = document.body.dataset.budgetTab || "home";
  const candidates = AMBIENT_BY_TAB[tab] || AMBIENT_BY_TAB.home;
  const available = candidates.filter(({ action, character }) => `${character}:${action}` !== lastAmbient);
  const pool = available.length ? available : candidates;
  const chosen = pool[Math.floor(Math.random() * pool.length)];
  lastAmbient = `${chosen.character}:${chosen.action}`;
  return play({
    ...chosen,
    duration: 2600,
    title: "세 마리의 일상",
    tone: "neutral",
  });
}

function play({ action, character, duration = 2600, message, title, tone } = {}) {
  if (!isEnabled()) return false;
  const phase = phaseFor(action);
  if (!phase) return false;
  const stage = ensureStageContent(getStage());
  if (!stage) return false;
  const priority = PRIORITY[action] ?? 2;
  if (activePriority > priority) return false;
  activePriority = priority;
  window.clearTimeout(timer);
  window.clearTimeout(ambientTimer);
  const chosen = CHARACTERS.has(character) ? character : (PREFERRED_CHARACTER[action] || "huchu");
  const copy = ACTION_COPY[action] || [title || "가계부 기록 완료", message || "기록을 확인했어요.", tone || "good"];
  stage.hidden = false;
  stage.dataset.state = "reacting";
  stage.dataset.tone = tone || copy[2] || "good";
  stage.querySelector(".budget-mascot-eyebrow").textContent = title || copy[0];
  stage.querySelector(".budget-mascot-message").textContent = message || copy[1];
  setImage(stage, { phase, character: chosen, action });
  timer = window.setTimeout(renderIdle, REDUCED_MOTION.matches ? Math.min(duration, 1200) : duration);
  return true;
}

function setEnabled(enabled) {
  localStorage.setItem(ENABLED_KEY, enabled ? "1" : "0");
  const stage = ensureStageContent(getStage());
  if (stage) stage.classList.toggle("is-disabled", !enabled);
  if (enabled) renderIdle();
  else renderIdle();
}

window.addEventListener("budget-mascot", (event) => play(event.detail || {}));
REDUCED_MOTION.addEventListener?.("change", renderIdle);
document.addEventListener("visibilitychange", () => {
  if (document.hidden) window.clearTimeout(ambientTimer);
  else renderIdle();
});
document.addEventListener("focusin", (event) => {
  const target = event.target;
  if (!(target instanceof Element) || !target.matches("input, textarea, select, [contenteditable='true']")) return;
  const now = Date.now();
  if (now - lastInputFocusAt < 20000) return;
  lastInputFocusAt = now;
  play({ action: "focus_record", character: "mayo", duration: 2200 });
});

const observer = new MutationObserver(() => {
  const stage = getStage();
  if (stage && stage !== lastStage) renderIdle();
});
observer.observe(document.documentElement, {
  childList: true,
  subtree: true,
  attributes: true,
  attributeFilter: ["data-budget-tab"],
});

window.BudgetMascot = Object.freeze({
  play,
  playAmbient,
  renderIdle,
  setEnabled,
  isEnabled,
  actions: Object.freeze(
    Object.fromEntries(Object.entries(PHASE_ACTIONS).map(([phase, actions]) => [phase, [...actions]])),
  ),
});

renderIdle();
