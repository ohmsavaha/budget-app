// 나의 가계부 서비스워커 — 오프라인 캐시 + 푸시 알림
const CACHE = "budget-v161";
const PET_CHARACTERS = ["huchu", "mayo", "jjajang"];
const PET_STATES = ["idle", "eat", "sleep", "play", "groom", "sick", "love"];
const PET_RUNTIME_ASSETS = PET_CHARACTERS.flatMap((character) => PET_STATES.flatMap((state) => [
  `./assets/pet-v1/webp/${character}_baby_${state}_512_v01.webp`,
  `./assets/pet-v1/static/${character}_baby_${state}_frame_01_v01.png`,
]));
const PET_ADULT_HANDOFF_ASSETS = PET_CHARACTERS.flatMap((character) => [
  `./assets/mascot-v2/phase2a/webp/${character}_breathe_512_v01.webp`,
  `./assets/mascot-v2/phase2a/static/${character}_breathe_frame_01_v01.png`,
]);
const CORE = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./icon-192.png",
  "./assets/mascot-v2/mascot-runtime.css",
  "./assets/mascot-v2/mascot-runtime.js",
  "./assets/pet-v1/pet-nursery.css",
  "./assets/pet-v1/pet-nursery.js",
  "./assets/pet-v1/pet-nursery-view.js",
  "./assets/pet-v1/pet-nursery-extras.js",
  "./assets/pet-v1/pet-nursery-room.js",
  "./assets/pet-v1/pet-nursery-memories.js",
  "./assets/pet-v1/manifest.json",
  "./assets/mascot-v2/phase2l/webp/group_group_budget_review_512_v01.webp",
  "./assets/mascot-v2/phase2l/static/group_group_budget_review_frame_01_v01.png",
  "./assets/mascot-v2/phase2m/webp/huchu_budget_warning_512_v01.webp",
  "./assets/mascot-v2/phase2m/webp/mayo_budget_calm_512_v01.webp",
  "./assets/mascot-v2/phase2m/webp/mayo_budget_exceeded_512_v01.webp",
  "./assets/mascot-v2/phase2m/webp/jjajang_goal_achieved_512_v01.webp",
  "./assets/mascot-v2/phase2m/webp/huchu_search_no_results_512_v01.webp",
  "./assets/mascot-v2/phase2m/webp/mayo_history_empty_512_v01.webp",
  "./assets/mascot-v2/phase2m/webp/mayo_retry_calm_512_v01.webp",
  "./assets/mascot-v2/phase2m/static/huchu_budget_warning_frame_01_v01.png",
  "./assets/mascot-v2/phase2m/static/mayo_budget_calm_frame_01_v01.png",
  "./assets/mascot-v2/phase2m/static/mayo_budget_exceeded_frame_01_v01.png",
  "./assets/mascot-v2/phase2m/static/jjajang_goal_achieved_frame_01_v01.png",
  "./assets/mascot-v2/phase2m/static/huchu_search_no_results_frame_01_v01.png",
  "./assets/mascot-v2/phase2m/static/mayo_history_empty_frame_01_v01.png",
  "./assets/mascot-v2/phase2m/static/mayo_retry_calm_frame_01_v01.png",
  "./assets/mascot-v2/phase2n/webp/huchu_grocery_logged_512_v01.webp",
  "./assets/mascot-v2/phase2n/webp/mayo_meal_logged_512_v01.webp",
  "./assets/mascot-v2/phase2n/webp/jjajang_cat_care_logged_512_v01.webp",
  "./assets/mascot-v2/phase2n/webp/huchu_transport_logged_512_v01.webp",
  "./assets/mascot-v2/phase2n/webp/huchu_home_bill_logged_512_v01.webp",
  "./assets/mascot-v2/phase2n/webp/mayo_health_logged_512_v01.webp",
  "./assets/mascot-v2/phase2n/webp/mayo_relationship_logged_512_v01.webp",
  "./assets/mascot-v2/phase2n/webp/jjajang_learning_logged_512_v01.webp",
  "./assets/mascot-v2/phase2n/webp/jjajang_shopping_logged_512_v01.webp",
  "./assets/mascot-v2/phase2n/webp/group_shared_expense_logged_512_v01.webp",
  "./assets/mascot-v2/phase2n/static/huchu_grocery_logged_frame_01_v01.png",
  "./assets/mascot-v2/phase2n/static/mayo_meal_logged_frame_01_v01.png",
  "./assets/mascot-v2/phase2n/static/jjajang_cat_care_logged_frame_01_v01.png",
  "./assets/mascot-v2/phase2n/static/huchu_transport_logged_frame_01_v01.png",
  "./assets/mascot-v2/phase2n/static/huchu_home_bill_logged_frame_01_v01.png",
  "./assets/mascot-v2/phase2n/static/mayo_health_logged_frame_01_v01.png",
  "./assets/mascot-v2/phase2n/static/mayo_relationship_logged_frame_01_v01.png",
  "./assets/mascot-v2/phase2n/static/jjajang_learning_logged_frame_01_v01.png",
  "./assets/mascot-v2/phase2n/static/jjajang_shopping_logged_frame_01_v01.png",
  "./assets/mascot-v2/phase2n/static/group_shared_expense_logged_frame_01_v01.png",
  ...PET_RUNTIME_ASSETS,
  ...PET_ADULT_HANDOFF_ASSETS,
];
// 캐시 대상: 우리 파일 + 코드/차트 CDN. Supabase 데이터 API는 절대 캐시하지 않음 (가계부 데이터는 항상 최신이어야 함)
const CACHEABLE_ORIGINS = [self.location.origin, "https://esm.sh", "https://cdnjs.cloudflare.com"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => Promise.allSettled(CORE.map((u) => c.add(u)))));
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)));
    await self.clients.claim();
  })());
});

