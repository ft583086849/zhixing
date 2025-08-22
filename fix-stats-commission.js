// 临时修复方案 - 直接从数据库计算佣金
(async () => {
  console.log('========================================');
  console.log('🔧 临时修复佣金计算');
  console.log('========================================');
  
  const token = localStorage.getItem('token') || localStorage.getItem('admin_token');
  if (!token) {
    console.error('❌ 请先登录');
    return;
  }
  
  // 直接查询Supabase获取销售数据
  console.log('直接从Supabase查询销售数据...');
  
  // 构造SQL查询
  const sql = `
    SELECT 
      sales_code,
      wechat_name,
      sales_type,
      commission_rate,
      total_commission,
      paid_commission,
      total_orders,
      total_amount
    FROM sales_optimized
    WHERE sales_type IS NOT NULL
  `;
  
  try {
    // 使用fetch直接调用Supabase API
    const supabaseUrl = 'https://mbqjkpqnjnrwzuafgqed.supabase.co';
    const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1icWprcHFuam5yd3p1YWZncWVkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzMwNTg0NTgsImV4cCI6MjA0ODYzNDQ1OH0.d5xoIDAJx0TR4KnBiFiWSRGDZqCPcVdZBe0G2x2hVlE';
    
    const response = await fetch(`${supabaseUrl}/rest/v1/sales_optimized?select=*`, {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      }
    });
    
    if (response.ok) {
      const salesData = await response.json();
      console.log('✅ 获取到销售数据:', salesData.length, '条');
      
      // 计算汇总
      let totalCommission = 0;
      let paidCommission = 0;
      let primaryCount = 0;
      let secondaryCount = 0;
      let primaryAmount = 0;
      let secondaryAmount = 0;
      
      salesData.forEach(sale => {
        // 佣金计算
        totalCommission += (sale.total_commission || 0);
        paidCommission += (sale.paid_commission || 0);
        
        // 分类统计
        if (sale.sales_type === 'primary') {
          primaryCount++;
          primaryAmount += (sale.total_amount || 0);
        } else if (sale.sales_type === 'secondary') {
          secondaryCount++;
          secondaryAmount += (sale.total_amount || 0);
        }
      });
      
      console.log('\n📊 计算结果:');
      console.log('========================================');
      console.log('💰 佣金统计:');
      console.log('  - 总佣金:', totalCommission.toFixed(2));
      console.log('  - 已返佣金:', paidCommission.toFixed(2));
      console.log('  - 待返佣金:', (totalCommission - paidCommission).toFixed(2));
      console.log('\n👥 销售统计:');
      console.log('  - 一级销售:', primaryCount, '个, 业绩:', primaryAmount.toFixed(2));
      console.log('  - 二级销售:', secondaryCount, '个, 业绩:', secondaryAmount.toFixed(2));
      console.log('========================================');
      
      // 更新页面显示（如果可能）
      console.log('\n尝试更新页面显示...');
      
      // 查找并更新统计卡片
      const updateStatCard = (title, value) => {
        const cards = document.querySelectorAll('.ant-statistic');
        cards.forEach(card => {
          const titleEl = card.querySelector('.ant-statistic-title');
          if (titleEl && titleEl.textContent === title) {
            const valueEl = card.querySelector('.ant-statistic-content-value');
            if (valueEl) {
              valueEl.textContent = value;
              console.log(`✅ 更新 ${title}: ${value}`);
            }
          }
        });
      };
      
      updateStatCard('销售返佣金额', totalCommission.toFixed(0));
      updateStatCard('待返佣金金额', (totalCommission - paidCommission).toFixed(0));
      
      console.log('\n✅ 临时修复完成');
      console.log('建议：刷新页面查看更新后的数据');
      
    } else {
      console.error('❌ 查询失败:', response.status, response.statusText);
    }
  } catch (error) {
    console.error('❌ 执行失败:', error);
  }
  
  console.log('\n========================================');
})();