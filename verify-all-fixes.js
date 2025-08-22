// 完整验证脚本 - 在浏览器控制台执行
(async () => {
  console.log('========================================');
  console.log('🔍 开始验证所有修复');
  console.log('========================================');
  
  const token = localStorage.getItem('token') || localStorage.getItem('admin_token');
  
  if (!token) {
    console.error('❌ 未找到登录token，请先登录');
    return;
  }
  
  // 1. 验证API返回的统计数据
  console.log('\n📊 1. 检查API统计数据...');
  try {
    const statsResponse = await fetch('http://localhost:3000/api/admin/stats', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const stats = await statsResponse.json();
    console.log('API返回的统计数据:', stats);
    
    console.log('\n关键字段检查:');
    console.log('  - total_commission (总佣金):', stats.total_commission);
    console.log('  - commission_amount (总佣金-兼容):', stats.commission_amount);
    console.log('  - paid_commission (已返佣金):', stats.paid_commission);
    console.log('  - paid_commission_amount (已返佣金-兼容):', stats.paid_commission_amount);
    console.log('  - pending_commission (待返佣金):', stats.pending_commission);
    console.log('  - pending_commission_amount (待返佣金-兼容):', stats.pending_commission_amount);
    console.log('  ✅ 计算验证: 待返 = 总 - 已返 =', 
      (stats.total_commission || 0) - (stats.paid_commission || 0));
  } catch (error) {
    console.error('❌ 获取统计数据失败:', error);
  }
  
  // 2. 验证销售数据
  console.log('\n💰 2. 检查销售数据...');
  try {
    const salesResponse = await fetch('http://localhost:3000/api/admin/sales', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const salesResult = await salesResponse.json();
    console.log('API返回的销售数据格式:', salesResult);
    
    if (salesResult.success && salesResult.data) {
      const salesData = salesResult.data;
      console.log('销售数据数量:', salesData.length);
      
      // 计算汇总
      let totalCommission = 0;
      let paidCommission = 0;
      
      salesData.forEach(sale => {
        totalCommission += (sale.commission_amount || 0);
        paidCommission += (sale.paid_commission || 0);
      });
      
      console.log('\n从销售数据计算的汇总:');
      console.log('  - 总佣金:', totalCommission.toFixed(2));
      console.log('  - 已返佣金:', paidCommission.toFixed(2));
      console.log('  - 待返佣金:', (totalCommission - paidCommission).toFixed(2));
      
      // 检查前3个销售的详细数据
      console.log('\n前3个销售详细数据:');
      salesData.slice(0, 3).forEach((sale, index) => {
        console.log(`  ${index + 1}. ${sale.sales?.wechat_name || sale.wechat_name || '-'}`);
        console.log(`     - commission_amount: ${sale.commission_amount}`);
        console.log(`     - paid_commission: ${sale.paid_commission}`);
        console.log(`     - total_orders: ${sale.total_orders}`);
        console.log(`     - sales_type: ${sale.sales_type}`);
      });
    }
  } catch (error) {
    console.error('❌ 获取销售数据失败:', error);
  }
  
  // 3. 验证销售层级统计
  console.log('\n📈 3. 检查销售层级统计...');
  try {
    const stats = await fetch('http://localhost:3000/api/admin/stats', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }).then(r => r.json());
    
    console.log('销售层级统计:');
    console.log('  一级销售:');
    console.log('    - 数量:', stats.primary_sales_count);
    console.log('    - 业绩:', stats.primary_sales_amount);
    console.log('  二级销售(有上级):');
    console.log('    - 数量:', stats.linked_secondary_sales_count);
    console.log('    - 业绩:', stats.linked_secondary_sales_amount);
    console.log('  独立销售:');
    console.log('    - 数量:', stats.independent_sales_count);
    console.log('    - 业绩:', stats.independent_sales_amount);
    console.log('\n✅ 验证: 一级业绩应该 = 直销 + 从二级获得的分成');
  } catch (error) {
    console.error('❌ 获取层级统计失败:', error);
  }
  
  // 4. 检查页面显示
  console.log('\n🖥️ 4. 检查页面显示元素...');
  
  // 检查数据概览页面的显示
  const statsCards = document.querySelectorAll('.ant-statistic-title');
  statsCards.forEach(card => {
    const title = card.textContent;
    const value = card.nextElementSibling?.textContent;
    if (title.includes('返佣金') || title.includes('待返')) {
      console.log(`  ${title}: ${value}`);
    }
  });
  
  // 检查销售层级统计
  const salesLayerCards = document.querySelectorAll('.ant-card');
  salesLayerCards.forEach(card => {
    const text = card.textContent;
    if (text.includes('一级销售') || text.includes('二级销售')) {
      console.log('  销售层级卡片:', text.substring(0, 100));
    }
  });
  
  // 5. 检查Redux store
  console.log('\n🗃️ 5. 检查Redux Store...');
  if (window.__REDUX_STORE__) {
    const state = window.__REDUX_STORE__.getState();
    if (state.admin) {
      console.log('Redux admin state:', {
        stats: state.admin.stats,
        sales: state.admin.sales?.length,
        loading: state.admin.loading
      });
    }
  } else {
    console.log('⚠️ 无法访问Redux store');
  }
  
  console.log('\n========================================');
  console.log('✅ 验证完成，请查看上面的结果');
  console.log('========================================');
})();