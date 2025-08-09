/**
 * 🔍 查看当前页面订单的详细状态
 * 直接在控制台运行即可
 */

console.log('\n📊 分析当前订单状态...\n');

// 1. 从Redux Store获取订单数据
if (window.__REDUX_DEVTOOLS_EXTENSION__) {
  const state = window.__REDUX_DEVTOOLS_EXTENSION__.getState();
  
  if (state?.admin?.orders) {
    const orders = state.admin.orders;
    console.log(`✅ 找到 ${orders.length} 个订单\n`);
    
    // 显示每个订单的状态
    console.log('📋 订单详情：');
    orders.forEach((order, index) => {
      console.log(`\n订单 #${index + 1}:`);
      console.log('  ID:', order.id);
      console.log('  状态(英文):', order.status);
      console.log('  金额:', order.amount || order.actual_payment_amount);
      console.log('  客户:', order.customer_wechat);
      console.log('  创建时间:', order.created_at);
    });
    
    // 统计状态分布
    console.log('\n📊 状态统计：');
    const statusCount = {};
    orders.forEach(order => {
      statusCount[order.status] = (statusCount[order.status] || 0) + 1;
    });
    
    const statusMap = {
      'pending_payment': '待支付',
      'confirmed_payment': '已确认支付',
      'pending_config': '待配置',
      'confirmed_config': '已配置确认',
      'confirmed_configuration': '已配置确认（兼容）',
      'active': '活跃',
      'expired': '已过期',
      'cancelled': '已取消',
      'refunded': '已退款',
      'rejected': '已拒绝',
      'incomplete': '未完成'
    };
    
    Object.entries(statusCount).forEach(([status, count]) => {
      const chineseName = statusMap[status] || status;
      console.log(`  ${status} (${chineseName}): ${count} 个`);
    });
    
    // 分析已确认订单
    const confirmedStatuses = ['confirmed_payment', 'confirmed_config', 'confirmed_configuration', 'active'];
    const confirmedOrders = orders.filter(o => confirmedStatuses.includes(o.status));
    const pendingOrders = orders.filter(o => o.status === 'pending_payment' || o.status === 'pending_config');
    
    console.log('\n📈 订单分析：');
    console.log('  已确认订单:', confirmedOrders.length, '个');
    console.log('  待处理订单:', pendingOrders.length, '个');
    console.log('  已确认金额:', confirmedOrders.reduce((sum, o) => sum + (o.amount || o.actual_payment_amount || 0), 0));
    
    // 返回订单数据供进一步分析
    return orders;
    
  } else {
    console.log('❌ Redux Store中没有订单数据');
    console.log('💡 请先访问订单管理页面加载数据');
  }
} else {
  console.log('⚠️ Redux DevTools未安装');
}

// 2. 尝试从页面表格获取订单状态
console.log('\n📄 从页面表格获取数据：');
const tableRows = document.querySelectorAll('.ant-table-tbody tr');
if (tableRows.length > 0) {
  console.log(`找到 ${tableRows.length} 行订单数据`);
  
  tableRows.forEach((row, index) => {
    // 查找状态标签
    const statusTag = row.querySelector('.ant-tag');
    if (statusTag) {
      const statusText = statusTag.textContent;
      console.log(`  订单 ${index + 1} 状态: ${statusText}`);
    }
  });
} else {
  console.log('页面表格中没有数据');
}

console.log('\n✅ 分析完成！');
