// 🔍 全面诊断8887bde部署后的问题根源
// 复制到浏览器控制台运行

console.log('=== 🔍 全面诊断8887bde部署后问题 ===\n');

async function diagnoseProblem() {
  try {
    console.log('🔗 === 1. 检查Supabase客户端状态 ===');
    
    // 检查客户端可用性
    console.log('window.supabaseClient:', typeof window.supabaseClient);
    console.log('SupabaseService.supabase:', typeof SupabaseService?.supabase);
    
    // 测试直接查询
    console.log('\n📊 === 2. 测试直接数据库查询 ===');
    
    let supabaseClient = window.supabaseClient || SupabaseService?.supabase;
    if (!supabaseClient) {
      console.error('❌ 没有可用的Supabase客户端！');
      return;
    }
    
    // 测试订单查询
    console.log('正在查询订单数据...');
    const ordersResult = await supabaseClient.from('orders').select('*');
    console.log('订单查询结果:', ordersResult);
    console.log('订单数量:', ordersResult.data?.length || 0);
    if (ordersResult.data?.length > 0) {
      console.log('第一个订单样本:', ordersResult.data[0]);
    }
    
    // 测试销售查询
    console.log('\n正在查询一级销售数据...');
    const primarySalesResult = await supabaseClient.from('primary_sales').select('*');
    console.log('一级销售查询结果:', primarySalesResult);
    console.log('一级销售数量:', primarySalesResult.data?.length || 0);
    
    console.log('\n正在查询二级销售数据...');
    const secondarySalesResult = await supabaseClient.from('secondary_sales').select('*');
    console.log('二级销售查询结果:', secondarySalesResult);
    console.log('二级销售数量:', secondarySalesResult.data?.length || 0);
    
    console.log('\n🧮 === 3. 测试AdminAPI调用 ===');
    
    // 测试数据概览API
    console.log('正在测试AdminAPI.getStats()...');
    try {
      const stats = await AdminAPI.getStats();
      console.log('数据概览API返回:', stats);
    } catch (error) {
      console.error('❌ 数据概览API失败:', error);
    }
    
    // 测试销售管理API
    console.log('\n正在测试AdminAPI.getSales()...');
    try {
      const sales = await AdminAPI.getSales();
      console.log('销售管理API返回:', sales);
      console.log('销售数量:', sales?.length || 0);
    } catch (error) {
      console.error('❌ 销售管理API失败:', error);
    }
    
    // 测试客户管理API
    console.log('\n正在测试AdminAPI.getCustomers()...');
    try {
      const customers = await AdminAPI.getCustomers();
      console.log('客户管理API返回:', customers);
      console.log('客户数量:', customers?.length || 0);
    } catch (error) {
      console.error('❌ 客户管理API失败:', error);
    }
    
    console.log('\n🔍 === 4. Redux状态检查 ===');
    
    if (window.store) {
      const state = window.store.getState();
      console.log('Redux admin状态:', state.admin);
      console.log('- stats:', state.admin?.stats);
      console.log('- sales:', state.admin?.sales);
      console.log('- customers:', state.admin?.customers);
    } else {
      console.log('❌ Redux store不可用');
    }
    
    console.log('\n✅ === 诊断完成 ===');
    console.log('请检查上述输出，找出问题所在！');
    
  } catch (error) {
    console.error('❌ 诊断过程出错:', error);
  }
}

// 立即执行诊断
diagnoseProblem();
