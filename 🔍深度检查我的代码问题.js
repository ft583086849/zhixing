// 🔍 深度检查AdminAPI代码问题 - 找出为什么数据概览还是0
// 复制到浏览器控制台运行

console.log('=== 🔍 深度检查AdminAPI代码问题 ===\n');

async function deepDiagnose() {
  try {
    console.log('🔍 === 1. 检查数据概览逻辑 ===');
    
    // 检查AdminAPI.getStats实际代码
    console.log('AdminAPI.getStats 方法存在:', typeof AdminAPI.getStats === 'function');
    
    // 直接测试Supabase查询
    console.log('正在直接测试Supabase订单查询...');
    
    let supabaseClient = SupabaseService?.supabase || window.supabaseClient;
    console.log('使用的supabase客户端:', !!supabaseClient);
    
    if (!supabaseClient) {
      console.error('❌ 没有可用的Supabase客户端');
      return;
    }
    
    // 直接查询订单
    const { data: orders, error } = await supabaseClient
      .from('orders')
      .select('*');
    
    console.log('订单查询结果:', { data: orders?.length, error });
    
    if (orders && orders.length > 0) {
      console.log('第一个订单详细信息:', orders[0]);
      console.log('amount字段值:', orders[0].amount);
      console.log('actual_payment_amount字段值:', orders[0].actual_payment_amount);
      console.log('status字段值:', orders[0].status);
      console.log('payment_time字段值:', orders[0].payment_time);
      
      // 手动计算总金额
      let totalAmount = 0;
      orders.forEach(order => {
        // 根据我的代码逻辑计算
        let amount = parseFloat(order.amount || 0);
        if (order.actual_payment_amount && parseFloat(order.actual_payment_amount) > 0) {
          amount = parseFloat(order.actual_payment_amount);
        }
        totalAmount += amount;
      });
      console.log('手动计算的总金额:', totalAmount);
      console.log('转换为美元 (÷7.15):', totalAmount / 7.15);
    }
    
    console.log('\n🔍 === 2. 测试AdminAPI.getStats完整流程 ===');
    
    try {
      const stats = await AdminAPI.getStats();
      console.log('AdminAPI.getStats返回值:', stats);
      
      if (stats) {
        console.log('- total_amount:', stats.total_amount);
        console.log('- total_orders:', stats.total_orders);
        console.log('- today_orders:', stats.today_orders);
        console.log('- 所有字段:', Object.keys(stats));
      }
    } catch (error) {
      console.error('❌ AdminAPI.getStats执行失败:', error);
      console.error('错误详情:', error.message);
      console.error('错误堆栈:', error.stack);
    }
    
    console.log('\n🔍 === 3. 检查销售管理逻辑 ===');
    
    try {
      // 测试销售查询
      const primarySales = await supabaseClient.from('primary_sales').select('*');
      const secondarySales = await supabaseClient.from('secondary_sales').select('*');
      
      console.log('一级销售数量:', primarySales.data?.length || 0);
      console.log('二级销售数量:', secondarySales.data?.length || 0);
      
      if (primarySales.data?.length > 0) {
        console.log('第一个一级销售:', primarySales.data[0]);
      }
      
      const sales = await AdminAPI.getSales();
      console.log('AdminAPI.getSales返回值:', sales);
      console.log('销售数据数量:', sales?.length || 0);
      
    } catch (error) {
      console.error('❌ 销售管理测试失败:', error);
    }
    
    console.log('\n🔍 === 4. 检查客户管理逻辑 ===');
    
    try {
      const customers = await AdminAPI.getCustomers();
      console.log('AdminAPI.getCustomers返回值:', customers);
      console.log('客户数据数量:', customers?.length || 0);
      
      if (customers?.length > 0) {
        console.log('第一个客户:', customers[0]);
        console.log('销售微信号:', customers[0]?.sales_wechat_name);
      }
      
    } catch (error) {
      console.error('❌ 客户管理测试失败:', error);
    }
    
    console.log('\n🎯 === 诊断总结 ===');
    console.log('请检查上述每个步骤的输出，找出具体问题所在！');
    
  } catch (error) {
    console.error('❌ 深度诊断出错:', error);
  }
}

// 立即执行
deepDiagnose();
