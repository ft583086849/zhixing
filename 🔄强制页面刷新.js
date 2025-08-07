/**
 * 🔄 强制页面刷新显示数据
 * 解决控制台有数据但页面不显示的问题
 */

async function forcePageRefresh() {
  console.log('='.repeat(60));
  console.log('🔄 强制页面刷新');
  console.log('='.repeat(60));
  
  try {
    // 1. 清除所有缓存
    console.log('\n📋 步骤1：清除所有缓存');
    
    // 清除localStorage
    localStorage.clear();
    console.log('✅ localStorage已清除');
    
    // 清除sessionStorage
    sessionStorage.clear();
    console.log('✅ sessionStorage已清除');
    
    // 清除React缓存
    if (window.caches) {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames.map(cacheName => caches.delete(cacheName))
      );
      console.log('✅ Service Worker缓存已清除');
    }
    
    // 2. 重新获取并设置数据
    console.log('\n📋 步骤2：重新获取数据');
    
    const salesData = await window.adminAPI.getSales();
    console.log(`✅ 获取到 ${salesData?.length || 0} 条数据`);
    
    // 3. 强制更新Redux
    console.log('\n📋 步骤3：强制更新Redux');
    
    // 清空当前数据
    window.store.dispatch({
      type: 'admin/getSales/pending'
    });
    
    // 设置新数据
    setTimeout(() => {
      window.store.dispatch({
        type: 'admin/getSales/fulfilled',
        payload: salesData || []
      });
      
      const state = window.store.getState();
      console.log(`✅ Redux更新: ${state.admin?.sales?.length || 0} 条`);
    }, 100);
    
    // 4. 强制React重新渲染
    console.log('\n📋 步骤4：强制React重新渲染');
    
    // 方法1：通过路由刷新
    if (window.history) {
      const currentPath = window.location.pathname;
      window.history.pushState({}, '', '/admin');
      setTimeout(() => {
        window.history.pushState({}, '', currentPath);
      }, 50);
    }
    
    // 方法2：触发resize事件（某些组件监听这个）
    window.dispatchEvent(new Event('resize'));
    
    // 方法3：如果有React DevTools
    if (window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
      const hook = window.__REACT_DEVTOOLS_GLOBAL_HOOK__;
      if (hook.renderers && hook.renderers.size > 0) {
        hook.renderers.forEach((renderer) => {
          if (renderer && renderer.scheduleRefresh) {
            renderer.scheduleRefresh();
          }
        });
        console.log('✅ 通过React DevTools触发刷新');
      }
    }
    
    // 5. 最后的方案：硬刷新
    console.log('\n📋 步骤5：准备硬刷新');
    console.log('3秒后将执行硬刷新...');
    
    setTimeout(() => {
      console.log('🔄 执行硬刷新...');
      // 强制刷新，忽略缓存
      window.location.reload(true);
    }, 3000);
    
  } catch (error) {
    console.error('❌ 刷新过程出错:', error);
    
    // 直接硬刷新
    console.log('\n💡 直接执行硬刷新...');
    window.location.reload(true);
  }
}

// 执行
console.log('💡 开始强制刷新页面...\n');
forcePageRefresh();
