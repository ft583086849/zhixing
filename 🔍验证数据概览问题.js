// 验证数据概览显示0的问题
// 检查API调用和数据处理逻辑

console.log('🔍 开始验证数据概览问题...');

// 1. 模拟前端API调用
async function testStatsAPI() {
  console.log('\n📊 测试数据概览API...');
  
  try {
    // 检查Redux store状态
    if (window.store) {
      const state = window.store.getState();
      console.log('当前Redux Admin状态:', {
        stats: state.admin?.stats,
        loading: state.admin?.loading,
        error: state.admin?.error
      });
    }

    // 手动调用getStats API（如果可用）
    if (window.AdminAPI) {
      console.log('📞 手动调用AdminAPI.getStats()...');
      const stats = await window.AdminAPI.getStats();
      console.log('✅ AdminAPI.getStats() 结果:', stats);
    } else {
      console.log('❌ AdminAPI 不可用，尝试直接API调用');
    }

    // 直接测试Supabase API
    console.log('🗄️ 直接测试数据库查询...');
    
    // 检查订单统计
    console.log('检查订单数据...');
    const ordersResult = await fetch('/api/orders', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (ordersResult.ok) {
      const orders = await ordersResult.json();
      console.log('📦 订单数据:', {
        总数量: orders.length,
        前3条: orders.slice(0, 3).map(o => ({
          订单号: o.order_number,
          金额: o.amount,
          实付金额: o.actual_payment_amount,
          状态: o.status,
          创建时间: o.created_at
        }))
      });
      
      // 手动计算统计
      const totalAmount = orders.reduce((sum, order) => {
        const actualAmount = parseFloat(order.actual_payment_amount || 0);
        const paymentMethod = order.payment_method;
        
        // 人民币按7.15汇率换算
        if (paymentMethod === 'alipay' && actualAmount > 0) {
          return sum + (actualAmount / 7.15);
        }
        return sum + actualAmount;
      }, 0);
      
      const todayOrders = orders.filter(order => 
        new Date(order.created_at).toDateString() === new Date().toDateString()
      ).length;
      
      console.log('📈 手动计算结果:', {
        总订单数: orders.length,
        总金额USD: Math.round(totalAmount * 100) / 100,
        今日订单: todayOrders,
        待付款: orders.filter(o => o.status === 'pending_payment' || o.status === 'pending').length,
        已付款: orders.filter(o => o.status === 'confirmed_payment').length
      });
    } else {
      console.log('❌ 获取订单数据失败:', ordersResult.status);
    }

  } catch (error) {
    console.error('❌ 验证过程出错:', error);
  }
}

// 2. 检查前端组件状态
function checkDashboardComponent() {
  console.log('\n🎛️ 检查数据概览组件状态...');
  
  // 查找数据概览相关DOM元素
  const statsCards = document.querySelectorAll('[class*="stat"], [class*="card"], .ant-statistic');
  console.log('找到统计卡片:', statsCards.length, '个');
  
  statsCards.forEach((card, index) => {
    const value = card.querySelector('.ant-statistic-content-value, [class*="value"]');
    if (value) {
      console.log(`卡片${index + 1}:`, value.textContent);
    }
  });
  
  // 检查是否有错误信息
  const errorElements = document.querySelectorAll('.ant-alert-error, [class*="error"]');
  if (errorElements.length > 0) {
    console.log('⚠️ 发现错误信息:', Array.from(errorElements).map(el => el.textContent));
  }
}

// 3. 检查API缓存
function checkAPICache() {
  console.log('\n🗂️ 检查API缓存...');
  
  // 检查LocalStorage
  const cacheKeys = Object.keys(localStorage).filter(key => 
    key.includes('admin') || key.includes('stats') || key.includes('cache')
  );
  console.log('缓存键:', cacheKeys);
  
  cacheKeys.forEach(key => {
    try {
      const data = JSON.parse(localStorage.getItem(key));
      console.log(`${key}:`, data);
    } catch (e) {
      console.log(`${key}: (非JSON数据)`, localStorage.getItem(key));
    }
  });
}

// 执行验证
testStatsAPI();
checkDashboardComponent();
checkAPICache();

console.log('\n🎯 如果数据概览仍显示0，可能原因：');
console.log('1. Redux状态未正确更新');
console.log('2. API调用失败但没有错误提示');
console.log('3. 组件没有监听到状态变化');
console.log('4. 缓存问题导致旧数据');
console.log('5. 数据格式不匹配前端期望');

// 提供手动刷新方法
window.refreshStats = function() {
  if (window.store) {
    console.log('🔄 手动刷新数据概览...');
    window.store.dispatch({type: 'admin/getStats'});
  }
};

console.log('\n💡 可以执行 refreshStats() 手动刷新数据');
