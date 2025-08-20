// 修复一级销售的佣金数据计算
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: 'client/.env.local' });

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL || 'https://xitwfcfrpvmipqxzjqgo.supabase.co',
  process.env.REACT_APP_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhpdHdmY2ZycHZtaXBxeHpqcWdvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjI0ODA1MTksImV4cCI6MjAzODA1NjUxOX0.8lv5zB7JDaEJPPqT5eTLJJhJWrS9U8FdObB3mGdqLEc'
);

async function fixPrimarySalesCommissionData() {
  console.log('🔧 修复一级销售佣金数据...\n');
  
  try {
    // 1. 获取所有一级销售
    const { data: primarySales, error: primaryError } = await supabase
      .from('sales_optimized')
      .select('*')
      .eq('sales_type', 'primary');
    
    if (primaryError) {
      console.error('查询一级销售失败:', primaryError);
      return;
    }
    
    console.log(`找到 ${primarySales?.length || 0} 个一级销售\n`);
    
    for (const primarySale of primarySales) {
      console.log(`处理一级销售: ${primarySale.wechat_name} (${primarySale.sales_code})`);
      
      // 2. 获取该一级销售的直销订单
      const { data: directOrders } = await supabase
        .from('orders_optimized')
        .select('*')
        .eq('sales_code', primarySale.sales_code)
        .in('status', ['confirmed', 'confirmed_config', 'paid', 'completed', 'active']);
      
      const directAmount = directOrders?.reduce((sum, o) => sum + (o.amount || 0), 0) || 0;
      const directCommission = directAmount * 0.4; // 一级销售40%佣金
      
      console.log(`  直销订单: ${directOrders?.length || 0}个, 金额: ${directAmount}, 佣金: ${directCommission}`);
      
      // 3. 获取该一级销售的所有二级销售
      const { data: secondarySales } = await supabase
        .from('sales_optimized')
        .select('*')
        .eq('parent_sales_code', primarySale.sales_code)
        .eq('sales_type', 'secondary');
      
      console.log(`  二级销售: ${secondarySales?.length || 0}个`);
      
      let secondaryOrdersAmount = 0;
      let secondaryTotalCommission = 0;
      let secondaryShareCommission = 0;
      let avgSecondaryRate = 0;
      
      if (secondarySales && secondarySales.length > 0) {
        // 4. 计算每个二级销售的数据
        for (const ss of secondarySales) {
          // 获取二级销售的订单
          const { data: ssOrders } = await supabase
            .from('orders_optimized')
            .select('*')
            .eq('sales_code', ss.sales_code)
            .in('status', ['confirmed', 'confirmed_config', 'paid', 'completed', 'active']);
          
          const ssAmount = ssOrders?.reduce((sum, o) => sum + (o.amount || 0), 0) || 0;
          const ssRate = ss.commission_rate || 0.25; // 默认25%
          const ssCommission = ssAmount * ssRate;
          const ssShareCommission = ssAmount * (0.4 - ssRate); // 一级销售的返佣
          
          secondaryOrdersAmount += ssAmount;
          secondaryTotalCommission += ssCommission;
          secondaryShareCommission += ssShareCommission;
          
          // 更新二级销售的统计数据
          await supabase
            .from('sales_optimized')
            .update({
              total_amount: ssAmount,
              total_commission: ssCommission,
              total_orders: ssOrders?.length || 0
            })
            .eq('id', ss.id);
          
          console.log(`    - ${ss.wechat_name}: 订单${ssOrders?.length}个, 金额${ssAmount}, 佣金率${ssRate}`);
        }
        
        // 计算平均二级佣金率
        if (secondaryOrdersAmount > 0) {
          avgSecondaryRate = secondaryTotalCommission / secondaryOrdersAmount;
        }
      }
      
      // 5. 更新一级销售的统计数据
      const totalCommission = directCommission + secondaryShareCommission;
      
      const updateData = {
        // 基础统计
        total_amount: directAmount,
        total_orders: directOrders?.length || 0,
        total_commission: totalCommission,
        
        // v2.0佣金系统字段
        direct_commission: directCommission,
        direct_orders_amount: directAmount,
        secondary_orders_amount: secondaryOrdersAmount,
        secondary_avg_rate: avgSecondaryRate,
        secondary_share_commission: secondaryShareCommission,
        
        // 更新时间
        updated_at: new Date().toISOString()
      };
      
      const { error: updateError } = await supabase
        .from('sales_optimized')
        .update(updateData)
        .eq('id', primarySale.id);
      
      if (updateError) {
        console.error(`  ❌ 更新失败:`, updateError);
      } else {
        console.log(`  ✅ 更新成功:`);
        console.log(`     - 总佣金: ${totalCommission}`);
        console.log(`     - 直销佣金: ${directCommission}`);
        console.log(`     - 二级返佣: ${secondaryShareCommission}`);
        console.log(`     - 平均二级佣金率: ${(avgSecondaryRate * 100).toFixed(2)}%`);
        console.log(`     - 二级订单总额: ${secondaryOrdersAmount}`);
      }
      
      console.log('');
    }
    
    console.log('✅ 所有一级销售佣金数据修复完成！');
    
    // 6. 验证修复结果
    console.log('\n验证修复结果...');
    const { data: verifyData } = await supabase
      .from('sales_optimized')
      .select('wechat_name, sales_code, total_commission, direct_commission, secondary_share_commission')
      .eq('sales_type', 'primary')
      .eq('sales_code', 'PRI17547241780648255')
      .single();
    
    if (verifyData) {
      console.log('WML792355703的修复后数据:');
      console.log('  总佣金:', verifyData.total_commission);
      console.log('  直销佣金:', verifyData.direct_commission);
      console.log('  二级返佣:', verifyData.secondary_share_commission);
    }
    
  } catch (error) {
    console.error('修复过程出错:', error);
  }
}

// 执行修复
fixPrimarySalesCommissionData();