// 네트워크 우선 + 오프라인 폴백: 온라인이면 항상 최신(배포 즉시 반영), 오프라인이면 마지막 캐시로 앱이 열림
self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  let url;
  try { url = new URL(req.url); } catch (e) { return; }
  if (!CACHEABLE_ORIGINS.includes(url.origin)) return; // Supabase 등은 그대로 통과
  event.respondWith((async () => {
    try {
      const fresh = await fetch(req);
      if (fresh && (fresh.ok || fresh.type === "opaque")) {
        const c = await caches.open(CACHE);
        c.put(req, fresh.clone());
      }
      return fresh;
    } catch (err) {
      const cached = await caches.match(req, { ignoreSearch: true });
      if (cached) return cached;
      if (req.mode === "navigate") {
        const shell = await caches.match("./index.html");
        if (shell) return shell;
      }
      return new Response("오프라인이에요. 인터넷 연결 후 다시 열어주세요.", { status: 503, headers: { "Content-Type": "text/plain; charset=utf-8" } });
    }
  })());
});

// 푸시 수신 → 알림 표시
self.addEventListener("push", (event) => {
  event.waitUntil((async () => {
    let data = { title: "💰 나의 가계부", body: "" };
    try { data = event.data ? await event.data.json() : data; }
    catch (e) { const t = event.data ? await event.data.text() : ""; data = { title: "💰 나의 가계부", body: t }; }
    await self.registration.showNotification(data.title || "💰 나의 가계부", {
      body: data.body || "",
      icon: "./icon-192.png",
      badge: "./icon-192.png",
      tag: data.tag || "budget",
      requireInteraction: false,
      data: { url: data.url || "./" }
    });
  })());
});

// 알림 클릭 → 앱 열기
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || "./";
  event.waitUntil((async () => {
    const list = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    for (const c of list) { if ("focus" in c) return c.focus(); }
    if (self.clients.openWindow) return self.clients.openWindow(url);
  })());
});
