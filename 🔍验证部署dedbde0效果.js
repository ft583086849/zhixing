// 🔍 验证部署 dedbde0 效果 - 全面检查修复项目
// 使用方法：在管理后台控制台粘贴运行

console.log('🔍 开始验证部署 dedbde0 的修复效果...');
console.log('时间:', new Date().toLocaleString());

// 1. 检查Redux状态和数据
function checkReduxState() {
  console.log('\n📊 === Redux状态检查 ===');
  
  if (!window.store) {
    console.log('❌ Redux store 不可用');
    return;
  }
  
  const state = window.store.getState();
  
  // 检查基础数据状态
  const dataStatus = {
    订单数量: state.admin?.orders?.length || 0,
    销售数量: state.admin?.sales?.length || 0,
    客户数量: state.admin?.customers?.length || 0,
    统计数据: state.admin?.stats || null,
    加载状态: state.admin?.loading || false,
    错误信息: state.admin?.error || '无错误'
  };
  
  console.log('📊 数据状态:', dataStatus);
  
  // 检查统计数据详情
  if (state.admin?.stats) {
    console.log('📈 统计数据详情:', {
      总订单数: state.admin.stats.total_orders,
      总金额: state.admin.stats.total_amount,
      今日订单: state.admin.stats.today_orders,
      总佣金: state.admin.stats.total_commission,
      一级销售数: state.admin.stats.primary_sales_count,
      二级销售数: state.admin.stats.secondary_sales_count
    });
  } else {
    console.log('❌ 统计数据为空');
  }
  
  return state;
}

// 2. 检查订单时间显示修复
function checkOrderTimeFields(state) {
  console.log('\n⏰ === 订单时间字段检查 ===');
  
  if (!state.admin?.orders || state.admin.orders.length === 0) {
    console.log('❌ 无订单数据可检查');
    return;
  }
  
  const orders = state.admin.orders.slice(0, 5); // 检查前5个订单
  
  orders.forEach((order, index) => {
    console.log(`订单${index + 1} (ID: ${order.id}):`, {
      状态: order.status,
      时长: order.duration,
      生效时间: order.effective_time ? '✅ 有数据' : '❌ 空值',
      到期时间: order.expiry_time ? '✅ 有数据' : '❌ 空值',
      销售微信: order.sales_wechat_name || '无',
      创建时间: order.created_at ? '✅ 有数据' : '❌ 空值'
    });
  });
}

// 3. 检查销售微信号关联
function checkSalesWechatMapping(state) {
  console.log('\n👥 === 销售微信号关联检查 ===');
  
  if (!state.admin?.orders || state.admin.orders.length === 0) {
    console.log('❌ 无订单数据可检查');
    return;
  }
  
  const ordersWithSales = state.admin.orders.filter(order => 
    order.sales_wechat_name || 
    order.wechat_name || 
    order.primary_sales_wechat || 
    order.secondary_sales_wechat
  );
  
  console.log(`📊 总订单数: ${state.admin.orders.length}`);
  console.log(`📊 有销售微信号的订单: ${ordersWithSales.length}`);
  console.log(`📊 关联成功率: ${((ordersWithSales.length / state.admin.orders.length) * 100).toFixed(1)}%`);
  
  if (ordersWithSales.length > 0) {
    console.log('✅ 销售微信号关联正常');
    console.log('示例:', ordersWithSales.slice(0, 3).map(order => ({
      订单ID: order.id,
      销售微信: order.sales_wechat_name || order.wechat_name || '其他字段'
    })));
  } else {
    console.log('❌ 销售微信号关联异常');
  }
}

