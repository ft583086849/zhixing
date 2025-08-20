const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://itvmeamoqthfqtkpubdv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0dm1lYW1vcXRoZnF0a3B1YmR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0ODEyMzUsImV4cCI6MjA3MDA1NzIzNX0.ypBF3lJJTJtSPLEu1zWXqPorS-FDSZzRUy_0ge_Y-r0'
);

async function checkOrder() {
  try {
    // 查询订单381的详细信息
    const { data: order, error } = await supabase
      .from('orders_optimized')
      .select('*')
      .eq('id', 381)
      .single();
    
    if (error) throw error;
    
    console.log('========== 订单381详情 ==========');
    console.log('- ID:', order.id);
    console.log('- 客户微信:', order.customer_wechat);
    console.log('- 销售代码:', order.sales_code);
    console.log('- 上级销售代码:', order.parent_sales_code);
    console.log('- 订单金额:', order.total_amount);
    console.log('- 佣金金额:', order.commission_amount);
    console.log('- 订单状态:', order.status);
    console.log('- 创建时间:', order.created_at);
    console.log('- 更新时间:', order.updated_at);
    
    // 查询该销售的sales_optimized记录
    const salesCode = order.parent_sales_code || order.sales_code;
    if (salesCode) {
      const { data: sales, error: salesError } = await supabase
        .from('sales_optimized')
        .select('*')
        .eq('sales_code', salesCode)
        .single();
      
      if (!salesError && sales) {
        console.log('\n========== 对应销售记录 ==========');
        console.log('- 销售代码:', sales.sales_code);
        console.log('- 微信名称:', sales.wechat_name);
        console.log('- 今日佣金:', sales.today_commission);
        console.log('- 今日订单数:', sales.today_orders);
        console.log('- 今日金额:', sales.today_amount);
        console.log('- 直销佣金:', sales.direct_commission);
        console.log('- 总佣金:', sales.total_commission);
        console.log('- 更新时间:', sales.updated_at);
        
        // 计算中国时区的今日时间范围
        const now = new Date();
        // 获取中国时区今天0点的UTC时间
        const chinaToday = new Date();
        chinaToday.setUTCHours(16, 0, 0, 0); // UTC 16:00 = 中国时间 00:00
        const prevDay = new Date(chinaToday);
        prevDay.setDate(prevDay.getDate() - 1);
        
        // 如果当前UTC时间小于16:00，说明中国时间还在今天，需要用昨天16:00作为起点
        const todayStart = now.getUTCHours() < 16 ? prevDay : chinaToday;
        const todayEnd = new Date(todayStart);
        todayEnd.setDate(todayEnd.getDate() + 1);
        
        console.log('\n========== 时间范围 ==========');
        console.log('- 今日开始（UTC）:', todayStart.toISOString());
        console.log('- 今日结束（UTC）:', todayEnd.toISOString());
        console.log('- 今日开始（中国）:', new Date(todayStart.getTime() + 8 * 60 * 60 * 1000).toLocaleString('zh-CN'));
        console.log('- 今日结束（中国）:', new Date(todayEnd.getTime() + 8 * 60 * 60 * 1000).toLocaleString('zh-CN'));
        
        // 查询今日所有订单
        const { data: todayOrders, error: todayError } = await supabase
          .from('orders_optimized')
          .select('id, total_amount, commission_amount, created_at, sales_code, parent_sales_code')
          .or(`sales_code.eq.${salesCode},parent_sales_code.eq.${salesCode}`)
          .gte('created_at', todayStart.toISOString())
          .lt('created_at', todayEnd.toISOString())
          .order('created_at', { ascending: true });
        
        if (!todayError && todayOrders) {
          console.log('\n========== 今日订单列表 ==========');
          let todayTotal = 0;
          let todayCommission = 0;
          todayOrders.forEach(o => {
            const chinaTime = new Date(o.created_at).toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' });
            console.log(`  订单${o.id}: 金额$${o.total_amount}, 佣金$${o.commission_amount}`);
            console.log(`    创建时间: ${chinaTime}`);
            console.log(`    销售链: ${o.parent_sales_code ? o.parent_sales_code + ' -> ' + o.sales_code : o.sales_code}`);
            todayTotal += parseFloat(o.total_amount || 0);
            todayCommission += parseFloat(o.commission_amount || 0);
          });
          console.log('\n========== 统计对比 ==========');
          console.log(`实际计算 - 今日订单数: ${todayOrders.length}`);
          console.log(`实际计算 - 今日总金额: $${todayTotal.toFixed(2)}`);
          console.log(`实际计算 - 今日总佣金: $${todayCommission.toFixed(2)}`);
          console.log(`数据库中 - 今日佣金: $${sales.today_commission}`);
          console.log(`数据库中 - 今日订单数: ${sales.today_orders}`);
          console.log(`数据库中 - 今日金额: $${sales.today_amount}`);
          
          if (Math.abs(todayCommission - sales.today_commission) > 0.01) {
            console.log('\n⚠️ 警告：实际计算的今日佣金与数据库存储的不一致！');
            console.log('差额：$' + Math.abs(todayCommission - sales.today_commission).toFixed(2));
          }
        }
      }
    }
  } catch (error) {
    console.error('查询错误:', error.message);
  }
  
  process.exit(0);
}

checkOrder();