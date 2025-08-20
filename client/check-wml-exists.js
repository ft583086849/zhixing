const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://itvmeamoqthfqtkpubdv.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0dm1lYW1vcXRoZnF0a3B1YmR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0ODEyMzUsImV4cCI6MjA3MDA1NzIzNX0.ypBF3lJJTJtSPLEu1zWXqPorS-FDSZzRUy_0ge_Y-r0');

async function checkWML() {
  console.log('🔍 查询WML792355703...\n');
  
  // 1. 不限制类型查询
  const { data: allSales, error } = await supabase
    .from('sales_optimized')
    .select('*')
    .eq('sales_code', 'WML792355703');
    
  if (error) {
    console.log('❌ 查询失败:', error);
  } else if (allSales && allSales.length > 0) {
    console.log('✅ 找到销售员WML792355703！');
    const s = allSales[0];
    console.log('\n详细信息:');
    console.log('  销售代码:', s.sales_code);
    console.log('  微信名:', s.wechat_name);
    console.log('  销售类型:', s.sales_type);
    console.log('  父级销售:', s.parent_sales_code);
    console.log('  佣金率:', s.commission_rate);
    console.log('  总订单数:', s.total_orders);
    console.log('  总金额:', s.total_amount);
    console.log('  总佣金:', s.total_commission);
    console.log('  本月订单:', s.month_orders);
    console.log('  本月金额:', s.month_amount);
    console.log('  本月佣金:', s.month_commission);
    console.log('  今日订单:', s.today_orders);
    console.log('  今日金额:', s.today_amount);
    console.log('  今日佣金:', s.today_commission);
    console.log('  直销订单数:', s.total_direct_orders);
    console.log('  直销金额:', s.total_direct_amount);
    console.log('  团队订单数:', s.total_team_orders);
    console.log('  团队金额:', s.total_team_amount);
  } else {
    console.log('❌ 没有找到WML792355703');
    
    // 2. 查询所有销售看看
    console.log('\n查询所有销售员...');
    const { data: allData } = await supabase
      .from('sales_optimized')
      .select('sales_code, wechat_name, sales_type')
      .limit(10);
      
    if (allData && allData.length > 0) {
      console.log('现有销售员列表:');
      allData.forEach(s => {
        console.log('  ' + s.sales_code + ' (' + s.sales_type + ') - ' + (s.wechat_name || '未设置'));
      });
    }
  }
}

checkWML();
