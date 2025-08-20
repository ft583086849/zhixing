// 在浏览器控制台执行此代码查看e8257的数据

// 从Redux store获取订单数据
const state = window.store?.getState();
if (!state) {
  console.error('无法获取Redux state');
} else {
  const orders = state.admin?.orders || [];
  console.log(`总共有 ${orders.length} 个订单`);
  
  // 查找e8257的订单
  const e8257Orders = orders.filter(order => 
    order.tradingview_username?.toLowerCase().includes('e8257')
  );
  
  if (e8257Orders.length > 0) {
    console.log(`找到 ${e8257Orders.length} 个e8257的订单:`);
    e8257Orders.forEach(order => {
      console.log('-------------------');
      console.log('订单ID:', order.id);
      console.log('用户名:', order.tradingview_username);
      console.log('购买时长(duration):', order.duration);
      console.log('订单金额(amount):', order.amount);
      console.log('实付金额(paid_amount):', order.paid_amount);
      console.log('原价(original_price):', order.original_price);
      console.log('销售微信:', order.sales_wechat_display);
      console.log('-------------------');
    });
    
    // 检查问题
    e8257Orders.forEach(order => {
      if (order.duration === '3months' && order.amount === 1588) {
        console.warn('⚠️ 数据不一致: duration是3months但amount是$1588');
        console.warn('  3个月应该是$488，1年才是$1588');
      }
    });
  } else {
    console.log('未找到e8257的订单');
  }
}