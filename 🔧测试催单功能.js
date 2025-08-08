/**
 * 测试订单管理的催单功能
 * 
 * 使用方法：
 * 1. 访问 https://zhixing-seven.vercel.app/admin/orders
 * 2. 打开控制台(F12)
 * 3. 运行此脚本
 */

console.log('🔧 测试催单功能\n');
console.log('='.repeat(50));

// 生成测试订单数据
async function createReminderTestOrders() {
  console.log('\n📝 创建催单测试订单...');
  
  const today = new Date();
  const testOrders = [];
  
  // 创建不同到期时间的订单
  const daysFromNow = [
    { days: 3, status: 'pending_config', needReminder: true },   // 3天后到期，需要催单
    { days: 7, status: 'pending_payment', needReminder: true },  // 7天后到期，需要催单
    { days: 10, status: 'pending_config', needReminder: false }, // 10天后到期，不需要催单
    { days: -1, status: 'pending_config', needReminder: false }, // 已过期，不需要催单
    { days: 5, status: 'confirmed_config', needReminder: false }, // 已完成，不需要催单
    { days: 2, status: 'active', needReminder: false },          // 已生效，不需要催单
  ];
  
  for (let i = 0; i < daysFromNow.length; i++) {
    const config = daysFromNow[i];
    const expiryDate = new Date(today);
    expiryDate.setDate(expiryDate.getDate() + config.days);
    
    const order = {
      customer_wechat: `测试催单${i + 1}`,
      tradingview_username: `test_reminder_${i + 1}`,
      purchase_type: 'immediate',
      payment_method: 'alipay',
      duration: '1month',
      amount: 188,
      status: config.status,
      sales_code: 'PRI17546603148895785', // 使用已存在的销售代码
      order_number: `TEST_REMINDER_${Date.now()}_${i}`,
      expiry_time: expiryDate.toISOString(),
      created_at: today.toISOString()
    };
    
    testOrders.push(order);
    
    console.log(`  订单${i + 1}: ${config.days}天后到期, 状态=${config.status}, 需要催单=${config.needReminder}`);
  }
  
  // 插入测试订单
  console.log('\n💾 插入测试订单到数据库...');
  
  for (const order of testOrders) {
    try {
      const { data, error } = await supabaseClient
        .from('orders')
        .insert(order);
      
      if (error) {
        console.error('插入失败:', error);
      }
    } catch (e) {
      console.error('插入异常:', e);
    }
  }
  
  console.log('✅ 测试订单创建完成！');
}

// 测试催单筛选功能
function testReminderFilter() {
  console.log('\n🔍 测试催单筛选功能:');
  
  console.log('\n建议操作步骤:');
  console.log('1. 在催单建议下拉框选择"建议催单"');
  console.log('2. 点击搜索按钮');
  console.log('3. 应该只显示7天内到期且未完成的订单');
  console.log('4. 每个订单应显示红色"建议催单"标签');
  
  console.log('\n检查点:');
  console.log('✓ 催单建议列显示正确的标签');
  console.log('✓ 筛选功能正常工作');
  console.log('✓ 销售信息显示完整（类型+上级）');
  console.log('✓ 订单ID在最右侧');
}

// 检查页面元素
function checkPageElements() {
  console.log('\n🎯 检查页面元素:');
  
  // 检查催单建议筛选框
  const reminderSelect = document.querySelector('[name="reminder_suggestion"]');
  if (reminderSelect) {
    console.log('✅ 催单建议筛选框: 存在');
  } else {
    console.log('❌ 催单建议筛选框: 未找到');
  }
  
  // 检查表格列
  const tableHeaders = document.querySelectorAll('.ant-table-thead th');
  const headerTexts = Array.from(tableHeaders).map(th => th.textContent);
  
  console.log('\n📊 表格列顺序:');
  headerTexts.forEach((text, index) => {
    console.log(`  ${index + 1}. ${text}`);
  });
  
  // 验证列顺序
  const expectedOrder = ['用户微信号', '销售微信号', '催单建议'];
  const actualOrder = headerTexts.slice(0, 3);
  
  if (JSON.stringify(actualOrder) === JSON.stringify(expectedOrder)) {
    console.log('✅ 列顺序正确');
  } else {
    console.log('⚠️ 列顺序可能不正确');
  }
  
  // 检查固定列
  const fixedColumns = document.querySelectorAll('.ant-table-fixed-left');
  if (fixedColumns.length > 0) {
    console.log(`✅ 固定列数量: ${fixedColumns.length}`);
  } else {
    console.log('⚠️ 未检测到固定列');
  }
}

// 检查订单数据
async function checkOrdersData() {
  console.log('\n📊 检查订单数据:');
  
  const { data: orders, error } = await supabaseClient
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(10);
  
  if (error) {
    console.error('查询失败:', error);
    return;
  }
  
  console.log(`\n最近10个订单的催单状态:`);
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  orders.forEach((order, index) => {
    if (order.expiry_time) {
      const expiryDate = new Date(order.expiry_time);
      expiryDate.setHours(0, 0, 0, 0);
      const daysDiff = Math.floor((expiryDate - today) / (1000 * 60 * 60 * 24));
      
      const needReminder = daysDiff <= 7 && daysDiff >= 0 && 
                          order.status !== 'confirmed_config' && 
                          order.status !== 'active' && 
                          order.status !== 'expired';
      
      console.log(`${index + 1}. ${order.customer_wechat || '无'}: ${daysDiff}天后到期, 状态=${order.status}, 需催单=${needReminder ? '是' : '否'}`);
    } else {
      console.log(`${index + 1}. ${order.customer_wechat || '无'}: 无到期时间`);
    }
  });
}

// 主测试流程
async function runTests() {
  console.log('\n🚀 开始测试催单功能...\n');
  
  // 1. 检查页面元素
  checkPageElements();
  
  // 2. 检查现有订单数据
  await checkOrdersData();
  
  // 3. 测试筛选功能
  testReminderFilter();
  
  console.log('\n' + '='.repeat(50));
  console.log('✨ 测试指南完成！\n');
  
  console.log('可选操作:');
  console.log('- createReminderTestOrders() : 创建催单测试订单');
  console.log('- checkOrdersData()          : 检查订单催单状态');
  console.log('- checkPageElements()        : 检查页面元素');
}

// 导出函数
window.createReminderTestOrders = createReminderTestOrders;
window.checkOrdersData = checkOrdersData;
window.checkPageElements = checkPageElements;
window.runTests = runTests;

// 自动运行
console.log('运行 runTests() 开始测试');
console.log('运行 createReminderTestOrders() 创建测试数据');
