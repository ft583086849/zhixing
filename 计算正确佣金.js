// 按照正确逻辑计算佣金
// 在管理后台控制台运行

async function calculateCorrectCommission() {
  console.log('%c===== 正确佣金计算 =====', 'color: #52c41a; font-size: 16px; font-weight: bold;');
  
  if (!window.AdminAPI) {
    console.error('请在管理后台页面运行');
    return;
  }
  
  try {
    // 获取所有数据
    const [ordersData, salesData] = await Promise.all([
      AdminAPI.getOrders({ status: 'confirmed_config' }),
      AdminAPI.getSales()
    ]);
    
    console.log('\n📦 已配置确认订单分析:');
    console.log(`订单总数: ${ordersData.orders?.length || 0}`);
    
    // 建立销售映射
    const salesMap = new Map();
    salesData.sales?.forEach(sale => {
      if (sale.sales?.sales_code) {
        salesMap.set(sale.sales.sales_code, sale);
      }
    });
    
    // 计算每个订单的佣金
    let totalCommission = 0;
    let orderDetails = [];
    
    ordersData.orders?.forEach(order => {
      const amount = parseFloat(order.amount || 0);
      const salesCode = order.sales_code;
      const salesInfo = salesMap.get(salesCode);
      
      let orderCommission = 0;
      let commissionBreakdown = '';
      
      if (order.sales_type === '二级销售') {
        // 二级销售订单
        const secondaryRate = salesInfo?.commission_rate || 25;
        const secondaryCommission = amount * (secondaryRate / 100);
        
        // 查找一级销售
        const primarySalesCode = order.primary_sales_code;
        const primaryInfo = salesMap.get(primarySalesCode);
        const primaryRate = primaryInfo?.commission_rate || 0;
        
        let primaryCommission = 0;
        if (primaryRate > 0) {
          // 一级销售佣金率不为0时，获得剩余佣金
          primaryCommission = amount * ((40 - secondaryRate) / 100);
        }
        
        orderCommission = secondaryCommission + primaryCommission;
        commissionBreakdown = `二级${secondaryRate}%=$${secondaryCommission.toFixed(2)} + 一级${primaryRate > 0 ? (40-secondaryRate) : 0}%=$${primaryCommission.toFixed(2)}`;
        
      } else if (order.sales_type === '一级销售') {
        // 一级销售订单
        const primaryRate = salesInfo?.commission_rate || 40;
        orderCommission = amount * (primaryRate / 100);
        commissionBreakdown = `一级${primaryRate}%`;
        
      } else if (order.sales_type === '独立销售') {
        // 独立销售订单
        const independentRate = salesInfo?.commission_rate || 25;
        orderCommission = amount * (independentRate / 100);
        commissionBreakdown = `独立${independentRate}%`;
        
      } else {
        // 未知类型，按40%计算
        orderCommission = amount * 0.4;
        commissionBreakdown = '默认40%';
      }
      
      totalCommission += orderCommission;
      
      orderDetails.push({
        订单ID: order.id,
        金额: amount,
        销售类型: order.sales_type || '未知',
        销售: order.sales_wechat || salesCode,
        佣金计算: commissionBreakdown,
        佣金额: orderCommission.toFixed(2)
      });
      
      console.log(`订单${order.id}: $${amount} ${order.sales_type} -> $${orderCommission.toFixed(2)} (${commissionBreakdown})`);
    });
    
    // 显示详细表格
    console.log('\n📋 订单佣金明细:');
    console.table(orderDetails);
    
    // 特殊情况检查
    console.log('\n🔍 特殊设置:');
    salesData.sales?.forEach(sale => {
      if (sale.commission_rate === 0 && sale.total_orders > 0) {
        console.log(`${sale.sales?.wechat_name || sale.name}: 佣金率0%, ${sale.total_orders}个订单`);
      }
    });
    
    // 获取已返佣金额
    let totalPaidCommission = 0;
    salesData.sales?.forEach(sale => {
      const paid = sale.paid_commission || 0;
      if (paid > 0) {
        totalPaidCommission += paid;
        console.log(`${sale.name} 已返: $${paid}`);
      }
    });
    
    // 计算待返佣金
    const pendingCommission = totalCommission - totalPaidCommission;
    
    // 结果汇总
    console.log('\n%c===== 计算结果 =====', 'color: #f5222d; font-size: 16px; font-weight: bold;');
    console.log(`应返佣金总额: $${totalCommission.toFixed(2)}`);
    console.log(`已返佣金总额: $${totalPaidCommission.toFixed(2)}`);
    console.log(`待返佣金总额: $${pendingCommission.toFixed(2)}`);
    
    // 对比系统显示
    const stats = await AdminAPI.getStats();
    console.log('\n📊 系统显示对比:');
    console.log(`系统显示佣金: $${stats?.commission_amount || 0}`);
    console.log(`差异: $${(totalCommission - (stats?.commission_amount || 0)).toFixed(2)}`);
    
    // 具体分析
    console.log('\n💡 关键点:');
    console.log('1. 张子俊(一级)佣金率0%，不获得任何佣金');
    console.log('2. Liangjunhao889(二级)佣金率0%，不获得任何佣金');
    console.log('3. 独立销售默认25%佣金率');
    console.log('4. 1588元订单：二级25%($397) + 一级0%($0) = $397');
    console.log('5. 188元订单：如果是张子俊的，佣金为$0');
    
    return {
      应返佣金: totalCommission.toFixed(2),
      已返佣金: totalPaidCommission.toFixed(2),
      待返佣金: pendingCommission.toFixed(2)
    };
    
  } catch (error) {
    console.error('计算失败:', error);
  }
}

// 执行计算
calculateCorrectCommission();
