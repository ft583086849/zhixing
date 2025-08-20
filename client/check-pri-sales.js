const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://itvmeamoqthfqtkpubdv.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0dm1lYW1vcXRoZnF0a3B1YmR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0ODEyMzUsImV4cCI6MjA3MDA1NzIzNX0.ypBF3lJJTJtSPLEu1zWXqPorS-FDSZzRUy_0ge_Y-r0');

async function checkPrimarySales() {
  console.log('🔍 查询 PRI17547241780648255 的详细数据...\n');
  
  // 1. 查询一级销售数据
  const { data: primarySale, error } = await supabase
    .from('sales_optimized')
    .select('*')
    .eq('sales_code', 'PRI17547241780648255')
    .single();
    
  if (error) {
    console.log('❌ 查询失败:', error);
  } else if (primarySale) {
    console.log('✅ 找到一级销售 PRI17547241780648255！\n');
    console.log('基本信息:');
    console.log('  销售代码:', primarySale.sales_code);
    console.log('  微信名:', primarySale.wechat_name);
    console.log('  销售类型:', primarySale.sales_type);
    console.log('  佣金率:', primarySale.commission_rate);
    console.log('\n统计数据:');
    console.log('  总订单数:', primarySale.total_orders);
    console.log('  总金额: $', primarySale.total_amount);
    console.log('  总佣金: $', primarySale.total_commission);
    console.log('\n本月数据:');
    console.log('  本月订单:', primarySale.month_orders);
    console.log('  本月金额: $', primarySale.month_amount);
    console.log('  本月佣金: $', primarySale.month_commission);
    console.log('\n今日数据:');
    console.log('  今日订单:', primarySale.today_orders);
    console.log('  今日金额: $', primarySale.today_amount);
    console.log('  今日佣金: $', primarySale.today_commission);
    console.log('\n直销数据:');
    console.log('  直销订单数:', primarySale.total_direct_orders);
    console.log('  直销金额: $', primarySale.total_direct_amount);
    console.log('\n团队数据:');
    console.log('  团队订单数:', primarySale.total_team_orders);
    console.log('  团队金额: $', primarySale.total_team_amount);
    
    // 2. 查询二级销售
    console.log('\n=====================================');
    console.log('📊 查询该一级销售的二级销售...\n');
    const { data: secondarySales } = await supabase
      .from('sales_optimized')
      .select('*')
      .eq('parent_sales_code', 'PRI17547241780648255')
      .eq('sales_type', 'secondary');
      
    if (secondarySales && secondarySales.length > 0) {
      console.log('找到 ' + secondarySales.length + ' 个二级销售:');
      let totalSecondaryAmount = 0;
      let totalSecondaryCommission = 0;
      
      secondarySales.forEach(s => {
        console.log('\n  销售代码:', s.sales_code);
        console.log('  微信名:', s.wechat_name);
        console.log('  佣金率:', s.commission_rate);
        console.log('  总订单:', s.total_orders);
        console.log('  总金额: $', s.total_amount);
        console.log('  总佣金: $', s.total_commission);
        
        totalSecondaryAmount += (s.total_amount || 0);
        totalSecondaryCommission += (s.total_commission || 0);
      });
      
      console.log('\n二级销售汇总:');
      console.log('  二级销售总金额: $', totalSecondaryAmount);
      console.log('  二级销售总佣金: $', totalSecondaryCommission);
      console.log('  一级从二级获得的分成: $', totalSecondaryAmount * 0.15);
    } else {
      console.log('没有找到二级销售');
    }
    
    // 3. 查询最近的订单
    console.log('\n=====================================');
    console.log('📊 查询最近的订单...\n');
    const { data: recentOrders } = await supabase
      .from('orders_optimized')
      .select('id, order_number, sales_code, amount, actual_payment_amount, commission_amount, status, payment_time')
      .eq('sales_code', 'PRI17547241780648255')
      .order('created_at', { ascending: false })
      .limit(5);
      
    if (recentOrders && recentOrders.length > 0) {
      console.log('最近5个订单:');
      recentOrders.forEach(o => {
        const amount = o.actual_payment_amount || o.amount || 0;
        const commission = o.commission_amount || 0;
        console.log('\n  订单号:', o.order_number || o.id);
        console.log('  金额: $', amount);
        console.log('  佣金: $', commission);
        console.log('  状态:', o.status);
        console.log('  付款时间:', o.payment_time || '未付款');
      });
    } else {
      console.log('没有找到订单');
    }
  }
}

checkPrimarySales();
