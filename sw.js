// 나의 가계부 서비스워커 — 오프라인 캐시 + 푸시 알림
const CACHE = "budget-v130";
const CORE = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./icon-192.png",
  "./assets/mascot-v2/mascot-runtime.css",
  "./assets/mascot-v2/mascot-runtime.js",
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
