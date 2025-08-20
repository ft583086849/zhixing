// 完整调试一级销售对账页面的数据流问题
console.log('🔍 调试一级销售对账页面数据流...\n');

async function debugPrimarySalesDataFlow() {
  console.log('📊 步骤1: 检查页面Redux状态');
  console.log('=' .repeat(60));
  
  if (window.store) {
    const state = window.store.getState();
    console.log('完整Redux状态:', state);
    
    if (state.sales) {
      console.log('\n🏪 Sales状态:');
      console.log('loading:', state.sales.loading);
      console.log('primarySalesStats:', state.sales.primarySalesStats);
      console.log('primarySalesOrders:', state.sales.primarySalesOrders);
    }
  }
  
  console.log('\n📊 步骤2: 手动调用API测试');
  console.log('=' .repeat(60));
  
  // 测试销售代码 - 请根据实际情况修改
  const testSalesCode = 'PRI17547241780648255'; // 修改为实际的销售代码
  const testWechatName = 'WML792355703'; // 或使用微信号
  
  try {
    console.log(`🔍 测试销售代码: ${testSalesCode}`);
    
    // 方法1: 直接调用fetch API
    console.log('\n--- 方法1: 直接API调用 ---');
    const response = await fetch('/api/sales/primary-sales-settlement', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        sales_code: testSalesCode
      })
    });
    
    if (response.ok) {
      const apiData = await response.json();
      console.log('✅ API响应成功:', apiData);
      
      if (apiData.data) {
        const { sales, orders, secondarySales, stats } = apiData.data;
        console.log('\n📋 API返回数据分析:');
        console.log('sales对象:', sales);
        console.log('stats对象:', stats);
        console.log('orders数量:', orders?.length || 0);
        console.log('secondarySales数量:', secondarySales?.length || 0);
        
        // 检查关键字段
        console.log('\n🔑 关键字段检查:');
        console.log('total_commission:', sales?.total_commission);
        console.log('direct_commission:', sales?.direct_commission);
        console.log('secondary_avg_rate:', sales?.secondary_avg_rate);
        console.log('secondary_share_commission:', sales?.secondary_share_commission);
        console.log('secondary_orders_amount:', sales?.secondary_orders_amount);
        console.log('month_commission:', sales?.month_commission);
        console.log('today_commission:', sales?.today_commission);
      }
    } else {
      console.error('❌ API调用失败:', response.status, response.statusText);
      const errorText = await response.text();
      console.error('错误详情:', errorText);
    }
    
  } catch (error) {
    console.error('❌ API调用异常:', error);
  }
  
  console.log('\n📊 步骤3: 检查Supabase直连');
  console.log('=' .repeat(60));
  
  if (window.supabaseClient) {
    const supabase = window.supabaseClient;
    console.log('✅ 找到Supabase客户端');
    
    try {
      // 直接查询sales_optimized表
      console.log('\n🔍 直接查询sales_optimized表...');
      const { data: salesData, error: salesError } = await supabase
        .from('sales_optimized')
        .select('*')
        .eq('sales_code', testSalesCode)
        .single();
      
      if (salesError) {
        console.error('❌ 查询销售失败:', salesError);
      } else {
        console.log('✅ 直接查询销售数据:', salesData);
        console.log('数据库中的佣金字段:');
        console.log('- total_commission:', salesData.total_commission);
        console.log('- direct_commission:', salesData.direct_commission);
        console.log('- secondary_avg_rate:', salesData.secondary_avg_rate);
        console.log('- secondary_share_commission:', salesData.secondary_share_commission);
        console.log('- secondary_orders_amount:', salesData.secondary_orders_amount);
      }
      
      // 查询该销售的订单
      console.log('\n🔍 查询该销售的订单...');
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders_optimized')
        .select('*')
        .eq('sales_code', testSalesCode)
        .in('status', ['confirmed', 'confirmed_config', 'confirmed_configuration', 'active']);
      
      if (ordersError) {
        console.error('❌ 查询订单失败:', ordersError);
      } else {
        console.log(`✅ 找到 ${ordersData?.length || 0} 个确认订单`);
        if (ordersData && ordersData.length > 0) {
          const totalAmount = ordersData.reduce((sum, o) => sum + (o.actual_payment_amount || o.amount || 0), 0);
          console.log('订单总金额:', totalAmount);
          console.log('理论直销佣金 (×40%):', totalAmount * 0.4);
        }
      }
      
    } catch (error) {
      console.error('❌ Supabase查询异常:', error);
    }
  }
  
  console.log('\n📊 步骤4: 检查页面当前状态');
  console.log('=' .repeat(60));
  
  // 检查页面DOM中显示的值
  const stats = document.querySelectorAll('.ant-statistic-content-value');
  console.log(`页面中找到 ${stats.length} 个统计数值:`);
  stats.forEach((stat, index) => {
    const title = stat.closest('.ant-statistic')?.querySelector('.ant-statistic-title')?.textContent;
    const value = stat.textContent;
    console.log(`${index + 1}. ${title}: ${value}`);
  });
  
  console.log('\n🎯 调试建议:');
  console.log('1. 检查API返回的数据结构是否包含所有v2.0字段');
  console.log('2. 确认页面的字段映射逻辑');
  console.log('3. 验证Redux状态更新是否正确');
  console.log('4. 检查是否有缓存问题');
}

// 执行调试
debugPrimarySalesDataFlow().catch(console.error);

console.log('\n💡 使用说明:');
console.log('1. 在一级销售对账页面打开浏览器控制台');
console.log('2. 修改上面代码中的testSalesCode为实际的销售代码');
console.log('3. 复制粘贴这整个代码到控制台运行');
console.log('4. 查看详细的调试输出');