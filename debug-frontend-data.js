// 在浏览器控制台运行这段代码，检查前端数据
console.log('🔍 调试前端数据加载...');

// 1. 检查Redux store状态
function checkReduxStore() {
  console.log('\n=== 1. 检查Redux Store ===');
  
  // 尝试获取store
  const store = window.__REDUX_DEVTOOLS_EXTENSION__ && window.store;
  if (store) {
    const state = store.getState();
    console.log('Redux State:', state);
    
    if (state.admin && state.admin.primarySalesStats) {
      const stats = state.admin.primarySalesStats;
      console.log('Primary Sales Stats:', stats);
      console.log('当日佣金 (today_commission):', stats.today_commission);
      console.log('直销佣金 (today_direct_commission):', stats.today_direct_commission);
    }
  } else {
    console.log('❌ 无法访问Redux store');
  }
}

// 2. 检查API调用
function checkAPICall() {
  console.log('\n=== 2. 手动调用API ===');
  
  // 模拟API调用
  fetch('/api/admin/primary-sales-settlement', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      sales_code: 'PRI17547241780648255'
    })
  })
  .then(response => response.json())
  .then(data => {
    console.log('✅ API响应:', data);
    
    if (data.stats) {
      console.log('统计数据:', data.stats);
      console.log('当日佣金:', data.stats.today_commission);
      console.log('总佣金:', data.stats.total_commission);
    }
    
    if (data.orders) {
      console.log('订单数据 (前5条):', data.orders.slice(0, 5));
    }
  })
  .catch(error => {
    console.error('❌ API调用失败:', error);
  });
}

// 3. 检查页面DOM元素
function checkDOMElements() {
  console.log('\n=== 3. 检查页面DOM ===');
  
  // 查找当日佣金显示元素
  const todayCommissionElements = document.querySelectorAll('[data-testid*="today"], .ant-statistic');
  console.log('找到的统计元素:', todayCommissionElements.length);
  
  todayCommissionElements.forEach((el, index) => {
    const title = el.querySelector('.ant-statistic-title');
    const value = el.querySelector('.ant-statistic-content-value');
    
    if (title && value) {
      console.log(`元素 ${index + 1}:`);
      console.log('  标题:', title.textContent);
      console.log('  值:', value.textContent);
    }
  });
  
  // 查找错误信息
  const errorElements = document.querySelectorAll('.ant-message-error, .ant-alert-error');
  if (errorElements.length > 0) {
    console.log('❌ 发现错误信息:', Array.from(errorElements).map(el => el.textContent));
  }
}

// 4. 检查网络请求
function checkNetworkRequests() {
  console.log('\n=== 4. 监听网络请求 ===');
  
  // 拦截fetch请求
  const originalFetch = window.fetch;
  window.fetch = function(...args) {
    console.log('📡 Fetch请求:', args[0], args[1]);
    
    return originalFetch.apply(this, args)
      .then(response => {
        console.log('📡 响应状态:', response.status, response.statusText);
        return response;
      })
      .catch(error => {
        console.error('📡 请求失败:', error);
        throw error;
      });
  };
  
  console.log('✅ 网络监听已启用，现在重新查询数据...');
}

// 5. 执行所有检查
function runAllChecks() {
  console.log('🚀 开始执行所有检查...\n');
  
  checkReduxStore();
  checkDOMElements();
  checkNetworkRequests();
  
  // 延迟执行API检查，让网络监听生效
  setTimeout(() => {
    checkAPICall();
  }, 1000);
  
  console.log('\n📋 检查完成！请查看上面的输出结果。');
  console.log('💡 如果需要重新查询，请在页面上重新输入销售代码并点击查询。');
}

// 导出函数供手动调用
window.debugFrontend = {
  runAllChecks,
  checkReduxStore,
  checkAPICall,
  checkDOMElements,
  checkNetworkRequests
};

// 自动运行检查
runAllChecks();