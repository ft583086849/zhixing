// 简单检查数据库连接和数据
console.log('🔍 检查数据库连接和数据...\n');

// 直接使用全局的supabase客户端
if (window.supabaseClient) {
  const supabase = window.supabaseClient;
  console.log('✅ 找到全局supabase客户端');
  
  // 1. 检查orders_optimized表
  console.log('\n📊 检查orders_optimized表...');
  supabase.from('orders_optimized').select('count', { count: 'exact', head: true })
    .then(({ count, error }) => {
      if (error) {
        console.error('❌ orders_optimized查询失败:', error);
      } else {
        console.log(`✅ orders_optimized表有 ${count} 条记录`);
      }
    });
  
  // 2. 检查sales_optimized表
  console.log('\n📊 检查sales_optimized表...');
  supabase.from('sales_optimized').select('count', { count: 'exact', head: true })
    .then(({ count, error }) => {
      if (error) {
        console.error('❌ sales_optimized查询失败:', error);
      } else {
        console.log(`✅ sales_optimized表有 ${count} 条记录`);
      }
    });
  
  // 3. 实际查询一些数据
  console.log('\n📊 查询实际数据...');
  Promise.all([
    supabase.from('orders_optimized').select('*').limit(5),
    supabase.from('sales_optimized').select('*').limit(5)
  ]).then(([ordersResult, salesResult]) => {
    console.log('\n订单数据:');
    if (ordersResult.error) {
      console.error('❌ 订单查询失败:', ordersResult.error);
    } else {
      console.log(`✅ 获取到 ${ordersResult.data.length} 条订单`);
      if (ordersResult.data.length > 0) {
        console.log('第1条订单:', ordersResult.data[0]);
      }
    }
    
    console.log('\n销售数据:');
    if (salesResult.error) {
      console.error('❌ 销售查询失败:', salesResult.error);
    } else {
      console.log(`✅ 获取到 ${salesResult.data.length} 条销售`);
      if (salesResult.data.length > 0) {
        console.log('第1条销售:', salesResult.data[0]);
        
        // 计算佣金
        let totalCommission = 0;
        salesResult.data.forEach(sale => {
          totalCommission += (sale.total_commission || 0);
        });
        console.log(`前5条销售的总佣金: $${totalCommission}`);
      }
    }
  });
  
} else {
  console.log('❌ 未找到全局supabase客户端，尝试其他方式...');
  
  // 尝试通过Redux获取数据
  if (window.store) {
    console.log('\n📦 通过Redux调度获取数据...');
    
    // 调度getStats action
    window.store.dispatch({
      type: 'admin/getStats/pending'
    });
    
    // 监听状态变化
    const unsubscribe = window.store.subscribe(() => {
      const state = window.store.getState();
      console.log('Redux状态变化:', state.admin);
    });
    
    setTimeout(() => {
      unsubscribe();
    }, 5000);
  }
}

// 4. 检查环境变量
console.log('\n🔧 检查环境变量...');
console.log('REACT_APP_SUPABASE_URL:', process.env.REACT_APP_SUPABASE_URL);
console.log('REACT_APP_SUPABASE_ANON_KEY:', process.env.REACT_APP_SUPABASE_ANON_KEY ? '已设置' : '未设置');

// 5. 检查认证状态
console.log('\n🔐 检查认证状态...');
console.log('localStorage token:', localStorage.getItem('token') ? '有' : '无');
console.log('localStorage admin_token:', localStorage.getItem('admin_token') ? '有' : '无');