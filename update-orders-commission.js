/**
 * 更新orders_optimized表的佣金数据
 * 从sales_optimized表获取正确的佣金率，计算并更新订单佣金
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://itvmeamoqthfqtkpubdv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0dm1lYW1vcXRoZnF0a3B1YmR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0ODEyMzUsImV4cCI6MjA3MDA1NzIzNX0.ypBF3lJJTJtSPLEu1zWXqPorS-FDSZzRUy_0ge_Y-r0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function updateOrdersCommission() {
  console.log('=== 开始更新订单佣金数据 ===\n');
  
  // 1. 获取所有销售的佣金率信息
  const { data: salesData, error: salesError } = await supabase
    .from('sales_optimized')
    .select('sales_code, sales_type, commission_rate, parent_sales_code, wechat_name');
  
  if (salesError) {
    console.error('获取销售数据失败:', salesError);
    return;
  }
  
  // 创建销售映射
  const salesMap = {};
  salesData.forEach(sale => {
    salesMap[sale.sales_code] = sale;
  });
  
  console.log(`加载了 ${salesData.length} 个销售的佣金率数据\n`);
  
  // 2. 获取所有需要更新的订单（有金额且非拒绝）
  const { data: orders, error: ordersError } = await supabase
    .from('orders_optimized')
    .select('id, sales_code, amount, status, commission_rate, commission_amount, secondary_commission_amount')
    .gt('amount', 0)
    .neq('status', 'rejected');
  
  if (ordersError) {
    console.error('获取订单数据失败:', ordersError);
    return;
  }
  
  console.log(`找到 ${orders.length} 个需要处理的订单\n`);
  
  // 3. 逐个更新订单的佣金数据
  let updatedCount = 0;
  let errorCount = 0;
  
  for (const order of orders) {
    const sale = salesMap[order.sales_code];
    
    if (!sale) {
      console.log(`警告: 订单 ${order.id} 的销售代码 ${order.sales_code} 未找到`);
      continue;
    }
    
    // 计算佣金
    let commissionRate = sale.commission_rate || (sale.sales_type === 'primary' ? 0.4 : 0.25);
    let commissionAmount = order.amount * commissionRate;
    let secondaryCommissionAmount = 0;
    
    // 如果是二级销售，计算一级的分销佣金
    if (sale.sales_type === 'secondary' && sale.parent_sales_code) {
      const parentSale = salesMap[sale.parent_sales_code];
      if (parentSale) {
        const parentRate = parentSale.commission_rate || 0.4;
        // 一级从二级订单获得的分销佣金 = 订单金额 × (一级佣金率 - 二级佣金率)
        secondaryCommissionAmount = order.amount * (parentRate - commissionRate);
      }
    }
    
    // 更新订单
    const { error: updateError } = await supabase
      .from('orders_optimized')
      .update({
        commission_rate: commissionRate,
        commission_amount: commissionAmount,
        secondary_commission_amount: secondaryCommissionAmount
      })
      .eq('id', order.id);
    
    if (updateError) {
      console.error(`更新订单 ${order.id} 失败:`, updateError);
      errorCount++;
    } else {
      updatedCount++;
      if (updatedCount % 10 === 0) {
        console.log(`已更新 ${updatedCount} 个订单...`);
      }
    }
  }
  
  console.log('\n=== 更新完成 ===');
  console.log(`成功更新: ${updatedCount} 个订单`);
  console.log(`更新失败: ${errorCount} 个订单`);
  
  // 4. 验证更新结果
  const { data: verifyData, error: verifyError } = await supabase
    .from('orders_optimized')
    .select('commission_rate, commission_amount, secondary_commission_amount')
    .gt('amount', 0)
    .neq('status', 'rejected');
  
  if (!verifyError) {
    const hasRate = verifyData.filter(o => o.commission_rate > 0).length;
    const hasAmount = verifyData.filter(o => o.commission_amount > 0).length;
    const hasSecondary = verifyData.filter(o => o.secondary_commission_amount > 0).length;
    
    console.log('\n=== 验证结果 ===');
    console.log(`有佣金率的订单: ${hasRate}/${verifyData.length} (${(hasRate/verifyData.length*100).toFixed(1)}%)`);
    console.log(`有佣金金额的订单: ${hasAmount}/${verifyData.length} (${(hasAmount/verifyData.length*100).toFixed(1)}%)`);
    console.log(`有二级分销佣金的订单: ${hasSecondary}/${verifyData.length}`);
  }
}

// 执行更新
updateOrdersCommission().catch(console.error);