// 基于当前正确逻辑计算销售返佣金额
async function calculateCorrectTotalCommission() {
  console.log('%c===== 正确的销售返佣金额计算 =====', 'color: #52c41a; font-size: 16px; font-weight: bold;');
  
  console.log('\n📋 计算逻辑说明:');
  console.log('1. 每个订单根据实际销售人和佣金率计算');
  console.log('2. 张子俊: 0%佣金率');
  console.log('3. Liangjunhao889: 0%佣金率');
  console.log('4. 其他二级销售: 默认25%');
  console.log('5. 独立销售: 默认25%');
  console.log('6. 其他一级销售: 默认40%');
  console.log('7. 二级销售订单: 二级拿设定佣金，一级拿剩余(40%-二级佣金率)');
  
  try {
    // 获取销售数据（这是最准确的）
    const salesData = await AdminAPI.getSales();
    
    console.log('\n📊 从销售管理页面获取的数据:');
    console.log(`销售总数: ${salesData.sales?.length || 0}`);
    
    // 计算总佣金
    let totalCommission = 0;
    let details = [];
    
    salesData.sales?.forEach(sale => {
      const salesName = sale.sales?.wechat_name || sale.name || sale.sales?.sales_code;
      const salesType = sale.sales_display_type;
      const commissionRate = sale.commission_rate || 0;
      const totalOrders = sale.total_orders || 0;
      const totalAmount = sale.total_amount || 0;
      const confirmedAmount = sale.confirmed_amount || 0;
      const commissionAmount = sale.commission_amount || 0;
      
      // 累加佣金
      totalCommission += commissionAmount;
      
      if (totalOrders > 0 || commissionAmount > 0) {
        details.push({
          销售: salesName,
          类型: salesType,
          订单数: totalOrders,
          订单金额: totalAmount,
          确认金额: confirmedAmount,
          佣金率: commissionRate + '%',
          应返佣金: commissionAmount
        });
        
        console.log(`\n${salesName} (${salesType}):`);
        console.log(`  订单: ${totalOrders}个`);
        console.log(`  金额: $${totalAmount.toFixed(2)}`);
        console.log(`  确认金额: $${confirmedAmount.toFixed(2)}`);
        console.log(`  佣金率: ${commissionRate}%`);
        console.log(`  应返佣金: $${commissionAmount.toFixed(2)}`);
      }
    });
    
    console.log('\n📋 销售佣金明细表:');
    console.table(details);
    
    console.log('\n%c===== 计算结果 =====', 'color: #f5222d; font-size: 16px; font-weight: bold;');
    console.log(`✅ 正确的销售返佣金额: $${totalCommission.toFixed(2)}`);
    
    // 对比系统显示
    const stats = await AdminAPI.getStats();
    const systemShowing = stats?.commission_amount || 0;
    
    console.log(`\n📊 对比:`);
    console.log(`系统当前显示: $${systemShowing}`);
    console.log(`正确计算结果: $${totalCommission.toFixed(2)}`);
    console.log(`差异: $${(systemShowing - totalCommission).toFixed(2)}`);
    
    // 具体分析
    console.log('\n💡 关键订单分析:');
    
    // 找1588元订单
    const sale1588 = salesData.sales?.find(s => 
      s.total_amount === 1588 || s.confirmed_amount === 1588
    );
    
    if (sale1588) {
      const name = sale1588.sales?.wechat_name || sale1588.name;
      console.log(`\n1588元订单:`);
      console.log(`  销售: ${name}`);
      console.log(`  佣金率: ${sale1588.commission_rate}%`);
      console.log(`  应返佣金: $${sale1588.commission_amount}`);
      
      // 检查是否需要给一级销售佣金
      if (sale1588.sales_display_type === '关联二级销售') {
        console.log(`  类型: 二级销售`);
        console.log(`  二级佣金: $${sale1588.commission_amount}`);
        console.log(`  一级是否获得佣金: 取决于一级销售的佣金率设置`);
      }
    }
    
    // 找188元订单
    const sale188 = salesData.sales?.find(s => 
      s.total_amount === 188 || s.confirmed_amount === 188
    );
    
    if (sale188) {
      const name = sale188.sales?.wechat_name || sale188.name;
      console.log(`\n188元订单:`);
      console.log(`  销售: ${name}`);
      console.log(`  佣金率: ${sale188.commission_rate}%`);
      console.log(`  应返佣金: $${sale188.commission_amount}`);
    }
    
    console.log('\n%c===== 最终结论 =====', 'color: #722ed1; font-size: 16px; font-weight: bold;');
    console.log(`基于当前正确的计算逻辑:`);
    console.log(`销售返佣金额应该是: $${totalCommission.toFixed(2)}`);
    
    if (Math.abs(totalCommission - 397) < 1) {
      console.log('\n✅ 符合预期: 主要来自1588元订单的25%佣金($397)');
    } else if (Math.abs(totalCommission - 444) < 1) {
      console.log('\n⚠️ 可能包含了不应该计算的佣金');
    } else if (Math.abs(totalCommission - 635.20) < 1) {
      console.log('\n✅ 包含了完整的佣金分配（二级+一级）');
    }
    
    return {
      正确金额: totalCommission.toFixed(2),
      系统显示: systemShowing,
      差异: (systemShowing - totalCommission).toFixed(2)
    };
    
  } catch (error) {
    console.error('计算失败:', error);
  }
}

// 执行计算
calculateCorrectTotalCommission();
