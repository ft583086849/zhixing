// 在浏览器控制台运行此脚本
// 访问 https://zhixing-seven.vercel.app/admin/dashboard

async function analyzeCommissionDifference() {
  console.log('%c===== 佣金差异分析 =====', 'color: #f5222d; font-size: 16px; font-weight: bold;');
  
  try {
    // 1. 获取统计数据
    const statsResponse = await fetch('/api/admin/stats', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    
    if (statsResponse.ok) {
      const stats = await statsResponse.json();
      console.log('\n📊 数据概览统计:');
      console.log(`销售返佣金额: $${stats.sales_commission?.toFixed(2) || '0.00'}`);
      console.log('原始统计数据:', stats);
    }
    
    // 2. 获取所有订单详情
    const ordersResponse = await fetch('/api/admin/orders?limit=1000', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    
    if (!ordersResponse.ok) {
      console.error('获取订单失败');
      return;
    }
    
    const ordersData = await ordersResponse.json();
    console.log('\n📦 订单数据分析:');
    console.log(`总订单数: ${ordersData.orders?.length || 0}`);
    
    // 3. 查找1588元的订单
    const orders1588 = ordersData.orders?.filter(order => order.amount === 1588) || [];
    console.log(`\n💰 1588元订单数量: ${orders1588.length}`);
    
    if (orders1588.length > 0) {
      console.log('\n1588元订单详情:');
      orders1588.forEach((order, index) => {
        console.log(`\n订单${index + 1}:`);
        console.log(`  ID: ${order.id}`);
        console.log(`  状态: ${order.status}`);
        console.log(`  买家: ${order.user_wechat}`);
        console.log(`  销售: ${order.sales_wechat}`);
        console.log(`  销售类型: ${order.sales_type}`);
        console.log(`  一级销售: ${order.primary_sales_wechat || '-'}`);
        console.log(`  创建时间: ${new Date(order.created_at).toLocaleString('zh-CN')}`);
        console.log(`  金额: $${order.amount}`);
        
        // 计算该订单的佣金
        if (order.status === 'confirmed_config') {
          if (order.sales_type === '二级销售') {
            console.log(`  %c二级佣金: $397.00 (25%)`, 'color: #52c41a');
            console.log(`  %c一级佣金: $238.20 (15%)`, 'color: #52c41a');
            console.log(`  %c订单总佣金: $635.20`, 'color: #f5222d; font-weight: bold');
          } else {
            console.log(`  %c佣金: $635.20 (40%)`, 'color: #52c41a');
          }
        } else {
          console.log(`  ⚠️ 状态不是confirmed_config，不计算佣金`);
        }
      });
    }
    
    // 4. 分析所有已配置确认的订单
    const confirmedOrders = ordersData.orders?.filter(order => 
      order.status === 'confirmed_config'
    ) || [];
    
    console.log(`\n✅ 已配置确认订单数: ${confirmedOrders.length}`);
    
    // 计算总佣金
    let totalCommission = 0;
    let detailBreakdown = [];
    
    confirmedOrders.forEach(order => {
      let orderCommission = 0;
      let secondaryCommission = 0;
      let primaryCommission = 0;
      
      if (order.sales_type === '二级销售') {
        // 二级销售订单：二级拿25%，一级拿15%
        secondaryCommission = order.amount * 0.25;
        primaryCommission = order.amount * 0.15;
        orderCommission = secondaryCommission + primaryCommission;
      } else {
        // 一级或独立销售：40%
        orderCommission = order.amount * 0.4;
      }
      
      totalCommission += orderCommission;
      
      detailBreakdown.push({
        订单ID: order.id,
        金额: order.amount,
        销售类型: order.sales_type,
        佣金: orderCommission,
        二级佣金: secondaryCommission,
        一级佣金: primaryCommission
      });
    });
    
    console.log(`\n💵 手动计算总佣金: $${totalCommission.toFixed(2)}`);
    
    // 5. 显示每个订单的佣金明细
    console.log('\n📋 佣金明细表:');
    console.table(detailBreakdown);
    
    // 6. 获取销售数据对比
    const salesResponse = await fetch('/api/admin/sales', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    
    if (salesResponse.ok) {
      const salesData = await salesResponse.json();
      let salesCommissionTotal = 0;
      
      console.log('\n👥 销售管理页面佣金汇总:');
      salesData.sales?.forEach(sale => {
        if (sale.commission_amount > 0) {
          salesCommissionTotal += sale.commission_amount;
          console.log(`${sale.name || sale.wechat_name}: $${sale.commission_amount.toFixed(2)}`);
        }
      });
      console.log(`销售管理总佣金: $${salesCommissionTotal.toFixed(2)}`);
    }
    
    // 7. 分析差异
    console.log('\n%c===== 差异分析结果 =====', 'color: #722ed1; font-size: 14px; font-weight: bold;');
    console.log(`预期佣金（1588订单）: $635.20`);
    console.log(`系统显示佣金: $444.00`);
    console.log(`差异: $${(635.20 - 444).toFixed(2)}`);
    
    console.log('\n可能原因：');
    console.log('1. 订单状态可能不是"confirmed_config"');
    console.log('2. 佣金计算公式可能有误');
    console.log('3. 部分订单可能被过滤掉了');
    console.log('4. 统计API可能排除了某些数据');
    
  } catch (error) {
    console.error('分析失败:', error);
  }
}

// 执行分析
analyzeCommissionDifference();
