// 强制刷新所有管理后台数据
// 解决数据概览、订单管理、销售管理、客户管理数据显示问题

console.log('🔧 开始强制刷新所有管理数据...');

// 1. 清除所有缓存
console.log('🧹 清除缓存...');
localStorage.clear();
sessionStorage.clear();

// 2. 清除API缓存（如果有的话）
if (window.CacheManager) {
  window.CacheManager.clear();
  console.log('✅ API缓存已清除');
}

// 3. 重新加载页面
console.log('🔄 重新加载页面...');
setTimeout(() => {
  window.location.reload(true);
}, 1000);

// 提供手动API测试功能
window.testAPIs = async function() {
  console.log('🧪 开始API测试...');
  
  try {
    // 测试基础API连接
    const response = await fetch('/api/test', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('API连接状态:', response.status);
    
    // 如果有Redux store，可以直接调用
    if (window.store) {
      console.log('📊 通过Redux测试数据获取...');
      
      // 测试获取订单
      window.store.dispatch({type: 'admin/getAdminOrders/pending'});
      
      // 测试获取统计
      window.store.dispatch({type: 'admin/getStats/pending'});
      
      console.log('✅ Redux actions已发送');
    }
    
  } catch (error) {
    console.error('❌ API测试失败:', error);
  }
};

console.log('ℹ️  页面刷新后，如果数据仍为空，请在控制台执行: testAPIs()');
