const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://itvmeamoqthfqtkpubdv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0dm1lYW1vcXRoZnF0a3B1YmR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0ODEyMzUsImV4cCI6MjA3MDA1NzIzNX0.ypBF3lJJTJtSPLEu1zWXqPorS-FDSZzRUy_0ge_Y-r0'
);

async function updateSalesStats() {
  try {
    console.log('========== 更新销售统计数据 ==========\n');
    
    // 获取所有销售记录
    const { data: sales, error: salesError } = await supabase
      .from('sales_optimized')
      .select('*');
    
    if (salesError) throw salesError;
    
    console.log(`找到 ${sales.length} 个销售记录需要更新\n`);
    
    // 计算中国时区的今日时间范围
    const now = new Date();
    const chinaToday = new Date();
    chinaToday.setUTCHours(16, 0, 0, 0); // UTC 16:00 = 中国时间 00:00
    const prevDay = new Date(chinaToday);
    prevDay.setDate(prevDay.getDate() - 1);
    
    // 如果当前UTC时间小于16:00，说明中国时间还在今天，需要用昨天16:00作为起点
    const todayStart = now.getUTCHours() < 16 ? prevDay : chinaToday;
    const todayEnd = new Date(todayStart);
    todayEnd.setDate(todayEnd.getDate() + 1);
    
    console.log('今日时间范围（中国时间）：');
    console.log('- 开始：', new Date(todayStart.getTime() + 8 * 60 * 60 * 1000).toLocaleString('zh-CN'));
    console.log('- 结束：', new Date(todayEnd.getTime() + 8 * 60 * 60 * 1000).toLocaleString('zh-CN'));
    console.log();
    
    for (const sale of sales) {
      console.log(`\n处理销售: ${sale.wechat_name} (${sale.sales_code})`);
      
      // 1. 计算直销订单统计（自己的订单）
      const { data: directOrders, error: directError } = await supabase
        .from('orders_optimized')
        .select('*')
        .eq('sales_code', sale.sales_code)
        .is('parent_sales_code', null);
      
      if (!directError && directOrders) {
        const directTotal = directOrders.reduce((sum, order) => sum + parseFloat(order.total_amount || order.amount || 0), 0);
        const directCommission = directTotal * 0.4; // 一级销售40%佣金
        
        console.log(`  直销订单: ${directOrders.length} 个, 总金额: $${directTotal}, 佣金: $${directCommission}`);
        
        // 2. 计算今日订单统计
        const { data: todayOrders, error: todayError } = await supabase
          .from('orders_optimized')
          .select('*')
          .or(`sales_code.eq.${sale.sales_code},parent_sales_code.eq.${sale.sales_code}`)
          .gte('created_at', todayStart.toISOString())
          .lt('created_at', todayEnd.toISOString());
        
        let todayOrderCount = 0;
        let todayAmount = 0;
        let todayCommission = 0;
        
        if (!todayError && todayOrders) {
          todayOrderCount = todayOrders.length;
          todayAmount = todayOrders.reduce((sum, order) => sum + parseFloat(order.total_amount || order.amount || 0), 0);
          todayCommission = todayOrders.reduce((sum, order) => sum + parseFloat(order.commission_amount || 0), 0);
          
          console.log(`  今日订单: ${todayOrderCount} 个, 金额: $${todayAmount}, 佣金: $${todayCommission}`);
        }
        
        // 3. 计算二级销售相关统计（如果是一级销售）
        let secondaryOrdersAmount = 0;
        let secondaryShareCommission = 0;
        let secondaryAvgRate = 0;
        
        if (sale.sales_type === 'primary' || sale.sales_level === 1) {
          const { data: secondaryOrders, error: secondaryError } = await supabase
            .from('orders_optimized')
            .select('*')
            .eq('parent_sales_code', sale.sales_code)
            .not('sales_code', 'eq', sale.sales_code);
          
          if (!secondaryError && secondaryOrders && secondaryOrders.length > 0) {
            secondaryOrdersAmount = secondaryOrders.reduce((sum, order) => sum + parseFloat(order.total_amount || order.amount || 0), 0);
            
            // 查找二级销售的佣金率
            const secondarySalesCodes = [...new Set(secondaryOrders.map(o => o.sales_code))];
            const { data: secondarySales } = await supabase
              .from('sales_optimized')
              .select('commission_rate')
              .in('sales_code', secondarySalesCodes);
            
            if (secondarySales && secondarySales.length > 0) {
              const totalRate = secondarySales.reduce((sum, s) => sum + parseFloat(s.commission_rate || 0), 0);
              secondaryAvgRate = totalRate / secondarySales.length;
            }
            
            // 一级销售从二级订单获得的佣金（40% - 二级佣金率）
            secondaryShareCommission = secondaryOrders.reduce((sum, order) => {
              const orderAmount = parseFloat(order.total_amount || order.amount || 0);
              const secondaryRate = 0.25; // 假设二级默认25%
              const primaryShare = 0.4 - secondaryRate; // 一级获得15%
              return sum + (orderAmount * primaryShare);
            }, 0);
            
            console.log(`  二级销售订单: 总额$${secondaryOrdersAmount}, 平均佣金率${(secondaryAvgRate * 100).toFixed(2)}%, 分成佣金$${secondaryShareCommission}`);
          }
        }
        
        // 4. 更新销售记录
        const updateData = {
          direct_commission: directCommission,
          today_orders: todayOrderCount,
          today_amount: todayAmount,
          today_commission: todayCommission,
          secondary_orders_amount: secondaryOrdersAmount,
          secondary_share_commission: secondaryShareCommission,
          secondary_avg_rate: secondaryAvgRate,
          updated_at: new Date().toISOString()
        };
        
        const { error: updateError } = await supabase
          .from('sales_optimized')
          .update(updateData)
          .eq('id', sale.id);
        
        if (updateError) {
          console.error(`  ❌ 更新失败:`, updateError.message);
        } else {
          console.log(`  ✅ 更新成功`);
        }
      }
    }
    
    console.log('\n========== 统计更新完成 ==========');
    
    // 再次检查订单381的情况
    console.log('\n========== 验证订单381 ==========');
    const { data: order381 } = await supabase
      .from('orders_optimized')
      .select('*')
      .eq('id', 381)
      .single();
    
    if (order381) {
      const { data: salesRecord } = await supabase
        .from('sales_optimized')
        .select('*')
        .eq('sales_code', order381.sales_code || order381.parent_sales_code)
        .single();
      
      if (salesRecord) {
        console.log('订单381对应的销售统计：');
        console.log('- 今日佣金:', salesRecord.today_commission);
        console.log('- 今日订单数:', salesRecord.today_orders);
        console.log('- 今日金额:', salesRecord.today_amount);
        console.log('- 直销佣金:', salesRecord.direct_commission);
      }
    }
    
  } catch (error) {
    console.error('更新失败:', error.message);
  }
  
  process.exit(0);
}

updateSalesStats();