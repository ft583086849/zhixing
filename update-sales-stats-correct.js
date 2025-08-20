const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://itvmeamoqthfqtkpubdv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0dm1lYW1vcXRoZnF0a3B1YmR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0ODEyMzUsImV4cCI6MjA3MDA1NzIzNX0.ypBF3lJJTJtSPLEu1zWXqPorS-FDSZzRUy_0ge_Y-r0'
);

async function updateSalesStatsCorrect() {
  try {
    console.log('========== 更新销售统计数据（正确版本）==========\n');
    
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
    
    // 处理每个销售的统计
    for (const sale of sales) {
      console.log(`\n处理销售: ${sale.wechat_name} (${sale.sales_code})`);
      
      // 1. 获取直销订单（该销售直接的订单）
      const { data: directOrders, error: directError } = await supabase
        .from('orders_optimized')
        .select('*')
        .eq('sales_code', sale.sales_code);
      
      if (directError) {
        console.error(`  ❌ 查询失败:`, directError.message);
        continue;
      }
      
      let directOrderCount = 0;
      let directTotalAmount = 0;
      let directCommission = 0;
      
      if (directOrders && directOrders.length > 0) {
        directOrderCount = directOrders.length;
        directTotalAmount = directOrders.reduce((sum, order) => sum + parseFloat(order.total_amount || order.amount || 0), 0);
        
        // 根据销售类型计算佣金
        if (sale.sales_type === 'primary' || sale.sales_level === 1) {
          // 一级销售：40%佣金
          directCommission = directTotalAmount * 0.4;
        } else {
          // 二级销售：使用自己的佣金率（默认25%）
          const rate = parseFloat(sale.commission_rate || 0.25);
          directCommission = directTotalAmount * rate;
        }
        
        console.log(`  直销订单: ${directOrderCount} 个, 总金额: $${directTotalAmount.toFixed(2)}, 佣金: $${directCommission.toFixed(2)}`);
      }
      
      // 2. 计算今日订单统计
      const { data: todayOrders, error: todayError } = await supabase
        .from('orders_optimized')
        .select('*')
        .eq('sales_code', sale.sales_code)
        .gte('created_at', todayStart.toISOString())
        .lt('created_at', todayEnd.toISOString());
      
      let todayOrderCount = 0;
      let todayAmount = 0;
      let todayCommission = 0;
      
      if (!todayError && todayOrders) {
        todayOrderCount = todayOrders.length;
        todayAmount = todayOrders.reduce((sum, order) => sum + parseFloat(order.total_amount || order.amount || 0), 0);
        todayCommission = todayOrders.reduce((sum, order) => sum + parseFloat(order.commission_amount || 0), 0);
        
        if (todayOrderCount > 0) {
          console.log(`  今日订单: ${todayOrderCount} 个, 金额: $${todayAmount.toFixed(2)}, 佣金: $${todayCommission.toFixed(2)}`);
        }
      }
      
      // 3. 如果是一级销售，计算二级销售的订单
      let secondaryOrdersAmount = 0;
      let secondaryShareCommission = 0;
      let secondaryAvgRate = 0;
      
      if (sale.sales_type === 'primary' || sale.sales_level === 1) {
        // 查找该一级销售的ID
        const { data: primarySalesRecord } = await supabase
          .from('primary_sales')
          .select('id')
          .eq('sales_code', sale.sales_code)
          .single();
        
        if (primarySalesRecord) {
          // 查询二级销售的订单（primary_sales_id 等于该一级销售的ID）
          const { data: secondaryOrders } = await supabase
            .from('orders_optimized')
            .select('*')
            .eq('primary_sales_id', primarySalesRecord.id)
            .eq('sales_type', 'secondary');
          
          if (secondaryOrders && secondaryOrders.length > 0) {
            secondaryOrdersAmount = secondaryOrders.reduce((sum, order) => sum + parseFloat(order.total_amount || order.amount || 0), 0);
            
            // 计算一级销售从二级订单获得的分成
            // 一级销售获得 = 40% - 二级销售佣金率（通常25%） = 15%
            secondaryShareCommission = secondaryOrdersAmount * 0.15;
            secondaryAvgRate = 0.25; // 二级销售默认佣金率
            
            console.log(`  二级销售订单: ${secondaryOrders.length} 个, 总额: $${secondaryOrdersAmount.toFixed(2)}, 分成佣金: $${secondaryShareCommission.toFixed(2)}`);
          }
        }
      }
      
      // 4. 更新销售记录
      const updateData = {
        // 直销统计
        total_orders: directOrderCount,
        total_amount: directTotalAmount,
        total_direct_orders: directOrderCount,
        total_direct_amount: directTotalAmount,
        direct_commission: directCommission,
        
        // 今日统计
        today_orders: todayOrderCount,
        today_amount: todayAmount,
        today_commission: todayCommission,
        
        // 二级销售相关（仅一级销售有）
        secondary_orders_amount: secondaryOrdersAmount,
        secondary_share_commission: secondaryShareCommission,
        secondary_avg_rate: secondaryAvgRate,
        
        // 总佣金 = 直销佣金 + 二级分成佣金
        total_commission: directCommission + secondaryShareCommission,
        
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
    
    console.log('\n========== 统计更新完成 ==========');
    
    // 再次验证订单381
    console.log('\n========== 验证订单381 ==========');
    const { data: order381 } = await supabase
      .from('orders_optimized')
      .select('*')
      .eq('id', 381)
      .single();
    
    if (order381) {
      console.log('订单381信息：');
      console.log('- 销售代码:', order381.sales_code);
      console.log('- 销售类型:', order381.sales_type);
      console.log('- 金额:', order381.total_amount || order381.amount);
      console.log('- 佣金:', order381.commission_amount);
      
      const { data: salesRecord } = await supabase
        .from('sales_optimized')
        .select('*')
        .eq('sales_code', order381.sales_code)
        .single();
      
      if (salesRecord) {
        console.log('\n对应销售的统计：');
        console.log('- 今日佣金:', salesRecord.today_commission);
        console.log('- 今日订单数:', salesRecord.today_orders);
        console.log('- 今日金额:', salesRecord.today_amount);
        console.log('- 直销佣金:', salesRecord.direct_commission);
        console.log('- 总佣金:', salesRecord.total_commission);
      }
    }
    
  } catch (error) {
    console.error('更新失败:', error.message);
  }
  
  process.exit(0);
}

updateSalesStatsCorrect();