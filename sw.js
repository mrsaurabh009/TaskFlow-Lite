/**
 * Service Worker for TaskFlow Lite
 * Provides offline functionality and caching
 */

const CACHE_NAME = 'taskflow-lite-v1.0.0';
const STATIC_CACHE_URLS = [
    '/',
    '/index.html',
    '/app.js',
    '/styles/main.css',
    '/styles/utilities.css',
    '/modules/storage.js',
    '/modules/render.js',
    '/modules/validation.js',
    'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
    console.log('Service Worker: Installing...');
    
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('Service Worker: Caching static assets');
                return cache.addAll(STATIC_CACHE_URLS);
            })
            .then(() => {
                console.log('Service Worker: Static assets cached successfully');
                return self.skipWaiting();
            })
            .catch((error) => {
                console.error('Service Worker: Failed to cache static assets', error);
            })
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    console.log('Service Worker: Activating...');
    
    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames.map((cacheName) => {
                        if (cacheName !== CACHE_NAME) {
                            console.log('Service Worker: Deleting old cache', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            })
            .then(() => {
                console.log('Service Worker: Activated successfully');
                return self.clients.claim();
            })
    );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
    // Skip non-GET requests
    if (event.request.method !== 'GET') {
        return;
    }

    // Skip external requests (except fonts)
    const url = new URL(event.request.url);
    if (url.origin !== self.location.origin && !url.hostname.includes('fonts.googleapis.com')) {
        return;
    }

    event.respondWith(
        caches.match(event.request)
            .then((cachedResponse) => {
                // Return cached version if available
                if (cachedResponse) {
                    console.log('Service Worker: Serving from cache', event.request.url);
                    return cachedResponse;
                }

                // Fetch from network and cache the response
                return fetch(event.request)
                    .then((networkResponse) => {
                        // Don't cache if not successful
                        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
                            return networkResponse;
                        }

                        // Clone the response for caching
                        const responseToCache = networkResponse.clone();

                        caches.open(CACHE_NAME)
                            .then((cache) => {
                                console.log('Service Worker: Caching new resource', event.request.url);
                                cache.put(event.request, responseToCache);
                            });

                        return networkResponse;
                    })
                    .catch((error) => {
                        console.error('Service Worker: Network request failed', error);
                        
                        // Return a custom offline page if available
                        if (event.request.destination === 'document') {
                            return caches.match('/index.html');
                        }
                        
                        throw error;
                    });
            })
    );
});

// Background sync for offline task operations (future enhancement)
self.addEventListener('sync', (event) => {
    console.log('Service Worker: Background sync triggered', event.tag);
    
    if (event.tag === 'background-sync-tasks') {
        event.waitUntil(
            // Sync pending task operations when back online
            syncPendingTasks()
        );
    }
});

// Push notification support (future enhancement)
self.addEventListener('push', (event) => {
    console.log('Service Worker: Push notification received');
    
    const options = {
        body: event.data ? event.data.text() : 'New task reminder!',
        icon: '/images/icon-192.png',
        badge: '/images/badge-72.png',
        tag: 'taskflow-notification',
        requireInteraction: true,
        actions: [
            {
                action: 'view',
                title: 'View Tasks'
            },
            {
                action: 'dismiss',
                title: 'Dismiss'
            }
        ]
    };

    event.waitUntil(
        self.registration.showNotification('TaskFlow Lite', options)
    );
});

// Notification click handling
self.addEventListener('notificationclick', (event) => {
    console.log('Service Worker: Notification clicked', event.action);
    
    event.notification.close();

    if (event.action === 'view') {
        event.waitUntil(
            self.clients.openWindow('/')
        );
    }
});

// Helper function for syncing pending tasks (future enhancement)
async function syncPendingTasks() {
    try {
        // This would sync any offline changes with a server
        // For now, it's just a placeholder for future server integration
        console.log('Service Worker: Syncing pending tasks...');
        
        // Get any pending operations from IndexedDB or localStorage
        // Send to server when connection is restored
        
        console.log('Service Worker: Task sync completed');
    } catch (error) {
        console.error('Service Worker: Task sync failed', error);
    }
}

// Error handling
self.addEventListener('error', (event) => {
    console.error('Service Worker: Error occurred', event.error);
});

self.addEventListener('unhandledrejection', (event) => {
    console.error('Service Worker: Unhandled promise rejection', event.reason);
});

// Periodic background sync (requires user permission)
self.addEventListener('periodicsync', (event) => {
    console.log('Service Worker: Periodic sync triggered', event.tag);
    
    if (event.tag === 'daily-cleanup') {
        event.waitUntil(
            performDailyCleanup()
        );
    }
});

// Helper function for daily cleanup
async function performDailyCleanup() {
    try {
        console.log('Service Worker: Performing daily cleanup...');
        
        // Clean up old completed tasks (if user preference allows)
        // Clear temporary cache entries
        // Optimize storage usage
        
        console.log('Service Worker: Daily cleanup completed');
    } catch (error) {
        console.error('Service Worker: Daily cleanup failed', error);
    }
}
