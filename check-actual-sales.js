const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://itvmeamoqthfqtkpubdv.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInRlZiI6Iml0dm1lYW1vcXRoZnF0a3B1YmR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0ODEyMzUsImV4cCI6MjA3MDA1NzIzNX0.ypBF3lJJTJtSPLEu1zWXqPorS-FDSZzRUy_0ge_Y-r0');

async function checkSales() {
  console.log('📊 检查系统中的销售员数据');
  console.log('=====================================\n');
  
  // 1. 检查所有一级销售
  console.log('1️⃣ 一级销售员列表:');
  const { data: primarySales } = await supabase
    .from('sales_optimized')
    .select('*')
    .eq('sales_type', 'primary')
    .order('created_at', { ascending: false });
    
  if (primarySales && primarySales.length > 0) {
    console.log('找到 ' + primarySales.length + ' 个一级销售:');
    primarySales.forEach(s => {
      const wechatName = s.wechat_name || '未设置';
      const commission = s.total_commission || 0;
      console.log('  ' + s.sales_code + ' - ' + wechatName + ' (佣金率: ' + s.commission_rate + ', 总佣金: $' + commission + ')');
    });
  } else {
    console.log('❌ 没有找到一级销售');
  }
  
  // 2. 检查最近的订单
  console.log('\n2️⃣ 最近10个订单:');
  const { data: recentOrders } = await supabase
    .from('orders_optimized')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(10);
    
  if (recentOrders && recentOrders.length > 0) {
    recentOrders.forEach(o => {
      console.log('  ' + o.id + ' - 销售: ' + o.sales_code + ', 客户: ' + o.customer_wechat + ', 金额: $' + o.amount + ', 状态: ' + o.status);
    });
  } else {
    console.log('❌ 没有找到订单');
  }
  
  // 3. 检查是否有包含WML的销售代码
  console.log('\n3️⃣ 搜索包含WML的销售代码:');
  const { data: wmlSales } = await supabase
    .from('sales_optimized')
    .select('*')
    .like('sales_code', '%WML%');
    
  if (wmlSales && wmlSales.length > 0) {
    console.log('找到 ' + wmlSales.length + ' 个包含WML的销售代码:');
    wmlSales.forEach(s => {
      const wechatName = s.wechat_name || '未设置';
      console.log('  ' + s.sales_code + ' - ' + wechatName + ' (类型: ' + s.sales_type + ')');
    });
  } else {
    console.log('❌ 没有找到包含WML的销售代码');
  }
}

checkSales();
