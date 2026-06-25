const CACHE="gaegabu-v10";
const SHELL=["./index.html"];
self.addEventListener("install",e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(SHELL)));self.skipWaiting();});
self.addEventListener("activate",e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
self.addEventListener("fetch",e=>{
  if(e.request.mode==="navigate"){
    e.respondWith(
      fetch(e.request).then(r=>{
        const cp=r.clone();
        caches.open(CACHE).then(c=>c.put("./index.html",cp));
        return r;
      }).catch(()=>caches.match("./index.html"))
    );
  }
});
