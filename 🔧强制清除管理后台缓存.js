// 强制清除管理后台缓存的临时脚本
// 在浏览器Console中运行

console.log('🔄 开始清除管理后台缓存...');

// 1. 清除localStorage
console.log('1. 清除localStorage...');
Object.keys(localStorage).forEach(key => {
  if (key.includes('admin') || key.includes('cache') || key.includes('data')) {
    localStorage.removeItem(key);
    console.log(`   删除: ${key}`);
  }
});

// 2. 清除sessionStorage  
console.log('2. 清除sessionStorage...');
Object.keys(sessionStorage).forEach(key => {
  if (key.includes('admin') || key.includes('cache') || key.includes('data')) {
    sessionStorage.removeItem(key);
    console.log(`   删除: ${key}`);
  }
});

// 3. 清除Redux状态（如果可以访问store）
console.log('3. 尝试清除Redux状态...');
if (window.__REDUX_STORE__) {
  window.__REDUX_STORE__.dispatch({ type: 'CLEAR_ALL_CACHE' });
  console.log('   Redux状态已清除');
} else {
  console.log('   Redux store不可访问，请手动刷新页面');
}

// 4. 强制重新加载页面
console.log('4. 强制重新加载页面...');
setTimeout(() => {
  window.location.reload(true);
}, 1000);

console.log('✅ 缓存清除完成！页面将在1秒后重新加载...');
