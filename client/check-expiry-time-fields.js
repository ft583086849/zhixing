const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://itvmeamoqthfqtkpubdv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0dm1lYW1vcXRoZnF0a3B1YmR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0ODEyMzUsImV4cCI6MjA3MDA1NzIzNX0.ypBF3lJJTJtSPLEu1zWXqPorS-FDSZzRUy_0ge_Y-r0'
);

async function checkExpiryTimeFields() {
  console.log('🔍 检查数据库中 expiry_time 字段的实际情况');
  console.log('=' .repeat(60));
  
  // 1. 查询 Liangjunhao889 的所有订单
  const { data: sales } = await supabase
    .from('sales_optimized')
    .select('sales_code')
    .eq('wechat_name', 'Liangjunhao889')
    .single();
    
  if (!sales) {
    console.log('未找到销售 Liangjunhao889');
    return;
  }
  
  console.log('销售代码:', sales.sales_code);
  
  // 2. 查询该销售的所有订单
  const { data: orders } = await supabase
    .from('orders_optimized')
    .select('id, customer_wechat, duration, status, created_at, effective_time, expiry_time, config_time')
    .eq('sales_code', sales.sales_code)
    .order('id');
    
  console.log(`\n找到 ${orders?.length || 0} 个订单\n`);
  
  // 3. 统计分析
  let emptyExpiryCount = 0;
  let hasExpiryCount = 0;
  let emptyEffectiveCount = 0;
  let hasEffectiveCount = 0;
  
  console.log('订单详情:');
  console.log('-'.repeat(100));
  
  orders?.forEach(order => {
    if (order.expiry_time) {
      hasExpiryCount++;
    } else {
      emptyExpiryCount++;
    }
    
    if (order.effective_time) {
      hasEffectiveCount++;
    } else {
      emptyEffectiveCount++;
    }
    
    console.log(`ID: ${order.id.toString().padEnd(4)} | 客户: ${order.customer_wechat.padEnd(15)} | 状态: ${order.status.padEnd(17)}`);
    console.log(`  创建时间: ${order.created_at}`);
    console.log(`  生效时间: ${order.effective_time || '【空】'}`);
    console.log(`  到期时间: ${order.expiry_time || '【空】'}`);
    console.log(`  配置时间: ${order.config_time || '【空】'}`);
    console.log(`  购买时长: ${order.duration}`);
    console.log('-'.repeat(100));
  });
  
  // 4. 统计结果
  console.log('\n📊 统计结果:');
  console.log(`总订单数: ${orders?.length || 0}`);
  console.log(`有 expiry_time 的订单: ${hasExpiryCount} 个`);
  console.log(`无 expiry_time 的订单: ${emptyExpiryCount} 个`);
  console.log(`有 effective_time 的订单: ${hasEffectiveCount} 个`);
  console.log(`无 effective_time 的订单: ${emptyEffectiveCount} 个`);
  
  // 5. 查看客户管理页面使用的表
  console.log('\n🔍 检查 customers_optimized 表（客户管理页面使用）:');
  const { data: customers } = await supabase
    .from('customers_optimized')
    .select('customer_wechat, expiry_time, status, total_amount')
    .eq('sales_wechat_name', 'Liangjunhao889');
    
  console.log(`\ncustomers_optimized 表中有 ${customers?.length || 0} 条记录`);
  
  if (customers && customers.length > 0) {
    console.log('\n客户记录:');
    customers.forEach(c => {
      console.log(`- ${c.customer_wechat}: 到期时间=${c.expiry_time || '空'}, 状态=${c.status}, 金额=${c.total_amount}`);
    });
  }
  
  console.log('\n💡 结论:');
  console.log('1. orders_optimized 表是订单明细表');
  console.log('2. customers_optimized 表是客户汇总表（客户管理页面用这个）');
  console.log('3. 如果 orders_optimized 表的 expiry_time 为空，前端需要计算');
  console.log('4. 线上订单管理页面可能用的是 customers_optimized 表的数据');
}

checkExpiryTimeFields().catch(console.error);