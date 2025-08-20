const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './client/.env' });

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY
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
    
    console.log('订单381详情：');
    console.log('- ID:', order.id);
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
        console.log('\n对应销售记录：');
        console.log('- 销售代码:', sales.sales_code);
        console.log('- 微信名称:', sales.wechat_name);
        console.log('- 今日佣金:', sales.today_commission);
        console.log('- 今日订单数:', sales.today_orders);
        console.log('- 今日金额:', sales.today_amount);
        console.log('- 直销佣金:', sales.direct_commission);
        console.log('- 总佣金:', sales.total_commission);
        console.log('- 更新时间:', sales.updated_at);
        
        // 计算今日时间范围（中国时区 UTC+8）
        const now = new Date();
        const chinaOffset = 8 * 60; // 中国时区偏移量（分钟）
        const localOffset = now.getTimezoneOffset(); // 本地时区偏移量（分钟）
        const diff = chinaOffset + localOffset; // 时差（分钟）
        
        // 获取中国时区的今天开始时间
        const chinaToday = new Date(now.getTime() + diff * 60 * 1000);
        chinaToday.setHours(0, 0, 0, 0);
        const today = new Date(chinaToday.getTime() - diff * 60 * 1000); // 转回UTC
        
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        // 查询今日所有订单
        const { data: todayOrders, error: todayError } = await supabase
          .from('orders_optimized')
          .select('id, total_amount, commission_amount, created_at')
          .or(`sales_code.eq.${salesCode},parent_sales_code.eq.${salesCode}`)
          .gte('created_at', today.toISOString())
          .lt('created_at', tomorrow.toISOString());
        
        if (!todayError && todayOrders) {
          console.log('\n今日订单列表：');
          let todayTotal = 0;
          let todayCommission = 0;
          todayOrders.forEach(o => {
            console.log(`  订单${o.id}: 金额$${o.total_amount}, 佣金$${o.commission_amount}, 时间${o.created_at}`);
            todayTotal += parseFloat(o.total_amount || 0);
            todayCommission += parseFloat(o.commission_amount || 0);
          });
          console.log(`今日订单数: ${todayOrders.length}`);
          console.log(`今日总金额: $${todayTotal.toFixed(2)}`);
          console.log(`今日总佣金: $${todayCommission.toFixed(2)}`);
          console.log(`数据库中的今日佣金: $${sales.today_commission}`);
          
          if (Math.abs(todayCommission - sales.today_commission) > 0.01) {
            console.log('\n⚠️ 警告：实际计算的今日佣金与数据库存储的不一致！');
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