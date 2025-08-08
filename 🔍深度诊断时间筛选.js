/**
 * 深度诊断时间筛选问题
 * 
 * 使用方法：
 * 1. 在数据概览页面 https://zhixing-seven.vercel.app/admin/overview
 * 2. 打开控制台(F12)
 * 3. 运行此脚本
 */

console.log('🔍 深度诊断时间筛选问题\n');
console.log('='.repeat(50));

// 1. 检查原始订单数据分布
async function checkOrderDistribution() {
  console.log('\n📊 1. 检查订单时间分布:');
  
  const { data: orders, error } = await supabaseClient
    .from('orders')
    .select('id, created_at, updated_at, payment_time, status, amount')
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('❌ 获取订单失败:', error);
    return;
  }
  
  console.log(`总订单数: ${orders.length}`);
  
  // 按日期分组统计
  const dateGroups = {};
  const now = new Date();
  const today = now.toDateString();
  const weekAgo = new Date(now - 7*24*60*60*1000);
  const monthAgo = new Date(now.getFullYear(), now.getMonth()-1, now.getDate());
  
  let todayCount = 0;
  let weekCount = 0;
  let monthCount = 0;
  
  orders.forEach(order => {
    // 使用payment_time或created_at
    const dateStr = order.payment_time || order.created_at;
    const date = new Date(dateStr);
    const dayKey = date.toLocaleDateString();
    
    dateGroups[dayKey] = (dateGroups[dayKey] || 0) + 1;
    
    // 统计各时间段
    if (date.toDateString() === today) todayCount++;
    if (date >= weekAgo) weekCount++;
    if (date >= monthAgo) monthCount++;
  });
  
  console.log('\n📅 订单分布:');
  console.log(`  - 今天: ${todayCount} 个`);
  console.log(`  - 本周: ${weekCount} 个`);
  console.log(`  - 本月: ${monthCount} 个`);
  console.log(`  - 全部: ${orders.length} 个`);
  
  console.log('\n📅 每日分布:');
  Object.entries(dateGroups)
    .sort((a, b) => new Date(b[0]) - new Date(a[0]))
    .slice(0, 10)
    .forEach(([date, count]) => {
      console.log(`  ${date}: ${count} 个订单`);
    });
  
  return orders;
}

// 2. 测试API的时间筛选
async function testAPIFiltering() {
  console.log('\n🧪 2. 测试API筛选逻辑:');
  
  try {
    const { AdminAPI } = await import('./services/api.js');
    
    // 测试不同时间范围
    const ranges = ['all', 'today', 'week', 'month', 'year'];
    const results = {};
    
    for (const range of ranges) {
      console.log(`\n测试 ${range}:`);
      const stats = await AdminAPI.getStats({ 
        timeRange: range, 
        usePaymentTime: true 
      });
      
      results[range] = {
        total_orders: stats.total_orders,
        total_amount: stats.total_amount,
        today_orders: stats.today_orders
      };
      
      console.log(`  - 订单数: ${stats.total_orders}`);
      console.log(`  - 总金额: ${stats.total_amount}`);
    }
    
    // 比较结果
    console.log('\n📊 对比结果:');
    console.table(results);
    
    // 检查是否都相同
    const values = Object.values(results);
    const allSame = values.every(v => 
      v.total_orders === values[0].total_orders && 
      v.total_amount === values[0].total_amount
    );
    
    if (allSame) {
      console.error('❌ 所有时间范围返回相同数据！筛选没有生效！');
    } else {
      console.log('✅ 时间筛选有差异');
    }
    
    return results;
    
  } catch (error) {
    console.error('❌ API测试失败:', error);
  }
}

