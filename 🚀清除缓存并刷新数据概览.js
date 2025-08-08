// 🚀 超强力刷新脚本 - 清除所有缓存并重新加载
// 在浏览器控制台运行此代码

(async function() {
    console.log('🧹 开始清除所有缓存...');
    
    // 1. 清除localStorage
    localStorage.clear();
    console.log('✅ localStorage已清除');
    
    // 2. 清除sessionStorage
    sessionStorage.clear();
    console.log('✅ sessionStorage已清除');
    
    // 3. 清除所有cookies（当前域）
    document.cookie.split(";").forEach(function(c) { 
        document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
    });
    console.log('✅ Cookies已清除');
    
    // 4. 清除IndexedDB
    if ('indexedDB' in window) {
        const databases = await indexedDB.databases();
        databases.forEach(db => {
            indexedDB.deleteDatabase(db.name);
        });
        console.log('✅ IndexedDB已清除');
    }
    
    // 5. 清除Service Worker缓存
    if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for(let registration of registrations) {
            registration.unregister();
        }
        console.log('✅ Service Workers已注销');
    }
    
    // 6. 清除Cache Storage
    if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(
            cacheNames.map(cacheName => caches.delete(cacheName))
        );
        console.log('✅ Cache Storage已清除');
    }
    
    // 7. 清除Redux Store（如果存在）
    if (window.__REDUX_DEVTOOLS_EXTENSION__) {
        window.__REDUX_DEVTOOLS_EXTENSION__.send('RESET');
    }
    
    // 8. 强制刷新页面（绕过缓存）
    console.log('🔄 3秒后强制刷新页面...');
    setTimeout(() => {
        // 使用最强力的刷新方式
        window.location.href = window.location.href.split('#')[0] + '?t=' + Date.now();
        // 或者使用：
        // location.reload(true); // 强制从服务器重新加载
    }, 3000);
    
    console.log('💪 所有缓存清除完成！页面即将刷新...');
})();

// 备用方案：如果上面的不够强力，使用这个
// window.location.replace(window.location.href + '?nocache=' + new Date().getTime());