// 4. 检查销售管理数据
function checkSalesData(state) {
  console.log('\n🏪 === 销售管理数据检查 ===');
  
  if (!state.admin?.sales) {
    console.log('❌ 销售数据为null/undefined');
    return;
  }
  
  if (state.admin.sales.length === 0) {
    console.log('❌ 销售数据数组为空');
    return;
  }
  
  console.log(`📊 销售总数: ${state.admin.sales.length}`);
  
  const primaryCount = state.admin.sales.filter(sale => sale.sales_type === 'primary').length;
  const secondaryCount = state.admin.sales.filter(sale => sale.sales_type === 'secondary').length;
  
  console.log(`📊 一级销售: ${primaryCount}`);
  console.log(`📊 二级销售: ${secondaryCount}`);
  console.log('✅ 销售数据正常');
  
  // 检查销售数据示例
  const sampleSales = state.admin.sales.slice(0, 3);
  console.log('📋 销售数据示例:', sampleSales.map(sale => ({
    ID: sale.id,
    类型: sale.sales_type,
    微信号: sale.wechat_name,
    销售代码: sale.sales_code
  })));
}

// 5. 手动刷新数据函数
function refreshAllData() {
  console.log('\n🔄 === 手动刷新所有数据 ===');
  
  if (!window.store) {
    console.log('❌ Redux store 不可用');
    return;
  }
  
  try {
    // 使用正确的action类型
    window.store.dispatch({ type: 'admin/getAdminOrders', payload: {} });
    window.store.dispatch({ type: 'admin/getSales', payload: {} });
    window.store.dispatch({ type: 'admin/getCustomers', payload: {} });
    window.store.dispatch({ type: 'admin/getStats', payload: {} });
    
    console.log('✅ 数据刷新指令已发送');
    console.log('⏱️ 请等待3秒后重新运行检查');
  } catch (error) {
    console.error('❌ 数据刷新失败:', error);
  }
}

// 6. 检查Supabase连接
async function checkSupabaseConnection() {
  console.log('\n🗄️ === Supabase连接检查 ===');
  
  if (!window.supabase) {
    console.log('❌ Supabase客户端不可用');
    return;
  }
  
  console.log('✅ Supabase客户端可用');
  
  try {
    // 测试基础查询
    const { data: ordersTest, error: ordersError } = await window.supabase
      .from('orders')
      .select('count');
    
    const { data: primaryTest, error: primaryError } = await window.supabase
      .from('primary_sales')
      .select('count');
    
    const { data: secondaryTest, error: secondaryError } = await window.supabase
      .from('secondary_sales')
      .select('count');
    
    console.log('📊 数据库表统计:', {
      orders: ordersError ? `❌ ${ordersError.message}` : `✅ ${ordersTest?.length || 0} 条记录`,
      primary_sales: primaryError ? `❌ ${primaryError.message}` : `✅ ${primaryTest?.length || 0} 条记录`,
      secondary_sales: secondaryError ? `❌ ${secondaryError.message}` : `✅ ${secondaryTest?.length || 0} 条记录`
    });
    
  } catch (error) {
    console.log('❌ Supabase查询测试失败:', error);
  }
}

// 主验证函数
async function runFullVerification() {
  console.log('🚀 开始完整验证...\n');
  
  // 1. 检查Redux状态
  const state = checkReduxState();
  
  // 2. 检查订单时间字段修复
  checkOrderTimeFields(state);
  
  // 3. 检查销售微信号关联
  checkSalesWechatMapping(state);
  
  // 4. 检查销售管理数据
  checkSalesData(state);
  
  // 5. 检查Supabase连接
  await checkSupabaseConnection();
  
  console.log('\n🎯 === 验证总结 ===');
  console.log('1. 如果数据概览还是全零，执行: refreshAllData()');
  console.log('2. 如果订单时间还是空，可能需要重新获取数据');
  console.log('3. 如果销售数据为空，检查Supabase权限设置');
  console.log('4. 收款配置的Yt.remove错误需要在保存时测试');
  
  console.log('\n✨ 验证完成！请根据结果反馈具体情况。');
}

// 暴露函数到全局
window.runFullVerification = runFullVerification;
window.refreshAllData = refreshAllData;
window.checkReduxState = checkReduxState;

// 自动运行验证
runFullVerification();

console.log('\n💡 可用命令:');
console.log('- runFullVerification() // 重新运行完整验证');
console.log('- refreshAllData() // 手动刷新所有数据');
console.log('- checkReduxState() // 单独检查Redux状态');
