// 在浏览器控制台运行此脚本来检查e8257的订单数据

(async () => {
  console.log('🔍 检查e8257用户的订单数据...');
  
  // 获取Redux store中的订单数据
  const state = window.store?.getState();
  if (!state) {
    console.error('无法获取Redux state');
    return;
  }
  
  const orders = state.admin?.orders || [];
  console.log(`总共有 ${orders.length} 个订单`);
  
  // 查找e8257的订单
  const e8257Orders = orders.filter(order => 
    order.tradingview_username?.toLowerCase().includes('e8257') ||
    order.customer_name?.toLowerCase().includes('e8257') ||
    order.customer_wechat?.toLowerCase().includes('e8257')
  );
  
  if (e8257Orders.length > 0) {
    console.log(`\n找到 ${e8257Orders.length} 个e8257的订单:`);
    e8257Orders.forEach((order, index) => {
      console.log(`\n订单 ${index + 1}:`);
      console.log('-----------------------------------');
      console.log('订单ID:', order.id);
      console.log('订单号:', order.order_number);
      console.log('TradingView用户名:', order.tradingview_username);
      console.log('客户名称:', order.customer_name);
      console.log('客户微信:', order.customer_wechat);
      console.log('购买时长(duration):', order.duration);
      console.log('订单金额(amount):', order.amount);
      console.log('应付金额(payable_amount):', order.payable_amount);
      console.log('实付金额(paid_amount):', order.paid_amount);
      console.log('原价(original_price):', order.original_price);
      console.log('折扣率(discount_rate):', order.discount_rate);
      console.log('订单状态:', order.status);
      console.log('支付状态:', order.payment_status);
      console.log('创建时间:', order.created_at);
      console.log('销售代码:', order.sales_code);
      console.log('-----------------------------------');
    });
  } else {
    console.log('未找到e8257的订单');
  }
  
  // 检查所有$1588订单的duration
  console.log('\n\n检查所有$1588订单的duration分布:');
  const orders1588 = orders.filter(order => order.amount === 1588 || order.amount === '1588');
  console.log(`找到 ${orders1588.length} 个$1588订单`);
  
  const durationCount = {};
  orders1588.forEach(order => {
    const key = `${order.duration} | payable:${order.payable_amount} | paid:${order.paid_amount}`;
    durationCount[key] = (durationCount[key] || 0) + 1;
  });
  
  console.log('\nduration分布:');
  Object.entries(durationCount).forEach(([key, count]) => {
    console.log(`  ${key}: ${count} 个订单`);
  });
})();