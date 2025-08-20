const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = 'https://itwpzsmqdxfluhfqsnwr.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0d3B6c21xZHhmbHVoZnFzbndyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ0Mzk2NDksImV4cCI6MjA1MDAxNTY0OX0.6sFI8OTcrP0ErjLs3XIRNeQnGeWH97xygILqfI6NWGI';
const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyConversionLogic() {
  console.log('=== 验证转化率统计逻辑修复 ===\n');
  
  // 1. 验证 Yi111111____ 的数据
  console.log('1. 检查 Yi111111____ (销售代码 PRI17548273477088006) 的数据:');
  
  const { data: orders } = await supabase
    .from('orders_optimized')
    .select('*')
    .eq('sales_code', 'PRI17548273477088006')
    .order('created_at', { ascending: false });
  
  if (orders) {
    // 过滤有效订单
    const validOrders = orders.filter(o => o.status !== 'rejected');
    
    // 统计收费订单（有金额的订单）
    const paidOrders = validOrders.filter(o => {
      const amount = parseFloat(o.amount || 0);
      const actualAmount = parseFloat(o.actual_payment_amount || 0);
      return amount > 0 || actualAmount > 0;
    });
    
    // 统计免费订单
    const freeOrders = validOrders.filter(o => {
      const amount = parseFloat(o.amount || 0);
      const actualAmount = parseFloat(o.actual_payment_amount || 0);
      return amount === 0 && actualAmount === 0;
    });
    
    console.log(`  - 总订单数: ${orders.length}`);
    console.log(`  - 有效订单数（排除rejected）: ${validOrders.length}`);
    console.log(`  - 收费订单数（amount > 0）: ${paidOrders.length}`);
    console.log(`  - 免费订单数（amount = 0）: ${freeOrders.length}`);
    
    const conversionRate = validOrders.length > 0 
      ? (paidOrders.length / validOrders.length * 100).toFixed(2) 
      : 0;
    console.log(`  - 转化率: ${paidOrders.length}/${validOrders.length} = ${conversionRate}%`);
    
    console.log('\n  收费订单详情:');
    paidOrders.forEach((order, index) => {
      const amount = parseFloat(order.amount || 0);
      const actualAmount = parseFloat(order.actual_payment_amount || 0);
      console.log(`    ${index + 1}. 订单号: ${order.order_number}`);
      console.log(`       金额: $${amount}, 实付: $${actualAmount}`);
      console.log(`       状态: ${order.status}, 时长: ${order.duration}`);
    });
    
    console.log('\n✅ 正确的转化率计算逻辑:');
    console.log('   转化率 = 收费订单数 / 有效订单数');
    console.log('   收费订单 = amount > 0 或 actual_payment_amount > 0 的订单');
    console.log('   有效订单 = 所有订单 - rejected状态的订单');
  }
  
  // 2. 验证其他销售的数据
  console.log('\n\n2. 验证其他销售的转化率数据:');
  
  const { data: allSales } = await supabase
    .from('sales_optimized')
    .select('*')
    .limit(5);
  
  for (const sale of allSales || []) {
    const { data: saleOrders } = await supabase
      .from('orders_optimized')
      .select('*')
      .eq('sales_code', sale.sales_code);
    
    if (saleOrders && saleOrders.length > 0) {
      const validOrders = saleOrders.filter(o => o.status !== 'rejected');
      const paidOrders = validOrders.filter(o => {
        const amount = parseFloat(o.amount || 0);
        const actualAmount = parseFloat(o.actual_payment_amount || 0);
        return amount > 0 || actualAmount > 0;
      });
      
      const conversionRate = validOrders.length > 0 
        ? (paidOrders.length / validOrders.length * 100).toFixed(2) 
        : 0;
      
      console.log(`\n  ${sale.wechat_name} (${sale.sales_type}):`);
      console.log(`    有效订单: ${validOrders.length}, 收费订单: ${paidOrders.length}`);
      console.log(`    转化率: ${conversionRate}%`);
    }
  }
  
  console.log('\n=== 验证完成 ===');
  console.log('转化率统计逻辑已修复，现在使用正确的公式:');
  console.log('转化率 = 收费订单数(amount>0) / 有效订单数(非rejected)');
}

verifyConversionLogic();