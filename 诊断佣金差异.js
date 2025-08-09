// 精确诊断佣金差异问题
// 在管理后台控制台运行

async function diagnoseCommissionGap() {
  console.log('%c===== 佣金差异诊断（444 vs 635.20）=====', 'color: #f5222d; font-size: 16px; font-weight: bold;');
  
  if (!window.AdminAPI) {
    console.error('请在管理后台页面运行');
    return;
  }
  
  try {
    // 1. 获取所有数据
    const [ordersData, salesData, statsData] = await Promise.all([
      AdminAPI.getOrders({ status: 'confirmed_config', limit: 1000 }),
      AdminAPI.getSales(),
      AdminAPI.getStats()
    ]);
    
    console.log('\n📊 系统显示的佣金总额: $' + (statsData?.commission_amount || 0));
    
    // 2. 分析1588元订单
    console.log('\n💰 1588元订单分析:');
    const order1588 = ordersData.orders?.find(o => o.amount === 1588);
    if (order1588) {
      console.log('订单详情:', {
        ID: order1588.id,
        状态: order1588.status,
        金额: order1588.amount,
        销售类型: order1588.sales_type,
        销售微信: order1588.sales_wechat,
        销售代码: order1588.sales_code,
        一级销售: order1588.primary_sales_wechat
      });
      
      // 查找相关销售信息
      const salesInfo = salesData.sales?.find(s => s.sales?.sales_code === order1588.sales_code);
      const primaryInfo = salesData.sales?.find(s => s.sales?.wechat_name === order1588.primary_sales_wechat);
      
      console.log('\n销售信息:');
      if (salesInfo) {
        console.log(`${order1588.sales_wechat}:`, {
          类型: salesInfo.sales_display_type,
          佣金率: salesInfo.commission_rate + '%',
          应返佣金: '$' + salesInfo.commission_amount
        });
      }
      
      if (primaryInfo) {
        console.log(`${order1588.primary_sales_wechat}（一级）:`, {
          佣金率: primaryInfo.commission_rate + '%',
          应返佣金: '$' + primaryInfo.commission_amount
        });
      }
      
      // 计算期望佣金
      console.log('\n✅ 期望的佣金计算:');
      if (order1588.sales_type === '二级销售') {
        const secRate = salesInfo?.commission_rate || 25;
        const priRate = primaryInfo?.commission_rate || 0;
        
        const secCommission = 1588 * (secRate / 100);
        const priCommission = priRate > 0 ? 1588 * ((40 - secRate) / 100) : 0;
        
        console.log(`二级销售 ${secRate}%: $${secCommission.toFixed(2)}`);
        console.log(`一级销售 ${priRate > 0 ? (40 - secRate) : 0}%: $${priCommission.toFixed(2)}`);
        console.log(`合计: $${(secCommission + priCommission).toFixed(2)}`);
      }
    }
    
    // 3. 分析所有订单的佣金
    console.log('\n📋 所有已配置确认订单的佣金:');
    let manualTotal = 0;
    let systemTotal = 0;
    
    ordersData.orders?.forEach(order => {
      const amount = order.amount;
      let expectedCommission = 0;
      let actualCommission = 0;
      
      // 找销售信息
      const sale = salesData.sales?.find(s => s.sales?.sales_code === order.sales_code);
      
      if (sale) {
        actualCommission = sale.commission_amount || 0;
        systemTotal += actualCommission;
      }
      
      // 手动计算期望佣金
      if (order.sales_wechat === '张子俊' || order.sales_wechat === 'Liangjunhao889') {
        expectedCommission = 0; // 特殊设置0%
      } else if (order.sales_type === '二级销售') {
        const secRate = sale?.commission_rate || 25;
        expectedCommission = amount * (secRate / 100);
        
        // 如果一级不是张子俊，加上一级的佣金
        if (order.primary_sales_wechat !== '张子俊') {
          expectedCommission += amount * ((40 - secRate) / 100);
        }
      } else if (order.sales_type === '独立销售') {
        expectedCommission = amount * 0.25;
      } else {
        // 一级销售
        const priRate = sale?.commission_rate || 40;
        expectedCommission = amount * (priRate / 100);
      }
      
      manualTotal += expectedCommission;
      
      if (Math.abs(expectedCommission - actualCommission) > 1) {
        console.log(`⚠️ 订单${order.id}: 期望$${expectedCommission.toFixed(2)}, 实际$${actualCommission}`);
      }
    });
    
    // 4. 分析销售管理页面的佣金汇总
    console.log('\n💵 销售管理页面佣金汇总:');
    let salesPageTotal = 0;
    salesData.sales?.forEach(sale => {
      if (sale.commission_amount > 0) {
        salesPageTotal += sale.commission_amount;
        console.log(`${sale.sales?.wechat_name || sale.name}: $${sale.commission_amount.toFixed(2)}`);
      }
    });
    
    // 5. 最终对比
    console.log('\n%c===== 最终对比 =====', 'color: #722ed1; font-size: 14px; font-weight: bold;');
    console.log(`系统统计显示: $${statsData?.commission_amount || 0}`);
    console.log(`销售页面汇总: $${salesPageTotal.toFixed(2)}`);
    console.log(`手动计算期望: $${manualTotal.toFixed(2)}`);
    
    console.log('\n❓ 差异分析:');
    const gap = manualTotal - (statsData?.commission_amount || 0);
    console.log(`差额: $${gap.toFixed(2)}`);
    
    if (gap > 100) {
      console.log('可能原因:');
      console.log('1. 一级销售（张子俊）的佣金率是0%，但系统可能还在按40%计算');
      console.log('2. 二级销售订单的一级佣金没有正确计算');
      console.log('3. 某些订单的销售类型识别错误');
    }
    
    // 6. 检查特殊情况
    console.log('\n🔍 特殊销售检查:');
    const zhangzijun = salesData.sales?.find(s => s.sales?.wechat_name === '张子俊');
    const liangjunhao = salesData.sales?.find(s => s.sales?.wechat_name === 'Liangjunhao889');
    
    if (zhangzijun) {
      console.log('张子俊:', {
        佣金率: zhangzijun.commission_rate + '%',
        订单数: zhangzijun.total_orders,
        应返佣金: '$' + zhangzijun.commission_amount
      });
    }
    
    if (liangjunhao) {
      console.log('Liangjunhao889:', {
        佣金率: liangjunhao.commission_rate + '%',
        订单数: liangjunhao.total_orders,
        应返佣金: '$' + liangjunhao.commission_amount
      });
    }
    
    return {
      系统显示: statsData?.commission_amount || 0,
      期望值: manualTotal.toFixed(2),
      差额: gap.toFixed(2)
    };
    
  } catch (error) {
    console.error('诊断失败:', error);
  }
}

// 执行诊断
diagnoseCommissionGap();
