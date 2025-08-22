// 调试API响应
(async () => {
  console.log('========================================');
  console.log('🔍 调试API响应数据');
  console.log('========================================');
  
  // 直接通过Redux dispatch调用API
  if (window.__REDUX_STORE__ || window.store) {
    const store = window.__REDUX_STORE__ || window.store;
    console.log('找到Redux store');
    
    // 获取当前state
    const state = store.getState();
    console.log('\n当前Redux state.admin:', state.admin);
    
    // 调用getStats action
    console.log('\n尝试调用getStats...');
    try {
      // 查找dispatch
      const dispatch = store.dispatch;
      
      // 尝试从window获取action creators
      if (window.getStats) {
        const result = await dispatch(window.getStats());
        console.log('getStats结果:', result);
      } else {
        console.log('未找到getStats action');
      }
    } catch (error) {
      console.error('调用getStats失败:', error);
    }
  }
  
  // 直接调用API端点
  console.log('\n直接调用API端点...');
  const token = localStorage.getItem('token') || localStorage.getItem('admin_token');
  
  if (!token) {
    console.error('❌ 没有找到token');
    return;
  }
  
  // 1. 调用stats API
  console.log('\n1. 调用 /api/admin/stats...');
  try {
    const response = await fetch('/api/admin/stats', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      credentials: 'include'
    });
    
    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Stats API返回数据:');
      console.log(JSON.stringify(data, null, 2));
      
      // 关键字段检查
      console.log('\n关键字段值:');
      console.log('- total_commission:', data.total_commission);
      console.log('- paid_commission:', data.paid_commission);
      console.log('- primary_sales_count:', data.primary_sales_count);
      console.log('- primary_sales_amount:', data.primary_sales_amount);
      console.log('- linked_secondary_sales_count:', data.linked_secondary_sales_count);
      console.log('- linked_secondary_sales_amount:', data.linked_secondary_sales_amount);
    } else {
      const text = await response.text();
      console.error('❌ API返回错误:', response.status, text);
    }
  } catch (error) {
    console.error('❌ 调用失败:', error);
  }
  
  // 2. 调用sales API
  console.log('\n2. 调用 /api/admin/sales...');
  try {
    const response = await fetch('/api/admin/sales', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      credentials: 'include'
    });
    
    console.log('Response status:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Sales API返回数据结构:');
      console.log('- success:', data.success);
      console.log('- data数组长度:', data.data?.length);
      
      if (data.data && data.data.length > 0) {
        console.log('\n前2个销售数据:');
        data.data.slice(0, 2).forEach((sale, index) => {
          console.log(`销售${index + 1}:`, {
            wechat_name: sale.sales?.wechat_name || sale.wechat_name,
            sales_type: sale.sales_type,
            commission_amount: sale.commission_amount,
            paid_commission: sale.paid_commission,
            total_orders: sale.total_orders
          });
        });
        
        // 计算总和
        let totalCommission = 0;
        let totalPaid = 0;
        data.data.forEach(sale => {
          totalCommission += (sale.commission_amount || 0);
          totalPaid += (sale.paid_commission || 0);
        });
        console.log('\n从销售数据计算的总和:');
        console.log('- 总佣金:', totalCommission);
        console.log('- 已返佣金:', totalPaid);
        console.log('- 待返佣金:', totalCommission - totalPaid);
      }
    } else {
      const text = await response.text();
      console.error('❌ API返回错误:', response.status, text);
    }
  } catch (error) {
    console.error('❌ 调用失败:', error);
  }
  
  console.log('\n========================================');
  console.log('✅ 调试完成');
  console.log('========================================');
})();