/**
 * 🔍 诊断数据刷新问题
 * 
 * 用于检查订单状态更新后统计数据是否正确刷新
 */

console.log('🔍 开始诊断数据刷新问题...\n');

// 1. 检查当前统计数据
function checkCurrentStats() {
  console.log('\n📊 当前统计数据:');
  
  if (window.__REDUX_DEVTOOLS_EXTENSION__) {
    const state = window.__REDUX_DEVTOOLS_EXTENSION__.getState();
    
    if (state?.admin?.stats) {
      const stats = state.admin.stats;
      console.log('  总订单数:', stats.total_orders);
      console.log('  总金额:', stats.total_amount);
      console.log('  已确认金额:', stats.confirmed_amount);
      console.log('  今日订单:', stats.today_orders);
      console.log('  待支付订单:', stats.pending_payment_orders);
      console.log('  待配置订单:', stats.pending_config_orders);
      console.log('  已配置订单:', stats.confirmed_config_orders);
      
      // 检查订单列表
      if (state.admin.orders) {
        const orders = state.admin.orders;
        console.log('\n📋 订单列表:');
        console.log('  订单总数:', orders.length);
        
        // 统计各状态订单
        const statusCount = {};
        orders.forEach(order => {
          statusCount[order.status] = (statusCount[order.status] || 0) + 1;
        });
        
        console.log('\n  状态分布:');
        Object.entries(statusCount).forEach(([status, count]) => {
          console.log(`    ${status}: ${count} 个`);
        });
        
        // 计算非rejected订单数
        const nonRejectedOrders = orders.filter(o => o.status !== 'rejected');
        console.log('\n  非rejected订单数:', nonRejectedOrders.length);
        
        // 计算总金额（排除rejected）
        const totalAmount = nonRejectedOrders.reduce((sum, o) => 
          sum + (o.actual_payment_amount || o.amount || 0), 0
        );
        console.log('  非rejected订单总金额:', totalAmount);
      }
      
      return stats;
    } else {
      console.log('❌ 没有找到统计数据');
    }
  } else {
    console.log('⚠️ Redux DevTools未安装');
  }
  
  return null;
}

// 2. 监听Redux actions
function monitorReduxActions() {
  console.log('\n📡 开始监听Redux actions...');
  
  if (window.__REDUX_DEVTOOLS_EXTENSION__) {
    const store = window.__REDUX_DEVTOOLS_EXTENSION__.getState();
    
    // 拦截dispatch
    const originalDispatch = window.store?.dispatch;
    if (originalDispatch) {
      window.store.dispatch = function(action) {
        console.log('🎯 Redux Action:', action.type);
        
        // 特别关注这些action
        if (action.type.includes('getStats') || 
            action.type.includes('updateOrderStatus') ||
            action.type.includes('getAdminOrders')) {
          console.log('  ⚡ 重要Action:', action);
        }
        
        return originalDispatch.apply(this, arguments);
      };
      console.log('✅ Redux dispatch监听已启动');
    } else {
      console.log('⚠️ 无法获取store.dispatch');
    }
  }
}

// 3. 监听网络请求
function monitorNetworkRequests() {
  console.log('\n🌐 开始监听网络请求...');
  
  const originalFetch = window.fetch;
  window.fetch = function(...args) {
    const [url, options] = args;
    
    // 监听订单相关请求
    if (url.includes('orders')) {
      console.log('📦 订单请求:', options?.method || 'GET', url);
      
      if (options?.method === 'PATCH') {
        console.log('  更新数据:', options.body);
      }
    }
    
    return originalFetch.apply(this, args)
      .then(response => {
        if (url.includes('orders') && options?.method === 'PATCH') {
          response.clone().json().then(data => {
            console.log('  响应:', data);
            
            // 延迟检查统计数据是否更新
            setTimeout(() => {
              console.log('\n⏰ 状态更新后1秒，检查统计数据:');
              checkCurrentStats();
            }, 1000);
            
            setTimeout(() => {
              console.log('\n⏰ 状态更新后3秒，再次检查统计数据:');
              checkCurrentStats();
            }, 3000);
          });
        }
        return response;
      });
  };
  
  console.log('✅ 网络请求监听已启动');
}

// 4. 检查fetchOrders函数
function analyzeFetchOrders() {
  console.log('\n🔍 分析fetchOrders函数:');
  
  // 尝试在控制台查找fetchOrders的实现
  console.log('💡 fetchOrders函数问题分析:');
  console.log('  ❌ fetchOrders只调用了getAdminOrders');
  console.log('  ❌ 没有调用getStats更新统计数据');
  console.log('  ✅ handleRefresh同时调用了两个');
  console.log('\n  这就是为什么点击拒绝后统计数据不更新的原因！');
}

// 5. 提供修复建议
function showFixSuggestion() {
  console.log('\n💡 修复建议:');
  console.log('1. 修改fetchOrders函数，让它也调用getStats:');
  console.log('   dispatch(getAdminOrders(queryParams));');
  console.log('   dispatch(getStats({ usePaymentTime: true })); // 添加这行');
  console.log('\n2. 或者在handleUpdateStatus中直接调用handleRefresh:');
  console.log('   await DataRefreshManager.onOrderStatusUpdate();');
  console.log('   handleRefresh(); // 替换fetchOrders()');
}

// 执行诊断
console.log('='.repeat(50));
checkCurrentStats();
monitorReduxActions();
monitorNetworkRequests();
analyzeFetchOrders();
showFixSuggestion();
console.log('='.repeat(50));

console.log('\n✅ 诊断脚本已加载！');
console.log('🔧 请尝试点击拒绝按钮，观察数据变化');

// 导出函数供手动调用
window.diagnose = {
  checkStats: checkCurrentStats,
  analyzeProblem: analyzeFetchOrders,
  showFix: showFixSuggestion
};
