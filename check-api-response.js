// 检查API返回的数据结构
// 在一级销售对账页面的控制台运行

(async function checkAPIResponse() {
  console.log('🔍 检查API返回数据...');
  
  // 方法1：直接调用API
  if (window.salesAPI || window.SalesAPI) {
    try {
      const api = window.salesAPI || window.SalesAPI;
      console.log('\n1️⃣ 调用getPrimarySalesSettlement API:');
      
      const result = await api.getPrimarySalesSettlement({ 
        wechat_name: 'WML792355703' 
      });
      
      console.log('完整响应:', result);
      
      if (result.data) {
        console.log('\n📊 关键字段检查:');
        const sales = result.data.sales || result.data;
        console.log('- secondary_orders_amount:', sales.secondary_orders_amount);
        console.log('- secondary_avg_rate:', sales.secondary_avg_rate);
        console.log('- secondary_share_commission:', sales.secondary_share_commission);
        console.log('- direct_orders_amount:', sales.direct_orders_amount);
        console.log('- direct_commission:', sales.direct_commission);
        
        console.log('\n📦 完整sales对象:', sales);
      }
    } catch (error) {
      console.error('API调用失败:', error);
    }
  }
  
  // 方法2：检查Redux Store
  if (window.__REDUX_DEVTOOLS_EXTENSION__) {
    console.log('\n2️⃣ 检查Redux Store:');
    console.log('请在Redux DevTools中查看state.sales.primarySalesSettlement');
  }
  
  // 方法3：检查React组件props
  console.log('\n3️⃣ 检查React组件:');
  const statsCards = document.querySelectorAll('.ant-statistic');
  statsCards.forEach(card => {
    const title = card.querySelector('.ant-statistic-title')?.textContent;
    const value = card.querySelector('.ant-statistic-content-value')?.textContent;
    if (title && title.includes('二级')) {
      console.log(`${title}: ${value}`);
    }
  });
  
  // 方法4：手动模拟后端计算
  console.log('\n4️⃣ 手动验证计算:');
  const supabase = window.supabaseClient || window.supabase;
  if (supabase) {
    // 获取一级销售
    const { data: primary } = await supabase
      .from('primary_sales')
      .select('*')
      .eq('wechat_name', 'WML792355703')
      .single();
    
    console.log('一级销售ID:', primary.id);
    
    // 获取二级销售
    const { data: secondaries } = await supabase
      .from('secondary_sales')
      .select('*')
      .eq('primary_sales_id', primary.id);
    
    console.log('二级销售数量:', secondaries?.length);
    
    // 计算统计
    let totalAmount = 0;
    let totalCommission = 0;
    
    for (const ss of (secondaries || [])) {
      const { data: orders } = await supabase
        .from('orders')
        .select('*')
        .eq('sales_code', ss.sales_code);
      
      const confirmed = (orders || []).filter(o => 
        ['confirmed', 'confirmed_config', 'confirmed_configuration', 'active'].includes(o.status)
      );
      
      const amount = confirmed.reduce((sum, o) => 
        sum + (o.actual_payment_amount || o.amount || 0), 0
      );
      
      const commission = amount * (ss.commission_rate || 0);
      
      if (amount > 0) {
        console.log(`${ss.wechat_name}: 金额=${amount}, 佣金=${commission}`);
      }
      
      totalAmount += amount;
      totalCommission += commission;
    }
    
    const expectedData = {
      secondary_orders_amount: totalAmount,
      secondary_avg_rate: totalAmount > 0 ? totalCommission / totalAmount : 0,
      secondary_share_commission: totalAmount * 0.4 - totalCommission
    };
    
    console.log('\n✅ 期望的数据:', expectedData);
  }
  
  // 方法5：检查网络请求
  console.log('\n5️⃣ 提示：');
  console.log('1. 打开Network标签');
  console.log('2. 重新搜索WML792355703');
  console.log('3. 查找包含"primary_sales"的请求');
  console.log('4. 查看Response中是否包含secondary_orders_amount等字段');
})();