// 3. 直接测试筛选逻辑
async function testFilterLogic() {
  console.log('\n🔧 3. 直接测试筛选逻辑:');
  
  // 获取所有订单
  const { data: orders } = await supabaseClient
    .from('orders')
    .select('*');
  
  if (!orders || orders.length === 0) {
    console.log('⚠️ 没有订单数据');
    return;
  }
  
  const now = new Date();
  const today = now.toDateString();
  const weekAgo = new Date(now - 7*24*60*60*1000);
  
  // 测试今天的筛选
  console.log('\n测试"今天"筛选:');
  const todayFiltered = orders.filter(order => {
    const timeField = order.payment_time || order.updated_at || order.created_at;
    const orderDate = new Date(timeField);
    const match = orderDate.toDateString() === today;
    if (match) {
      console.log(`  ✓ 订单 ${order.id}: ${timeField} -> ${orderDate.toDateString()}`);
    }
    return match;
  });
  console.log(`今天的订单: ${todayFiltered.length} 个`);
  
  // 测试本周筛选
  console.log('\n测试"本周"筛选:');
  const weekFiltered = orders.filter(order => {
    const timeField = order.payment_time || order.updated_at || order.created_at;
    return new Date(timeField) >= weekAgo;
  });
  console.log(`本周的订单: ${weekFiltered.length} 个`);
  
  // 如果都是0，可能是时间问题
  if (todayFiltered.length === 0 && weekFiltered.length === 0) {
    console.log('\n⚠️ 没有近期订单，检查订单日期:');
    orders.slice(0, 5).forEach(order => {
      console.log(`订单 ${order.id}:`);
      console.log(`  created_at: ${order.created_at}`);
      console.log(`  payment_time: ${order.payment_time}`);
    });
  }
}

// 4. 检查前端参数传递
async function checkFrontendParams() {
  console.log('\n📡 4. 检查前端参数传递:');
  
  // 检查Redux状态
  if (window.store) {
    const state = window.store.getState();
    console.log('Redux admin state:', state.admin);
  }
  
  // 模拟前端调用
  console.log('\n模拟数据概览页面调用:');
  const mockParams = {
    timeRange: 'week',
    usePaymentTime: true
  };
  console.log('传递参数:', mockParams);
  
  // 查看实际网络请求
  console.log('\n💡 提示: 切换时间范围，观察Network标签中的请求参数');
}

// 5. 创建不同日期的测试数据
async function createTimeTestData() {
  console.log('\n📝 5. 创建时间测试数据:');
  
  const now = new Date();
  const testData = [
    { name: '今天订单', date: now },
    { name: '昨天订单', date: new Date(now - 24*60*60*1000) },
    { name: '3天前订单', date: new Date(now - 3*24*60*60*1000) },
    { name: '1周前订单', date: new Date(now - 7*24*60*60*1000) },
    { name: '2周前订单', date: new Date(now - 14*24*60*60*1000) },
    { name: '1月前订单', date: new Date(now - 30*24*60*60*1000) }
  ];
  
  for (const item of testData) {
    const order = {
      customer_name: item.name,
      customer_wechat: `test_${Date.now()}`,
      duration: '1month',
      amount: 100,
      status: 'confirmed_config',
      payment_method: 'crypto',
      created_at: item.date.toISOString(),
      updated_at: item.date.toISOString(),
      payment_time: item.date.toISOString()
    };
    
    const { error } = await supabaseClient
      .from('orders')
      .insert(order);
    
    if (error) {
      console.error(`❌ 创建失败 (${item.name}):`, error.message);
    } else {
      console.log(`✅ 创建成功: ${item.name}`);
    }
  }
  
  console.log('\n✅ 测试数据创建完成，请刷新页面测试筛选');
}

// 主诊断流程
async function diagnose() {
  console.log('开始深度诊断...\n');
  
  // 1. 检查数据分布
  const orders = await checkOrderDistribution();
  
  if (!orders || orders.length === 0) {
    console.log('\n❌ 没有订单数据！');
    console.log('💡 运行 createTimeTestData() 创建测试数据');
    return;
  }
  
  // 2. 测试API
  await testAPIFiltering();
  
  // 3. 测试筛选逻辑
  await testFilterLogic();
  
  // 4. 检查前端
  await checkFrontendParams();
  
  // 总结
  console.log('\n' + '='.repeat(50));
  console.log('📊 诊断总结:\n');
  
  console.log('可能的问题:');
  console.log('1. API筛选逻辑有bug（最可能）');
  console.log('2. 前端没有正确传递timeRange参数');
  console.log('3. 所有订单都在同一时间段');
  console.log('4. payment_time字段值有问题');
  
  console.log('\n建议解决方案:');
  console.log('1. 运行 createTimeTestData() 创建不同日期的测试数据');
  console.log('2. 检查控制台是否有错误');
  console.log('3. 查看Network标签确认API请求参数');
}

// 执行诊断
diagnose();

// 导出函数
window.diagnose = diagnose;
window.checkOrderDistribution = checkOrderDistribution;
window.testAPIFiltering = testAPIFiltering;
window.testFilterLogic = testFilterLogic;
window.createTimeTestData = createTimeTestData;
