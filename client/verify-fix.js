const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://itvmeamoqthfqtkpubdv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0dm1lYW1vcXRoZnF0a3B1YmR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0ODEyMzUsImV4cCI6MjA3MDA1NzIzNX0.ypBF3lJJTJtSPLEu1zWXqPorS-FDSZzRUy_0ge_Y-r0'
);

// 模拟前端的计算逻辑
function calculateExpiryTime(order) {
  if (!order.effective_time && !order.created_at) return null;
  
  const startDate = new Date(order.effective_time || order.created_at);
  const expiryDate = new Date(startDate);
  
  // 修复后的逻辑 - 支持中文
  switch(order.duration) {
    case '7days':
    case '7天':
      expiryDate.setDate(expiryDate.getDate() + 7);
      break;
    case '1month':
    case '1个月':
      expiryDate.setMonth(expiryDate.getMonth() + 1);
      break;
    case '3months':
    case '3个月':
      expiryDate.setMonth(expiryDate.getMonth() + 3);
      break;
    case '6months':
    case '6个月':
      expiryDate.setMonth(expiryDate.getMonth() + 6);
      break;
    case '1year':
    case '1年':
      expiryDate.setFullYear(expiryDate.getFullYear() + 1);
      break;
    default:
      return null;
  }
  
  return expiryDate.toISOString();
}

async function verifyFix() {
  console.log('🧪 验证修复是否生效');
  console.log('=' .repeat(60));
  
  // 1. 获取销售信息
  const { data: sales } = await supabase
    .from('sales_optimized')
    .select('*')
    .eq('wechat_name', 'Liangjunhao889')
    .single();
    
  if (!sales) {
    console.log('❌ 未找到销售 Liangjunhao889');
    return;
  }
  console.log('✅ 找到销售:', sales.wechat_name, '代码:', sales.sales_code);
  
  // 2. 获取活跃订单（模拟 getSecondarySalesSettlement 的逻辑）
  const { data: allActiveOrders } = await supabase
    .from('orders_optimized')
    .select('*')
    .eq('sales_code', sales.sales_code)
    .in('status', ['confirmed_config', 'active'])
    .order('created_at', { ascending: false });
    
  console.log(`\n📋 查询到 ${allActiveOrders?.length || 0} 个活跃订单`);
  
  // 3. 为订单计算到期时间并筛选催单
  let reminderOrders = [];
  
  if (allActiveOrders && allActiveOrders.length > 0) {
    // 添加到期时间
    allActiveOrders.forEach(order => {
      if (!order.expiry_time) {
        order.expiry_time = calculateExpiryTime(order);
      }
    });
    
    // 筛选需要催单的订单
    reminderOrders = allActiveOrders.filter(order => {
      if (!order.expiry_time) return false;
      
      const now = new Date();
      const expiry = new Date(order.expiry_time);
      const diffTime = expiry - now;
      const daysUntilExpiry = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      // 判断是否有金额
      const hasAmount = (order.total_amount || order.amount || 0) > 0;
      const reminderDays = hasAmount ? 7 : 3;
      
      // 催单条件
      const needReminder = (daysUntilExpiry >= 0 && daysUntilExpiry <= reminderDays) || 
                          (daysUntilExpiry < 0 && Math.abs(daysUntilExpiry) <= 30);
      
      // 排除已催单的客户
      const isNotReminded = !order.is_reminded;
      
      return needReminder && isNotReminded;
    });
  }
  
  console.log(`\n✅ 修复后的结果：`);
  console.log(`   需要催单的订单数: ${reminderOrders.length} 个`);
  
  if (reminderOrders.length > 0) {
    console.log('\n📋 催单订单列表:');
    reminderOrders.forEach((order, i) => {
      const expiry = new Date(order.expiry_time);
      const now = new Date();
      const daysUntilExpiry = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));
      
      console.log(`   ${i+1}. ${order.customer_wechat}`);
      console.log(`      - 订单ID: ${order.id}`);
      console.log(`      - 购买时长: ${order.duration}`);
      console.log(`      - 到期时间: ${order.expiry_time?.split('T')[0]}`);
      console.log(`      - 剩余/过期天数: ${daysUntilExpiry > 0 ? `剩余${daysUntilExpiry}天` : `已过期${Math.abs(daysUntilExpiry)}天`}`);
      console.log(`      - 催单状态: ${order.is_reminded ? '已催单' : '未催单'}`);
    });
  }
  
  // 4. 对比客户管理页面的数据
  console.log('\n📊 对比验证:');
  console.log('   客户管理页面显示: 11 个待催单');
  console.log(`   修复后计算结果: ${reminderOrders.length} 个待催单`);
  
  if (reminderOrders.length === 11) {
    console.log('\n✅ 修复成功！数据一致性验证通过！');
  } else {
    console.log(`\n⚠️ 数据不一致，需要进一步检查`);
    console.log('   可能原因:');
    console.log('   1. 有些订单被标记为已催单（is_reminded = true）');
    console.log('   2. 时间计算有偏差');
  }
}

verifyFix().catch(console.error);