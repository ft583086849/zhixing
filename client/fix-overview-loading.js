#!/usr/bin/env node

/**
 * 修复数据概览页面一直加载的问题
 * 在浏览器控制台执行
 */

console.log('🔧 修复数据概览页面加载问题\n');

console.log('请在管理后台页面的浏览器控制台执行以下代码：\n');

const fixCode = `
// 修复数据概览页面加载问题
(async function() {
  console.log('🔧 开始修复数据概览页面...');
  
  try {
    // 1. 强制清除loading状态
    console.log('\\n1️⃣ 清除loading状态:');
    
    // 尝试获取Redux store
    let store = null;
    
    // 方法1: 从React DevTools获取
    if (window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
      const devtools = window.__REACT_DEVTOOLS_GLOBAL_HOOK__;
      const renderers = devtools.renderers;
      if (renderers && renderers.size > 0) {
        for (const [_, renderer] of renderers) {
          try {
            const fiber = renderer.getFiberRoots().values().next().value;
            if (fiber && fiber.current && fiber.current.memoizedState) {
              const hooks = fiber.current.memoizedState;
              // 查找Redux store
              let currentHook = hooks;
              while (currentHook) {
                if (currentHook.memoizedState && currentHook.memoizedState.store) {
                  store = currentHook.memoizedState.store;
                  break;
                }
                currentHook = currentHook.next;
              }
            }
          } catch (e) {}
        }
      }
    }
    
    // 方法2: 从window全局变量获取（如果开发环境暴露了）
    if (!store && window.__REDUX_STORE__) {
      store = window.__REDUX_STORE__;
    }
    
    if (store) {
      // 直接派发action清除loading状态
      store.dispatch({
        type: 'admin/getStats/fulfilled',
        payload: store.getState().admin.stats || {}
      });
      console.log('✅ 已清除loading状态');
    } else {
      console.log('⚠️ 无法访问Redux store，尝试其他方法');
    }
    
    // 2. 直接调用API获取数据
    console.log('\\n2️⃣ 直接调用API获取数据:');
    const module = await import('/src/services/api.js');
    const AdminAPI = module.AdminAPI;
    
    // 设置超时
    const timeout = 10000; // 10秒超时
    
    const getStatsWithTimeout = () => {
      return Promise.race([
        AdminAPI.getStats({ 
          timeRange: 'all',
          skipExclusion: false // 先尝试不跳过排除
        }),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('请求超时')), timeout)
        )
      ]);
    };
    
    try {
      console.log('尝试获取数据（10秒超时）...');
      const stats = await getStatsWithTimeout();
      
      if (stats) {
        console.log('✅ 数据获取成功');
        console.log('统计数据:', {
          total_orders: stats.total_orders,
          total_amount: stats.total_amount,
          total_sales: stats.total_sales
        });
        
        // 如果有store，更新数据
        if (store) {
          store.dispatch({
            type: 'admin/getStats/fulfilled',
            payload: stats
          });
          console.log('✅ Redux状态已更新');
        }
        
        // 触发页面重新渲染
        const event = new Event('statsUpdated');
        window.dispatchEvent(event);
        
        console.log('\\n✅ 修复完成！页面应该显示正常了');
      }
    } catch (error) {
      if (error.message === '请求超时') {
        console.log('❌ 请求超时，尝试跳过排除功能...');
        
        // 尝试跳过排除功能
        try {
          const statsWithoutExclusion = await AdminAPI.getStats({ 
            timeRange: 'all',
            skipExclusion: true
          });
          
          if (statsWithoutExclusion) {
            console.log('✅ 跳过排除后获取成功');
            
            if (store) {
              store.dispatch({
                type: 'admin/getStats/fulfilled',
                payload: statsWithoutExclusion
              });
            }
          }
        } catch (e) {
          console.error('❌ 跳过排除也失败:', e);
        }
      } else {
        console.error('❌ API调用失败:', error);
      }
    }
    
    // 3. 清理可能的缓存问题
    console.log('\\n3️⃣ 清理缓存:');
    
    // 清理React Query缓存（如果使用）
    if (window.queryClient) {
      window.queryClient.invalidateQueries();
      console.log('✅ React Query缓存已清理');
    }
    
    // 清理本地缓存
    const cacheKeys = Object.keys(localStorage).filter(key => 
      key.includes('stats') || key.includes('cache')
    );
    cacheKeys.forEach(key => localStorage.removeItem(key));
    if (cacheKeys.length > 0) {
      console.log(\`✅ 清理了 \${cacheKeys.length} 个缓存项\`);
    }
    
    // 4. 建议刷新页面
    console.log('\\n4️⃣ 最终建议:');
    console.log('如果问题仍未解决，请执行:');
    console.log('1. 按F5刷新页面');
    console.log('2. 或执行: window.location.reload(true)');
    
  } catch (error) {
    console.error('❌ 修复失败:', error);
    console.log('\\n请尝试刷新页面: window.location.reload(true)');
  }
})();
`;

console.log(fixCode);

console.log('\n📋 其他解决方案：');
console.log('1. 清除浏览器缓存：Ctrl+Shift+Delete');
console.log('2. 使用无痕模式打开');
console.log('3. 检查网络连接是否正常');
console.log('4. 查看Supabase服务是否正常');