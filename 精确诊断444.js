// 精确诊断444元佣金来源
async function diagnose444Commission() {
  console.log('%c===== 精确诊断444元佣金来源 =====', 'color: #f5222d; font-size: 16px; font-weight: bold;');
  
  // 获取销售数据
  const salesData = await AdminAPI.getSales();
  
  console.log('\n📊 所有销售的应返佣金明细:');
  let totalFromSales = 0;
  let details = [];
  
  salesData.sales?.forEach(sale => {
    if (sale.commission_amount > 0) {
      totalFromSales += sale.commission_amount;
      details.push({
        销售: sale.sales?.wechat_name || sale.name,
        类型: sale.sales_display_type,
        订单数: sale.total_orders,
        订单金额: sale.total_amount,
        佣金率: sale.commission_rate + '%',
        应返佣金: sale.commission_amount
      });
      
      console.log(`${sale.sales?.wechat_name}: ${sale.total_orders}单, $${sale.total_amount}, ${sale.commission_rate}%, 应返$${sale.commission_amount}`);
    }
  });
  
  console.table(details);
  console.log(`\n销售页面佣金总计: $${totalFromSales.toFixed(2)}`);
  
  // 获取统计数据
  const stats = await AdminAPI.getStats();
  console.log(`数据概览显示: $${stats?.commission_amount || 0}`);
  
  // 分析差异
  console.log('\n🔍 差异分析:');
  console.log(`销售页面总计: $${totalFromSales.toFixed(2)}`);
  console.log(`数据概览显示: $${stats?.commission_amount || 0}`);
  console.log(`差异: $${(totalFromSales - (stats?.commission_amount || 0)).toFixed(2)}`);
  
  // 具体分析每个销售
  console.log('\n💡 关键销售分析:');
  
  // 找1588元订单的销售
  const sale1588 = salesData.sales?.find(s => 
    s.total_amount === 1588 || s.confirmed_amount === 1588
  );
  
  if (sale1588) {
    console.log('1588元订单销售:', {
      销售: sale1588.sales?.wechat_name,
      佣金率: sale1588.commission_rate + '%',
      应返: '$' + sale1588.commission_amount,
      计算: `1588 × ${sale1588.commission_rate}% = $${(1588 * sale1588.commission_rate / 100).toFixed(2)}`
    });
  }
  
  // 找188元订单的销售
  const sale188 = salesData.sales?.find(s => 
    s.total_amount === 188 || s.confirmed_amount === 188
  );
  
  if (sale188) {
    console.log('188元订单销售:', {
      销售: sale188.sales?.wechat_name,
      佣金率: sale188.commission_rate + '%',
      应返: '$' + sale188.commission_amount,
      计算: `188 × ${sale188.commission_rate}% = $${(188 * sale188.commission_rate / 100).toFixed(2)}`
    });
  }
  
  // 分析444的组成
  console.log('\n📐 444元可能的组成:');
  console.log('方案1: 1588×25% = $397 + 188×25% = $47 = $444');
  console.log('方案2: 1588×28% ≈ $444.64');
  console.log('方案3: 1110×40% = $444');
  
  // 查找可能的组合
  console.log('\n🔍 寻找等于444的组合:');
  const allSales = salesData.sales || [];
  
  // 检查单个销售
  allSales.forEach(sale => {
    if (Math.abs(sale.commission_amount - 444) < 1) {
      console.log(`✅ 找到: ${sale.sales?.wechat_name} 应返佣金正好是 $${sale.commission_amount}`);
    }
  });
  
  // 检查两个销售的组合
  for (let i = 0; i < allSales.length; i++) {
    for (let j = i + 1; j < allSales.length; j++) {
      const sum = (allSales[i].commission_amount || 0) + (allSales[j].commission_amount || 0);
      if (Math.abs(sum - 444) < 1) {
        console.log(`✅ 找到组合: ${allSales[i].sales?.wechat_name}($${allSales[i].commission_amount}) + ${allSales[j].sales?.wechat_name}($${allSales[j].commission_amount}) = $${sum.toFixed(2)}`);
      }
    }
  }
  
  return {
    销售页面总计: totalFromSales.toFixed(2),
    数据概览显示: stats?.commission_amount || 0,
    差异: (totalFromSales - (stats?.commission_amount || 0)).toFixed(2)
  };
}

// 执行诊断
diagnose444Commission();
