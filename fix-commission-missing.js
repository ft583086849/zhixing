/**
 * 修复缺失的佣金数据
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://itvmeamoqthfqtkpubdv.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0dm1lYW1vcXRoZnF0a3B1YmR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0ODEyMzUsImV4cCI6MjA3MDA1NzIzNX0.ypBF3lJJTJtSPLEu1zWXqPorS-FDSZzRUy_0ge_Y-r0';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function fixMissingCommission() {
  console.log('修复缺失的佣金数据');
  console.log('===================\n');

  try {
    // 1. 获取所有有销售代码但没有佣金的订单
    const { data: ordersWithoutCommission } = await supabase
      .from('orders_optimized')
      .select('*')
      .not('sales_code', 'is', null)
      .or('commission_rate_primary.is.null,commission_amount_primary.is.null,commission_amount_primary.eq.0')
      .eq('status', 'confirmed_config');
    
    console.log(`找到 ${ordersWithoutCommission?.length || 0} 个需要修复的订单\n`);
    
    if (!ordersWithoutCommission || ordersWithoutCommission.length === 0) {
      console.log('没有需要修复的订单');
      return;
    }
    
    // 2. 获取所有销售信息
    const salesCodes = [...new Set(ordersWithoutCommission.map(o => o.sales_code).filter(Boolean))];
    const { data: salesData } = await supabase
      .from('sales')
      .select('*')
      .in('sales_code', salesCodes);
    
    const salesMap = {};
    salesData?.forEach(sale => {
      salesMap[sale.sales_code] = sale;
    });
    
    console.log(`销售信息：`);
    Object.values(salesMap).forEach(sale => {
      console.log(`  ${sale.sales_code}: ${sale.name} (${sale.commission_rate}%)`);
    });
    console.log('');
    
    // 3. 修复每个订单
    let fixedCount = 0;
    for (const order of ordersWithoutCommission) {
      const sale = salesMap[order.sales_code];
      if (!sale) {
        console.log(`⚠️ 订单 ${order.id} 的销售代码 ${order.sales_code} 无效`);
        continue;
      }
      
      // 计算佣金
      const primaryCommission = parseFloat((order.amount * sale.commission_rate / 100).toFixed(2));
      
      // 检查是否有二级销售
      let secondaryCommission = 0;
      let secondaryRate = 0;
      if (sale.parent_sales_code) {
        const parentSale = salesMap[sale.parent_sales_code];
        if (parentSale) {
          secondaryRate = parentSale.secondary_rate || 0;
          secondaryCommission = parseFloat((order.amount * secondaryRate / 100).toFixed(2));
        }
      }
      
      console.log(`修复订单 ${order.id} (${order.tradingview_username}):`);
      console.log(`  金额: ¥${order.amount}`);
      console.log(`  一级: ${sale.commission_rate}% = ¥${primaryCommission}`);
      if (secondaryCommission > 0) {
        console.log(`  二级: ${secondaryRate}% = ¥${secondaryCommission}`);
      }
      
      // 更新订单
      const { error } = await supabase
        .from('orders_optimized')
        .update({
          commission_rate_primary: sale.commission_rate,
          commission_amount_primary: primaryCommission,
          commission_rate_secondary: secondaryRate || null,
          commission_amount_secondary: secondaryCommission || null
        })
        .eq('id', order.id);
      
      if (error) {
        console.log(`  ❌ 更新失败: ${error.message}`);
      } else {
        console.log(`  ✅ 更新成功`);
        fixedCount++;
      }
    }
    
    console.log(`\n总结：成功修复 ${fixedCount}/${ordersWithoutCommission.length} 个订单`);
    
  } catch (error) {
    console.error('修复过程出错:', error);
  }
}

// 执行修复
fixMissingCommission();