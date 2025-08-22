#!/usr/bin/env node

async function checkSalesOrdersLogic() {
  try {
    const { SupabaseService } = await import('./client/src/services/supabase.js');
    const supabase = SupabaseService.supabase;
    
    console.log('🔍 检查一级销售的订单统计逻辑...');
    
    // 获取一级销售的统计数据
    const { data: primarySales, error } = await supabase
      .from('sales_optimized')
      .select('sales_code, wechat_name, total_orders, total_direct_orders, total_team_orders')
      .eq('sales_type', 'primary')
      .gt('total_orders', 0)
      .order('total_orders', { ascending: false })
      .limit(10);
    
    if (error) {
      console.error('❌ 查询失败:', error);
      return;
    }
    
    if (primarySales && primarySales.length > 0) {
      console.log('\n📊 一级销售订单统计分析：');
      console.log('='.repeat(80));
      console.log('销售代码 | 微信号 | 总订单 | 直销订单 | 团队订单 | 计算值 | 是否正确');
      console.log('-'.repeat(80));
      
      let correctCount = 0;
      let incorrectCount = 0;
      
      primarySales.forEach(sale => {
        const directOrders = sale.total_direct_orders || 0;
        const teamOrders = sale.total_team_orders || 0;
        const totalOrders = sale.total_orders || 0;
        const calculatedTotal = directOrders + teamOrders;
        const isCorrect = totalOrders === calculatedTotal;
        
        if (isCorrect) correctCount++;
        else incorrectCount++;
        
        console.log(
          `${sale.sales_code.padEnd(12)} | ` +
          `${(sale.wechat_name || '-').padEnd(10)} | ` +
          `${String(totalOrders).padStart(6)} | ` +
          `${String(directOrders).padStart(8)} | ` +
          `${String(teamOrders).padStart(8)} | ` +
          `${String(calculatedTotal).padStart(6)} | ` +
          `${isCorrect ? '✅ 正确' : '❌ 错误'}`
        );
      });
      
      console.log('='.repeat(80));
      console.log(`\n📈 统计结果：`);
      console.log(`  - ✅ 正确: ${correctCount} 个`);
      console.log(`  - ❌ 错误: ${incorrectCount} 个`);
      
      if (incorrectCount > 0) {
        console.log('\n⚠️ 发现数据不一致，可能需要运行触发器重新计算');
        console.log('💡 解决方案：运行 recalculate_all_sales_optimized() 函数');
      } else {
        console.log('\n✅ 所有一级销售的订单统计逻辑都是正确的');
      }
    } else {
      console.log('⚠️ 没有找到一级销售数据');
    }
    
  } catch (err) {
    console.error('❌ 执行出错:', err.message);
  }
}

checkSalesOrdersLogic();