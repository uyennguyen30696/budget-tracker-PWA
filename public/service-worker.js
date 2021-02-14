const CACHE_NAME = "static-cache-v2";
const DATA_CACHE_NAME = "data-cache-v1";

const iconSizes = ["72", "96", "128", "144", "152", "192", "384", "512"];
const iconFiles = iconSizes.map(
    (size) => `/icons/icon-${size}x${size}.png`
);

const staticFilesToPreCache = [
    "/",
    "/index.html",
    "/db.js",
    "/index.js",
    "/styles.css",
    "/manifest.webmanifest",
].concat(iconFiles);

// Install
self.addEventListener("install", function (evt) {
    evt.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            console.log("Your files were pre-cached successfully!");
            return cache.addAll(staticFilesToPreCache);
        })
    );
    self.skipWaiting();
});

// Activate service worker
// Remove old data from the cache
self.addEventListener("activate", function (evt) {
    evt.waitUntil(
        caches.keys().then(keyList => {
            return Promise.all(
                keyList.map(key => {
                    if (key !== CACHE_NAME && key !== DATA_CACHE_NAME) {
                        console.log("Removing old cache data", key);
                        return caches.delete(key);
                    }
                })
            )
        })
    );
    self.clients.claim();
});

// Fetch to serve static files from the cache, proceed with a network request when the resource is not in the cache
// Accessible offline
self.addEventListener("fetch", function (evt) {
    const { url } = evt.request;
    if (url.includes("/api")) {
        evt.respondWith(
            caches.open(DATA_CACHE_NAME).then(cache => {
                return fetch(evt.request)
                    .then(response => {
                        // If the reponse was good, clone it and store it in the cache
                        if (response.status === 200) {
                            cache.put(evt.request, response.clone());
                        }
                        return response;
                    })
                    .catch(err => {
                        // If network request failed, try to get it from the cache
                        return cache.match(evt.request);
                    });
            }).catch(err => console.log(err))
        );
    } else {
        evt.respondWith(
            caches.open(CACHE_NAME).then(cache => {
                return cache.match(evt.request).then(response => {
                    return response || fetch(evt.request);
                });
            })
        );
    }
});
