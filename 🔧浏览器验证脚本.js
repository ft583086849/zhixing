// 🔧 浏览器验证脚本 - 粘贴到控制台运行
// 检查数据关联、Redux状态、Supabase连接

console.log('🔗 开始验证数据关联和系统状态...');
console.log('时间:', new Date().toLocaleString());

// 1. 检查Redux状态
console.log('\n📊 Redux状态检查:');
if (window.store) {
  const state = window.store.getState();
  console.log('✅ Redux store 可用');
  console.log('当前数据状态:', {
    订单数量: state.admin?.orders?.length || 0,
    销售数量: state.admin?.sales?.length || 0,
    客户数量: state.admin?.customers?.length || 0,
    统计数据: state.admin?.stats,
    加载状态: state.admin?.loading,
    错误信息: state.admin?.error
  });
  
  // 检查订单数据的关联情况
  if (state.admin?.orders?.length > 0) {
    const sample = state.admin.orders.slice(0, 3);
    console.log('📦 订单关联示例:');
    sample.forEach((order, index) => {
      console.log(`订单${index + 1}:`, {
        订单号: order.order_number,
        销售代码: order.sales_code,
        销售微信: order.sales_wechat_name || '未关联',
        销售类型: order.sales_type || '未设置',
        状态: order.status,
        生效时间: order.effective_time || '未设置',
        到期时间: order.expiry_time || '未设置',
        实付金额: order.actual_payment_amount || '未设置'
      });
    });
  } else {
    console.log('📦 订单数据为空');
  }
} else {
  console.log('❌ Redux store 不可用');
}

// 2. 检查Supabase连接
console.log('\n🗄️ Supabase连接检查:');
if (window.supabase) {
  console.log('✅ Supabase客户端可用');
  
  // 测试基础查询
  Promise.all([
    window.supabase.from('orders').select('count'),
    window.supabase.from('primary_sales').select('count'), 
    window.supabase.from('secondary_sales').select('count')
  ]).then(results => {
    console.log('🗄️ 数据库表统计:', {
      orders: results[0],
      primary_sales: results[1], 
      secondary_sales: results[2]
    });
  }).catch(err => {
    console.log('❌ 数据库查询失败:', err);
  });
  
  // 测试订单数据获取
  window.supabase.from('orders')
    .select('order_number, sales_code, status, created_at')
    .limit(3)
    .then(result => {
      console.log('📋 最新订单数据:', result);
    })
    .catch(err => {
      console.log('❌ 订单查询失败:', err);
    });
    
} else {
  console.log('❌ Supabase客户端不可用');
}

// 3. 检查API调用
console.log('\n🌐 API调用测试:');
fetch('/api/orders', {
  method: 'GET',
  headers: { 'Content-Type': 'application/json' }
}).then(response => {
  console.log('API响应状态:', response.status);
  return response.json();
}).then(data => {
  console.log('✅ API调用成功，数据:', data);
}).catch(error => {
  console.log('❌ API调用失败:', error);
});

// 4. 检查页面元素
console.log('\n🎛️ 页面元素检查:');
const tableRows = document.querySelectorAll('.ant-table-tbody tr');
console.log('表格行数:', tableRows.length);

const statusElements = document.querySelectorAll('.ant-tag');
console.log('状态标签数:', statusElements.length);
if (statusElements.length > 0) {
  console.log('状态标签示例:', Array.from(statusElements).slice(0, 3).map(el => el.textContent));
}

// 5. 检查错误信息
console.log('\n🚨 错误信息检查:');
const errorElements = document.querySelectorAll('.ant-alert-error, [class*="error"]');
if (errorElements.length > 0) {
  console.log('⚠️ 发现错误信息:', Array.from(errorElements).map(el => el.textContent));
} else {
  console.log('✅ 未发现明显错误信息');
}

// 6. 手动刷新数据方法
window.refreshAllData = function() {
  console.log('🔄 手动刷新所有数据...');
  if (window.store) {
    // 触发所有数据获取
    window.store.dispatch({type: 'admin/getAdminOrders'});
    window.store.dispatch({type: 'admin/getSales'});
    window.store.dispatch({type: 'admin/getCustomers'});
    window.store.dispatch({type: 'admin/getStats'});
    console.log('✅ 数据刷新指令已发送');
  }
};

// 7. 清除缓存方法
window.clearAllCache = function() {
  console.log('🧹 清除所有缓存...');
  localStorage.clear();
  sessionStorage.clear();
  console.log('✅ 缓存已清除，建议刷新页面');
};

console.log('\n💡 可用命令:');
console.log('- refreshAllData() // 手动刷新所有数据');
console.log('- clearAllCache() // 清除缓存');

console.log('\n✨ 验证脚本执行完成！');
console.log('请查看上述输出结果，并反馈具体情况。');
