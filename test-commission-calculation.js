// 测试佣金计算逻辑
(async () => {
  console.log('========================================');
  console.log('🧪 测试佣金计算');
  console.log('========================================');
  
  // 模拟调用getSales查看数据
  console.log('\n1. 检查getSales返回的数据...');
  
  // 通过fetch调用API
  const token = localStorage.getItem('token') || localStorage.getItem('admin_token');
  
  if (!token) {
    console.error('❌ 请先登录');
    return;
  }
  
  try {
    // 调用销售API
    const salesResponse = await fetch('/api/admin/sales', {
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      credentials: 'include'
    });
    
    if (!salesResponse.ok) {
      console.error('❌ 获取销售数据失败:', salesResponse.status);
      return;
    }
    
    const salesResult = await salesResponse.json();
    console.log('getSales返回格式:', {
      success: salesResult.success,
      dataLength: salesResult.data?.length
    });
    
    if (salesResult.success && salesResult.data) {
      // 计算佣金汇总
      let totalCommission = 0;
      let paidCommission = 0;
      let primaryCount = 0;
      let secondaryCount = 0;
      
      salesResult.data.forEach(sale => {
        // 累计佣金
        const commissionAmount = parseFloat(sale.commission_amount) || 0;
        const paidAmount = parseFloat(sale.paid_commission) || 0;
        
        totalCommission += commissionAmount;
        paidCommission += paidAmount;
        
        // 统计类型
        if (sale.sales_type === 'primary') primaryCount++;
        if (sale.sales_type === 'secondary') secondaryCount++;
        
        // 打印前3个销售的详细信息
        if (primaryCount + secondaryCount <= 3) {
          console.log(`\n销售 ${sale.sales?.wechat_name || sale.wechat_name}:`, {
            sales_type: sale.sales_type,
            commission_amount: commissionAmount,
            paid_commission: paidAmount,
            total_orders: sale.total_orders
          });
        }
      });
      
      console.log('\n📊 汇总统计:');
      console.log('- 一级销售数量:', primaryCount);
      console.log('- 二级销售数量:', secondaryCount);
      console.log('- 总佣金:', totalCommission.toFixed(2));
      console.log('- 已返佣金:', paidCommission.toFixed(2));
      console.log('- 待返佣金:', (totalCommission - paidCommission).toFixed(2));
    }
    
    // 调用stats API查看返回
    console.log('\n2. 检查getStats返回的数据...');
    const statsResponse = await fetch('/api/admin/stats', {
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      credentials: 'include'
    });
    
    if (!statsResponse.ok) {
      console.error('❌ 获取统计数据失败:', statsResponse.status);
      return;
    }
    
    const stats = await statsResponse.json();
    console.log('\n从getStats获取的值:');
    console.log('- total_commission:', stats.total_commission);
    console.log('- paid_commission:', stats.paid_commission);
    console.log('- commission_amount:', stats.commission_amount);
    console.log('- paid_commission_amount:', stats.paid_commission_amount);
    console.log('- pending_commission:', stats.pending_commission);
    console.log('- primary_sales_count:', stats.primary_sales_count);
    console.log('- primary_sales_amount:', stats.primary_sales_amount);
    
    // 对比两个API的结果
    console.log('\n3. 问题诊断...');
    if (stats.total_commission === 0 && totalCommission > 0) {
      console.error('❌ 问题：getStats没有正确获取销售数据的佣金汇总');
      console.log('可能原因：');
      console.log('1. getStats中的getSales调用失败');
      console.log('2. getStats计算逻辑有误');
      console.log('3. 数据格式不匹配');
    } else if (stats.total_commission > 0) {
      console.log('✅ getStats正确计算了佣金');
    }
    
  } catch (error) {
    console.error('❌ 执行失败:', error);
  }
  
  console.log('\n========================================');
  console.log('✅ 测试完成');
  console.log('========================================');
})();