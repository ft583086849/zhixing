const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://itvmeamoqthfqtkpubdv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0dm1lYW1vcXRoZnF0a3B1YmR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0ODEyMzUsImV4cCI6MjA3MDA1NzIzNX0.ypBF3lJJTJtSPLEu1zWXqPorS-FDSZzRUy_0ge_Y-r0'
);

async function testTrigger() {
  try {
    console.log('========== 检查触发器是否生效 ==========\n');
    
    // 1. 获取一个真实的销售员
    const { data: sales, error: salesError } = await supabase
      .from('sales_optimized')
      .select('*')
      .eq('sales_type', 'primary')
      .limit(1)
      .single();
    
    if (salesError || !sales) {
      console.error('无法获取销售员信息:', salesError);
      return;
    }
    
    console.log(`使用销售员: ${sales.wechat_name} (${sales.sales_code})\n`);
    console.log('当前统计：');
    console.log('- 今日订单数:', sales.today_orders || 0);
    console.log('- 今日金额:', sales.today_amount || 0);
    console.log('- 今日佣金:', sales.today_commission || 0);
    
    // 2. 检查最新订单
    console.log('\n检查最新订单381...');
    const { data: order381 } = await supabase
      .from('orders_optimized')
      .select('*')
      .eq('id', 381)
      .single();
    
    if (order381) {
      console.log('订单381详情：');
      console.log('- 销售代码:', order381.sales_code);
      console.log('- 金额:', order381.total_amount || order381.amount);
      console.log('- 佣金:', order381.commission_amount);
      console.log('- 创建时间:', order381.created_at);
      
      // 查看对应销售的统计
      const { data: orderSales } = await supabase
        .from('sales_optimized')
        .select('*')
        .eq('sales_code', order381.sales_code)
        .single();
      
      if (orderSales) {
        console.log('\n订单381对应销售的实时统计：');
        console.log('- 销售员:', orderSales.wechat_name);
        console.log('- 今日订单数:', orderSales.today_orders || 0);
        console.log('- 今日金额:', orderSales.today_amount || 0);
        console.log('- 今日佣金:', orderSales.today_commission || 0);
        
        if (orderSales.today_commission > 0) {
          console.log('\n✅ 触发器已生效！今日佣金正在实时更新');
        } else {
          console.log('\n⚠️ 今日佣金为0，可能需要手动更新一次统计');
        }
      }
    }
    
  } catch (error) {
    console.error('检查失败:', error);
  }
  
  process.exit(0);
}

testTrigger();