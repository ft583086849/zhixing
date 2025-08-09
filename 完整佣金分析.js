// 完整的佣金体系分析
// 在浏览器控制台运行

async function analyzeFullCommissionSystem() {
  console.log('%c===== 完整佣金体系分析 =====', 'color: #f5222d; font-size: 16px; font-weight: bold;');
  
  if (!window.AdminAPI) {
    console.error('请在管理后台页面运行');
    return;
  }
  
  try {
    // 1. 获取所有销售数据
    console.log('\n📊 获取销售数据...');
    const salesData = await AdminAPI.getSales();
    
    // 按类型分组
    const primarySales = [];
    const secondarySales = [];
    const independentSales = [];
    
    salesData.sales?.forEach(sale => {
      if (sale.sales_display_type === '一级销售') {
        primarySales.push(sale);
      } else if (sale.sales_display_type === '关联二级销售') {
        secondarySales.push(sale);
      } else if (sale.sales_display_type === '独立销售') {
        independentSales.push(sale);
      }
    });
    
    console.log('\n👥 销售人员分布:');
    console.log(`一级销售: ${primarySales.length}人`);
    console.log(`二级销售: ${secondarySales.length}人`);
    console.log(`独立销售: ${independentSales.length}人`);
    
    // 2. 分析各类型销售的佣金
    let totalSystemCommission = 0;
    
    console.log('\n💰 一级销售佣金明细:');
    primarySales.forEach(sale => {
      if (sale.commission_amount > 0) {
        console.log(`${sale.name}: 订单${sale.total_orders}个, 金额$${sale.total_amount}, 佣金率${sale.commission_rate}%, 应返$${sale.commission_amount}`);
        totalSystemCommission += sale.commission_amount;
      }
    });
    
    console.log('\n💰 二级销售佣金明细:');
    secondarySales.forEach(sale => {
      if (sale.commission_amount > 0) {
        console.log(`${sale.name}: 订单${sale.total_orders}个, 金额$${sale.total_amount}, 佣金率${sale.commission_rate}%, 应返$${sale.commission_amount}`);
        totalSystemCommission += sale.commission_amount;
      }
    });
    
    console.log('\n💰 独立销售佣金明细:');
    independentSales.forEach(sale => {
      if (sale.commission_amount > 0) {
        console.log(`${sale.name}: 订单${sale.total_orders}个, 金额$${sale.total_amount}, 佣金率${sale.commission_rate}%, 应返$${sale.commission_amount}`);
        totalSystemCommission += sale.commission_amount;
      }
    });
    
    // 3. 获取订单数据验证
    console.log('\n📦 获取订单数据...');
    const ordersData = await AdminAPI.getOrders({ status: 'confirmed_config' });
    
    // 手动计算佣金
    let manualCalculatedCommission = 0;
    const ordersByType = {
      '一级销售': [],
      '二级销售': [],
      '独立销售': [],
      '未知': []
    };
    
    ordersData.orders?.forEach(order => {
      const type = order.sales_type || '未知';
      ordersByType[type].push(order);
      
      // 统一按40%计算总佣金池
      const orderCommission = order.amount * 0.4;
      manualCalculatedCommission += orderCommission;
      
      console.log(`订单${order.id}: ${type}, 金额$${order.amount}, 佣金$${orderCommission.toFixed(2)}`);
    });
    
    console.log('\n📈 订单分布:');
    Object.entries(ordersByType).forEach(([type, orders]) => {
      const total = orders.reduce((sum, o) => sum + o.amount, 0);
      console.log(`${type}: ${orders.length}单, 总额$${total.toFixed(2)}`);
    });
    
    // 4. 获取统计数据
    const stats = await AdminAPI.getStats();
    
    // 5. 对比分析
    console.log('\n%c===== 对比分析 =====', 'color: #722ed1; font-size: 14px; font-weight: bold;');
    console.log(`销售管理页面汇总: $${totalSystemCommission.toFixed(2)}`);
    console.log(`手动计算(40%): $${manualCalculatedCommission.toFixed(2)}`);
    console.log(`数据概览显示: $${stats?.commission_amount || stats?.sales_commission || 0}`);
    
    // 6. 分析差异原因
    console.log('\n❓ 可能的问题:');
    
    if (Math.abs(totalSystemCommission - manualCalculatedCommission) > 1) {
      console.log('⚠️ 销售佣金汇总与手动计算不符，可能原因：');
      console.log('  - 某些销售的佣金率设置有误');
      console.log('  - 独立销售的佣金计算逻辑不对');
      console.log('  - 二级销售订单的一级佣金没有计入');
    }
    
    // 7. 检查特殊情况
    console.log('\n🔍 检查特殊情况:');
    
    // 检查佣金率为0的销售
    const zeroCommissionSales = salesData.sales?.filter(s => 
      s.commission_rate === 0 && s.total_orders > 0
    );
    
    if (zeroCommissionSales?.length > 0) {
      console.log('⚠️ 以下销售佣金率为0:');
      zeroCommissionSales.forEach(s => {
        console.log(`  ${s.name}: ${s.total_orders}个订单，金额$${s.total_amount}`);
      });
    }
    
    // 检查独立销售
    if (independentSales.length > 0) {
      console.log('\n独立销售详情:');
      independentSales.forEach(sale => {
        console.log(`${sale.name}:`);
        console.log(`  佣金率: ${sale.commission_rate}%`);
        console.log(`  订单数: ${sale.total_orders}`);
        console.log(`  总金额: $${sale.total_amount}`);
        console.log(`  应返佣金: $${sale.commission_amount}`);
      });
    }
    
    // 8. 总结
    console.log('\n%c===== 总结 =====', 'color: #52c41a; font-size: 14px; font-weight: bold;');
    console.log('佣金计算逻辑应该是:');
    console.log('1. 每个订单都有40%的总佣金池');
    console.log('2. 二级销售订单: 二级拿设定比例，一级拿剩余部分');
    console.log('3. 一级销售订单: 一级拿40%');
    console.log('4. 独立销售订单: 独立销售拿设定比例（需确认）');
    
  } catch (error) {
    console.error('分析失败:', error);
  }
}

// 执行分析
analyzeFullCommissionSystem();
