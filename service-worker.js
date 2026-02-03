/**
 * WebKaar Ultimate Service Worker
 * Features: Instant Updates, Offline Support, Smart Caching
 * Version: v24 (Always change this number when you update code)
 */

const CACHE_NAME = 'webkaar-v24-live'; // ✅ Jab bhi code update karo, ye number badha dena (v8 -> v24)

// 1. FILES TO CACHE IMMEDIATELY (App Shell)
// Sirf wo files jo website khulne ke liye zaroori hain
const CORE_ASSETS = [
    './',
    './index.html',
    './404.html',              // Error page agar user offline hai aur page nahi mila
    './manifest.json',
    './css/style.css',
    './css/responsive.css',
    './js/main.js',
    './js/api.js',             // Screenshot mein ye file thi, isliye add kiya hai
    './images/logo.png',
'./images/webkaar.mp4',
    './images/favicon-32x32.png',
    'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap',
    'https://unpkg.com/@phosphor-icons/web'
];

// --- INSTALL EVENT (Files Download Karo) ---
self.addEventListener('install', (event) => {
    console.log('[Service Worker] Installing New Version:', CACHE_NAME);
    
    // ⚡ TRICK: Turant activate karo, wait mat karo
    self.skipWaiting();

    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(CORE_ASSETS);
        })
    );
});

// --- ACTIVATE EVENT (Purana Cache Delete Karo) ---
self.addEventListener('activate', (event) => {
    console.log('[Service Worker] Activated & Cleaning Old Cache');
    
    // ⚡ TRICK: Turant control lo, reload ki zaroorat nahi
    event.waitUntil(clients.claim());

    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cache) => {
                    if (cache !== CACHE_NAME) {
                        console.log('🧹 Deleting Old Cache:', cache);
                        return caches.delete(cache);
                    }
                })
            );
        })
    );
});

// --- FETCH EVENT (Sabse Zaroori Hissa) ---
self.addEventListener('fetch', (event) => {
    
    // STRATEGY 1: HTML Pages (Network First -> Cache Fallback)
    // Ye ensure karega ki user ko hamesha LATEST version mile
    if (event.request.mode === 'navigate') {
        event.respondWith(
            fetch(event.request)
                .then((networkResponse) => {
                    return caches.open(CACHE_NAME).then((cache) => {
                        // Naya version cache mein save kar lo future ke liye
                        cache.put(event.request, networkResponse.clone());
                        return networkResponse;
                    });
                })
                .catch(() => {
                    // Agar Net nahi hai, to Cache se dikhao
                    return caches.match(event.request).then((cachedResponse) => {
                        return cachedResponse || caches.match('./404.html');
                    });
                })
        );
        return;
    }

    // STRATEGY 2: Images/CSS/JS (Cache First -> Network Fallback)
    // Speed ke liye ye files cache se ayengi
    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            if (cachedResponse) {
                return cachedResponse;
            }
            // Agar cache mein nahi hai, to net se lao aur cache mein daal do
            return fetch(event.request).then((networkResponse) => {
                return caches.open(CACHE_NAME).then((cache) => {
                    cache.put(event.request, networkResponse.clone());
                    return networkResponse;
                });
            });
        })
    );
});