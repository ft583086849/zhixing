// 在浏览器控制台运行，全链路检查数据流
console.log('🔍 全链路检查一级销售对账数据流\n');
console.log('=' .repeat(60));

async function checkFullChain() {
  const supabase = window.supabaseClient;
  if (!supabase) {
    console.error('❌ 未找到supabase客户端');
    return;
  }
  
  // 测试销售代码 - 根据实际情况修改
  const testSalesCode = 'PRI17547241780648255';
  console.log(`📊 测试销售代码: ${testSalesCode}\n`);
  
  // 1. 检查一级销售数据
  console.log('1️⃣ 检查sales_optimized表中的一级销售数据:');
  console.log('-' .repeat(50));
  
  const { data: primarySale, error: primaryError } = await supabase
    .from('sales_optimized')
    .select('*')
    .eq('sales_code', testSalesCode)
    .single();
  
  if (primaryError) {
    console.error('❌ 查询一级销售失败:', primaryError);
    // 尝试查找任意一个一级销售
    console.log('\n尝试查找任意一级销售...');
    const { data: anyPrimary } = await supabase
      .from('sales_optimized')
      .select('*')
      .eq('sales_type', 'primary')
      .limit(1)
      .single();
    
    if (anyPrimary) {
      console.log('✅ 找到一级销售:', anyPrimary.wechat_name, '(' + anyPrimary.sales_code + ')');
      console.log('请使用这个销售代码测试:', anyPrimary.sales_code);
    }
    return;
  }
  
  console.log('✅ 找到一级销售:');
  console.log('  微信名:', primarySale.wechat_name);
  console.log('  销售代码:', primarySale.sales_code);
  console.log('  销售类型:', primarySale.sales_type);
  console.log('\n💰 佣金数据:');
  console.log('  总佣金:', primarySale.total_commission);
  console.log('  直销佣金:', primarySale.direct_commission);
  console.log('  二级返佣:', primarySale.secondary_share_commission);
  console.log('  平均二级佣金率:', primarySale.secondary_avg_rate);
  console.log('  二级订单总额:', primarySale.secondary_orders_amount);
  
  // 2. 检查二级销售
  console.log('\n2️⃣ 检查该一级销售的二级销售:');
  console.log('-' .repeat(50));
  
  // 方法1: 使用parent_sales_code
  console.log('使用parent_sales_code查询...');
  const { data: secondarySales1, error: error1 } = await supabase
    .from('sales_optimized')
    .select('*')
    .eq('parent_sales_code', testSalesCode);
  
  console.log('查询结果:', { 
    count: secondarySales1?.length || 0, 
    error: error1 
  });
  
  // 方法2: 使用parent_sales_id
  console.log('\n使用parent_sales_id查询...');
  const { data: secondarySales2, error: error2 } = await supabase
    .from('sales_optimized')
    .select('*')
    .eq('parent_sales_id', primarySale.id);
  
  console.log('查询结果:', { 
    count: secondarySales2?.length || 0, 
    error: error2 
  });
  
  // 使用找到的二级销售数据
  const secondarySales = secondarySales1 || secondarySales2 || [];
  
  if (secondarySales.length > 0) {
    console.log(`\n✅ 找到 ${secondarySales.length} 个二级销售:`);
    secondarySales.forEach((ss, index) => {
      console.log(`  ${index + 1}. ${ss.wechat_name} (${ss.sales_code})`);
      console.log(`     佣金率: ${ss.commission_rate}`);
      console.log(`     订单总额: ${ss.total_amount}`);
    });
    
    // 计算返佣
    let totalShareCommission = 0;
    secondarySales.forEach(ss => {
      const amount = ss.total_amount || 0;
      const rate = ss.commission_rate || 0;
      const shareCommission = amount * (0.4 - rate);
      totalShareCommission += shareCommission;
    });
    console.log(`\n  💰 一级应得返佣: ${totalShareCommission}`);
  } else {
    console.log('⚠️ 未找到二级销售');
    console.log('可能原因:');
    console.log('1. parent_sales_code字段未正确设置');
    console.log('2. 该一级销售确实没有二级销售');
  }
  
  // 3. 检查订单数据
  console.log('\n3️⃣ 检查订单数据:');
  console.log('-' .repeat(50));
  
  const { data: orders } = await supabase
    .from('orders_optimized')
    .select('*')
    .eq('sales_code', testSalesCode);
  
  console.log(`找到 ${orders?.length || 0} 个订单`);
  
  if (orders && orders.length > 0) {
    // 按状态分组
    const statusGroups = {};
    orders.forEach(o => {
      const status = o.status || 'unknown';
      if (!statusGroups[status]) statusGroups[status] = [];
      statusGroups[status].push(o);
    });
    
    console.log('\n订单状态分布:');
    Object.entries(statusGroups).forEach(([status, orderList]) => {
      const amount = orderList.reduce((sum, o) => sum + (o.amount || 0), 0);
      console.log(`  ${status}: ${orderList.length}个, 金额: ${amount}`);
    });
    
    // 计算确认订单
    const confirmedStatuses = ['confirmed', 'confirmed_config', 'paid', 'completed', 'active'];
    const confirmedOrders = orders.filter(o => confirmedStatuses.includes(o.status));
    const confirmedAmount = confirmedOrders.reduce((sum, o) => sum + (o.amount || 0), 0);
    
    console.log(`\n✅ 确认订单: ${confirmedOrders.length}个, 金额: ${confirmedAmount}`);
    console.log(`💰 理论佣金(40%): ${confirmedAmount * 0.4}`);
  }
  
  // 4. 检查今日数据
  console.log('\n4️⃣ 检查今日数据:');
  console.log('-' .repeat(50));
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const { data: todayOrders } = await supabase
    .from('orders_optimized')
    .select('*')
    .eq('sales_code', testSalesCode)
    .gte('payment_time', today.toISOString());
  
  console.log(`今日订单: ${todayOrders?.length || 0}个`);
  
  if (!todayOrders || todayOrders.length === 0) {
    console.log('⚠️ 今日无订单，检查payment_time字段:');
    
    // 检查是否有payment_time字段
    const { data: sampleOrder } = await supabase
      .from('orders_optimized')
      .select('id, created_at, payment_time, updated_at')
      .eq('sales_code', testSalesCode)
      .limit(1)
      .single();
    
    if (sampleOrder) {
      console.log('订单时间字段示例:');
      console.log('  created_at:', sampleOrder.created_at);
      console.log('  payment_time:', sampleOrder.payment_time);
      console.log('  updated_at:', sampleOrder.updated_at);
      
      if (!sampleOrder.payment_time) {
        console.log('❗ payment_time字段为空，这会导致今日/本月佣金计算为0');
      }
    }
  }
  
  console.log('\n' + '=' .repeat(60));
  console.log('📊 诊断总结:');
  console.log('1. 检查parent_sales_code字段是否正确');
  console.log('2. 检查订单status是否在确认状态列表中');
  console.log('3. 检查payment_time字段是否有值');
  console.log('4. 可能需要运行数据修复脚本更新统计字段');
}

// 执行检查
checkFullChain().catch(console.error);