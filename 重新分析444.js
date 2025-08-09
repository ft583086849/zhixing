// 重新分析444元的来源
async function reanalyze444() {
  console.log('%c===== 重新分析444元 =====', 'color: #f5222d; font-size: 16px; font-weight: bold;');
  
  // 1. 获取所有订单
  const ordersData = await AdminAPI.getOrders({ limit: 1000 });
  console.log(`\n总订单数: ${ordersData.orders?.length}`);
  
  // 2. 筛选已配置确认的订单
  const confirmedOrders = ordersData.orders?.filter(o => 
    o.status === 'confirmed_config'
  ) || [];
  
  console.log(`已配置确认订单: ${confirmedOrders.length}个`);
  
  // 3. 详细分析每个订单
  console.log('\n订单明细:');
  let totalAmount = 0;
  let commission40 = 0;
  let commission25 = 0;
  let actualCommission = 0;
  
  confirmedOrders.forEach((order, index) => {
    const amount = order.amount;
    totalAmount += amount;
    
    // 按40%计算
    const c40 = amount * 0.4;
    commission40 += c40;
    
    // 按25%计算
    const c25 = amount * 0.25;
    commission25 += c25;
    
    console.log(`${index+1}. 订单${order.id}`);
    console.log(`   金额: $${amount}`);
    console.log(`   销售: ${order.sales_wechat || order.sales_code}`);
    console.log(`   类型: ${order.sales_type}`);
    console.log(`   40%: $${c40}, 25%: $${c25}`);
    
    // 根据实际情况计算
    if (order.sales_wechat === '张子俊' || order.sales_wechat === 'Liangjunhao889') {
      console.log(`   实际: $0 (特殊0%)`);
    } else if (order.sales_type === '二级销售') {
      const commission = amount * 0.25;
      actualCommission += commission;
      console.log(`   实际: $${commission} (二级25%)`);
    } else {
      const commission = amount * 0.4;
      actualCommission += commission;
      console.log(`   实际: $${commission} (一级40%)`);
    }
  });
  
  console.log('\n===== 汇总 =====');
  console.log(`订单总额: $${totalAmount}`);
  console.log(`按40%计算: $${commission40.toFixed(2)}`);
  console.log(`按25%计算: $${commission25.toFixed(2)}`);
  console.log(`按实际计算: $${actualCommission.toFixed(2)}`);
  
  // 4. 查看是否444来自特定算法
  console.log('\n===== 444的可能来源 =====');
  
  // 检查是否是总额的某个百分比
  const rate444 = (444 / totalAmount * 100).toFixed(2);
  console.log(`444是总额的 ${rate444}%`);
  
  // 检查具体组合
  if (Math.abs(commission25 - 444) < 1) {
    console.log('✅ 444 = 所有订单按25%计算');
  }
  
  if (Math.abs(1776 * 0.25 - 444) < 1) {
    console.log('✅ 444 = (1588+188) × 25%');
  }
  
  // 5. 获取销售数据对比
  const salesData = await AdminAPI.getSales();
  console.log('\n===== 销售页面数据 =====');
  
  let salesTotal = 0;
  salesData.sales?.forEach(sale => {
    if (sale.commission_amount > 0) {
      salesTotal += sale.commission_amount;
      console.log(`${sale.sales?.wechat_name}: $${sale.commission_amount} (${sale.commission_rate}%)`);
    }
  });
  
  console.log(`销售页面总计: $${salesTotal}`);
  
  // 6. 最终对比
  const stats = await AdminAPI.getStats();
  console.log('\n===== 最终对比 =====');
  console.log(`统计API: $${stats?.commission_amount}`);
  console.log(`销售页面: $${salesTotal}`);
  console.log(`实际计算: $${actualCommission}`);
  
  return {
    订单总额: totalAmount,
    统计显示: stats?.commission_amount,
    销售页面: salesTotal,
    实际计算: actualCommission
  };
}

reanalyze444();
