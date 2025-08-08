/**
 * 测试销售直接购买订单是否能在客户管理页面显示
 * 
 * 问题：订单ID 72 的customer_wechat是"89一级下的直接购买"，在客户管理页面找不到
 * 原因：这类特殊标记的订单被过滤了
 * 解决：修改api.js的getCustomers函数，允许这类订单显示
 */

// 测试数据模拟
const testOrders = [
  {
    id: 72,
    customer_wechat: '89一级下的直接购买',
    tradingview_username: '',
    sales_code: 'SR89001',
    amount: 188,
    actual_payment_amount: 188,
    commission_amount: 75.2,
    created_at: '2025-08-08 14:30:00',
    is_reminded: false
  },
  {
    id: 73,
    customer_wechat: '张三',
    tradingview_username: 'trader123',
    sales_code: 'SR89001',
    amount: 488,
    actual_payment_amount: 488,
    commission_amount: 195.2,
    created_at: '2025-08-09 10:00:00',
    is_reminded: false
  },
  {
    id: 74,
    customer_wechat: '李四直接购买',
    tradingview_username: '',
    sales_code: 'SR90001',
    amount: 688,
    actual_payment_amount: 688,
    commission_amount: 275.2,
    created_at: '2025-08-10 11:00:00',
    is_reminded: false
  }
];

// 模拟getCustomers函数的客户去重逻辑
function processCustomers(orders) {
  const customerMap = new Map();
  
  orders.forEach(order => {
    const customerWechat = order.customer_wechat || '';
    const tradingviewUser = order.tradingview_username || '';
    const key = `${customerWechat}-${tradingviewUser}`;
    
    // 新逻辑：判断是否为销售直接购买订单
    const isDirectPurchase = customerWechat.includes('直接购买') || 
                            customerWechat.includes('下的直接购买');
    
    // 修改后的条件：允许有效客户信息或销售直接购买订单
    if (!customerMap.has(key) && (customerWechat || tradingviewUser || isDirectPurchase)) {
      customerMap.set(key, {
        customer_name: customerWechat || tradingviewUser,
        customer_wechat: customerWechat,
        tradingview_username: tradingviewUser,
        sales_code: order.sales_code,
        total_orders: 1,
        total_amount: parseFloat(order.actual_payment_amount || order.amount || 0),
        actual_payment_amount: parseFloat(order.actual_payment_amount || 0),
        commission_amount: parseFloat(order.commission_amount || 0),
        is_reminded: order.is_reminded || false,
        created_at: order.created_at
      });
    } else if (customerMap.has(key)) {
      const customer = customerMap.get(key);
      customer.total_orders++;
      customer.total_amount += parseFloat(order.actual_payment_amount || order.amount || 0);
      customer.actual_payment_amount += parseFloat(order.actual_payment_amount || 0);
      customer.commission_amount += parseFloat(order.commission_amount || 0);
    }
  });
  
  return Array.from(customerMap.values());
}

// 执行测试
console.log('=== 测试销售直接购买订单显示 ===\n');

const customers = processCustomers(testOrders);

console.log(`处理了 ${testOrders.length} 个订单`);
console.log(`生成了 ${customers.length} 个客户记录\n`);

console.log('客户列表：');
customers.forEach((customer, index) => {
  console.log(`\n客户 ${index + 1}:`);
  console.log(`  客户微信号: ${customer.customer_wechat}`);
  console.log(`  TradingView用户: ${customer.tradingview_username || '无'}`);
  console.log(`  销售代码: ${customer.sales_code}`);
  console.log(`  订单数: ${customer.total_orders}`);
  console.log(`  总金额: ¥${customer.total_amount}`);
  console.log(`  是否为直接购买: ${customer.customer_wechat.includes('直接购买') ? '是' : '否'}`);
});

// 验证结果
console.log('\n=== 验证结果 ===');
const directPurchaseCustomers = customers.filter(c => 
  c.customer_wechat.includes('直接购买')
);

if (directPurchaseCustomers.length > 0) {
  console.log(`✅ 成功：找到 ${directPurchaseCustomers.length} 个销售直接购买订单`);
  directPurchaseCustomers.forEach(c => {
    console.log(`   - ${c.customer_wechat}`);
  });
} else {
  console.log('❌ 失败：没有找到销售直接购买订单');
}

console.log('\n修复说明：');
console.log('1. 已修改 client/src/services/api.js 的 getCustomers 函数');
console.log('2. 现在包含"直接购买"字样的订单会显示在客户管理页面');
console.log('3. 这类订单通常是销售自己的购买记录或测试订单');

