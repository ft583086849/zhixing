const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://itvmeamoqthfqtkpubdv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0dm1lYW1vcXRoZnF0a3B1YmR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0ODEyMzUsImV4cCI6MjA3MDA1NzIzNX0.ypBF3lJJTJtSPLEu1zWXqPorS-FDSZzRUy_0ge_Y-r0'
);

async function checkUserSalesLimit() {
  console.log('检查：一个TradingView用户是否只能归属一个销售');
  console.log('=====================================\n');
  
  // 获取所有订单
  const { data: orders } = await supabase
    .from('orders')
    .select('tradingview_username, sales_code, order_number, status')
    .not('sales_code', 'is', null)
    .not('tradingview_username', 'is', null)
    .order('tradingview_username');
  
  // 统计每个用户的不同销售码
  const userSalesMap = {};
  
  orders.forEach(order => {
    const user = order.tradingview_username;
    const code = order.sales_code;
    
    if (!userSalesMap[user]) {
      userSalesMap[user] = {
        salesCodes: new Set(),
        orders: []
      };
    }
    
    userSalesMap[user].salesCodes.add(code);
    userSalesMap[user].orders.push({
      orderNumber: order.order_number,
      salesCode: code,
      status: order.status
    });
  });
  
  // 分析结果
  let singleSalesUsers = 0;
  let multiSalesUsers = 0;
  const multiSalesExamples = [];
  
  for (const [user, data] of Object.entries(userSalesMap)) {
    if (data.salesCodes.size === 1) {
      singleSalesUsers++;
    } else {
      multiSalesUsers++;
      if (multiSalesExamples.length < 5) {
        multiSalesExamples.push({
          user,
          salesCount: data.salesCodes.size,
          salesCodes: Array.from(data.salesCodes),
          orderCount: data.orders.length
        });
      }
    }
  }
  
  // 输出结果
  console.log('统计结果：');
  console.log(`  总用户数: ${singleSalesUsers + multiSalesUsers}`);
  console.log(`  只有一个销售的用户: ${singleSalesUsers} (${(singleSalesUsers/(singleSalesUsers+multiSalesUsers)*100).toFixed(1)}%)`);
  console.log(`  有多个销售的用户: ${multiSalesUsers} (${(multiSalesUsers/(singleSalesUsers+multiSalesUsers)*100).toFixed(1)}%)`);
  
  if (multiSalesUsers > 0) {
    console.log('\n❌ 系统没有严格限制一个用户只能归属一个销售');
    console.log('\n有多个销售的用户示例：');
    multiSalesExamples.forEach(example => {
      console.log(`\n  用户: ${example.user}`);
      console.log(`  销售数量: ${example.salesCount}`);
      console.log(`  订单数量: ${example.orderCount}`);
      console.log(`  销售码: ${example.salesCodes.join(', ')}`);
    });
  } else {
    console.log('\n✅ 确认：系统严格限制一个用户只能归属一个销售');
  }
  
  // 特别检查 zengyitian588
  console.log('\n=====================================');
  console.log('zengyitian588 的情况：');
  const { data: zen } = await supabase
    .from('orders')
    .select('*')
    .eq('tradingview_username', 'zengyitian588');
  
  console.log(`  订单数: ${zen.length}`);
  zen.forEach(order => {
    console.log(`  - 订单号: ${order.order_number}`);
    console.log(`    销售码: ${order.sales_code}`);
    console.log(`    状态: ${order.status}`);
  });
}

checkUserSalesLimit();