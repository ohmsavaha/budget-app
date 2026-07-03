// 나의 가계부 서비스워커 — 오프라인 캐시 + 푸시 알림
const CACHE = "budget-v109";

self.addEventListener("install", (e) => { self.skipWaiting(); });
self.addEventListener("activate", (e) => { e.waitUntil(self.clients.claim()); });

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
