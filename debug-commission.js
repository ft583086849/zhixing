// 在浏览器控制台运行，检查佣金统计数据

console.log('=== 检查佣金统计数据 ===');

// 1. 检查API返回的stats数据中的佣金字段
AdminAPI.getStats({ timeRange: 'all' }).then(stats => {
  console.log('\n1. API返回的完整stats数据:');
  console.log('stats对象:', stats);
  
  console.log('\n2. 佣金相关字段:');
  const commissionFields = [
    'total_commission', 'commission_amount', 'pending_commission', 
    'pending_commission_amount', 'paid_commission', 'total_commission_amount'
  ];
  
  commissionFields.forEach(field => {
    console.log(`  ${field}: ${stats[field]} (${typeof stats[field]})`);
  });
  
  console.log('\n3. 所有包含commission的字段:');
  Object.keys(stats).filter(key => key.includes('commission')).forEach(key => {
    console.log(`  ${key}: ${stats[key]}`);
  });
});

// 2. 检查销售数据中的佣金统计
AdminAPI.getSales({ timeRange: 'all' }).then(sales => {
  console.log('\n4. 销售数据中的佣金统计:');
  
  let totalCommission = 0;
  let pendingCommission = 0;
  let paidCommission = 0;
  
  sales.forEach(sale => {
    const saleCommission = sale.total_commission || sale.commission_amount || 0;
    const salePending = sale.pending_commission || 0;
    const salePaid = sale.paid_commission || 0;
    
    totalCommission += saleCommission;
    pendingCommission += salePending;
    paidCommission += salePaid;
    
    if (saleCommission > 0) {
      console.log(`  销售 ${sale.wechat_name}: 总佣金$${saleCommission}, 待付$${salePending}, 已付$${salePaid}`);
    }
  });
  
  console.log('\n5. 手动计算的佣金汇总:');
  console.log(`  总佣金: $${totalCommission.toFixed(2)}`);
  console.log(`  待付佣金: $${pendingCommission.toFixed(2)}`);
  console.log(`  已付佣金: $${paidCommission.toFixed(2)}`);
});

// 3. 检查订单状态问题
AdminAPI.getOrders({ status: 'pending_payment' }).then(orders => {
  console.log('\n6. 待付款确认订单:');
  console.log(`  数量: ${orders.length}`);
  if (orders.length > 0) {
    console.log('  前3个订单状态:', orders.slice(0, 3).map(o => ({
      id: o.id,
      status: o.status,
      order_number: o.order_number
    })));
  }
});

AdminAPI.getOrders({ status: 'pending_config' }).then(orders => {
  console.log('\n7. 待配置确认订单:');
  console.log(`  数量: ${orders.length}`);
  if (orders.length > 0) {
    console.log('  前3个订单状态:', orders.slice(0, 3).map(o => ({
      id: o.id,
      status: o.status,
      order_number: o.order_number
    })));
  }
});