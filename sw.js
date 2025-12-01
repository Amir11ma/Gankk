const CACHE_NAME = 'aqi-cache-v1';
const ASSETS = [
  '/', '/index.html', '/manifest.json'
  // اگر آیکون یا فایل‌های دیگر داری، آنها را اینجا اضافه کن مثل '/icons/icon-192.png'
];

// نصب و کش اولیه
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

// فعالسازی و پاکسازی کش قدیمی
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.map(k => { if (k !== CACHE_NAME) return caches.delete(k); })
    ))
  );
  self.clients.claim();
});

// یک استراتژی ساده: اول تلاش برای شبکه، اگر شکست خورد از کش استفاده کن
self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);

  // اگر درخواست به API Open-Meteo است، تلاش برای شبکه و پاسخ را کش کن (به‌صورت محدود)
  if (url.hostname.includes('open-meteo.com')) {
    e.respondWith(
      fetch(e.request).then(resp => {
        // کلیدهای حساس کش نکن — فقط خود پاسخ را در runtime cache ذخیره کن
        const respClone = resp.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(e.request, respClone));
        return resp;
      }).catch(()=> caches.match(e.request))
    );
    return;
  }

  // برای بقیه (فایل‌های سایت)، تلاش برای کش سپس شبکه
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request))
  );
});