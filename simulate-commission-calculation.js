const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://itvmeamoqthfqtkpubdv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0dm1lYW1vcXRoZnF0a3B1YmR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0ODEyMzUsImV4cCI6MjA3MDA1NzIzNX0.ypBF3lJJTJtSPLEu1zWXqPorS-FDSZzRUy_0ge_Y-r0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function simulateCommissionCalculation() {
  // 获取有实付金额的订单来模拟计算
  const { data: orders } = await supabase
    .from('orders_optimized')
    .select('sales_code, amount, actual_payment_amount, status')
    .eq('status', 'confirmed_config')
    .gt('amount', 0);
  
  // 按销售汇总
  const salesSummary = {};
  
  orders?.forEach(order => {
    if (!salesSummary[order.sales_code]) {
      salesSummary[order.sales_code] = {
        orders: 0,
        totalAmount: 0,
        totalActualPayment: 0
      };
    }
    salesSummary[order.sales_code].orders++;
    salesSummary[order.sales_code].totalAmount += order.amount || 0;
    salesSummary[order.sales_code].totalActualPayment += order.actual_payment_amount || order.amount || 0;
  });
  
  console.log('=== 使用实付金额计算的销售统计 ===\n');
  
  let totalDifference = 0;
  
  for (const [salesCode, summary] of Object.entries(salesSummary)) {
    // 获取销售信息
    const { data: sale } = await supabase
      .from('sales_optimized')
      .select('wechat_name, sales_type, commission_rate')
      .eq('sales_code', salesCode)
      .single();
    
    if (sale) {
      const rate = sale.commission_rate || (sale.sales_type === 'primary' ? 0.4 : 0.25);
      const commissionByAmount = summary.totalAmount * rate;
      const commissionByActual = summary.totalActualPayment * rate;
      const diff = commissionByActual - commissionByAmount;
      
      console.log('销售:', sale.wechat_name || salesCode);
      console.log('  类型:', sale.sales_type);
      console.log('  佣金率:', (rate * 100).toFixed(1) + '%');
      console.log('  订单数:', summary.orders);
      console.log('  订单金额总计: $' + summary.totalAmount);
      console.log('  实付金额总计: $' + summary.totalActualPayment);
      
      if (summary.totalAmount !== summary.totalActualPayment) {
        console.log('  💡 金额差异: $' + (summary.totalActualPayment - summary.totalAmount));
        console.log('  按订单金额算佣金: $' + commissionByAmount.toFixed(2));
        console.log('  按实付金额算佣金: $' + commissionByActual.toFixed(2));
        console.log('  佣金差额: $' + diff.toFixed(2));
      } else {
        console.log('  佣金: $' + commissionByActual.toFixed(2));
      }
      
      console.log('');
      totalDifference += diff;
    }
  }
  
  console.log('=== 总结 ===');
  console.log('如果都使用实付金额计算，佣金总差额: $' + totalDifference.toFixed(2));
  
  // 查看实付金额和订单金额的差异
  const { data: diffOrders } = await supabase
    .from('orders_optimized')
    .select('id, customer_wechat, amount, actual_payment_amount')
    .eq('status', 'confirmed_config')
    .not('actual_payment_amount', 'is', null)
    .neq('actual_payment_amount', 0);
  
  if (diffOrders && diffOrders.length > 0) {
    console.log('\n=== 有实付金额的订单 ===');
    diffOrders.forEach(order => {
      if (order.amount !== order.actual_payment_amount) {
        console.log(`订单${order.id}: 订单金额=$${order.amount}, 实付金额=$${order.actual_payment_amount}, 差额=$${order.actual_payment_amount - order.amount}`);
      }
    });
  }
}

simulateCommissionCalculation();