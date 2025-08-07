// 彻底清除所有缓存的完整脚本
// 请在浏览器Console中运行

console.log('🔧 开始彻底清除缓存...');

// 1. 清除所有存储
try {
    localStorage.clear();
    sessionStorage.clear();
    console.log('✅ localStorage和sessionStorage已清除');
} catch (e) {
    console.error('❌ 清除存储失败:', e);
}

// 2. 清除IndexedDB
if ('indexedDB' in window) {
    indexedDB.databases().then(databases => {
        databases.forEach(db => {
            indexedDB.deleteDatabase(db.name);
        });
        console.log('✅ IndexedDB已清除');
    }).catch(e => {
        console.error('❌ 清除IndexedDB失败:', e);
    });
}

// 3. 清除Service Worker缓存
if ('caches' in window) {
    caches.keys().then(cacheNames => {
        return Promise.all(
            cacheNames.map(cacheName => {
                return caches.delete(cacheName);
            })
        );
    }).then(() => {
        console.log('✅ Service Worker缓存已清除');
    }).catch(e => {
        console.error('❌ 清除Service Worker缓存失败:', e);
    });
}

// 4. 注销Service Worker
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then(registrations => {
        registrations.forEach(registration => {
            registration.unregister();
        });
        console.log('✅ Service Worker已注销');
    }).catch(e => {
        console.error('❌ 注销Service Worker失败:', e);
    });
}

// 5. 强制刷新页面
setTimeout(() => {
    console.log('🔄 3秒后强制刷新页面...');
    setTimeout(() => {
        window.location.reload(true);
    }, 3000);
}, 1000);
