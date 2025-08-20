const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://itvmeamoqthfqtkpubdv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0dm1lYW1vcXRoZnF0a3B1YmR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0ODEyMzUsImV4cCI6MjA3MDA1NzIzNX0.ypBF3lJJTJtSPLEu1zWXqPorS-FDSZzRUy_0ge_Y-r0'
);

async function checkReminderLogic() {
  console.log('🔍 检查 Liangjunhao889 的催单逻辑问题');
  console.log('=' .repeat(60));
  
  // 1. 查找销售信息
  const { data: sales } = await supabase
    .from('sales_optimized')
    .select('*')
    .eq('wechat_name', 'Liangjunhao889')
    .single();
    
  if (!sales) {
    console.log('❌ 未找到销售: Liangjunhao889');
    return;
  }
  
  console.log('✅ 找到销售:', {
    微信号: sales.wechat_name,
    销售代码: sales.sales_code,
    销售类型: sales.sales_type
  });
  
  // 2. 查询该销售的所有活跃订单
  const { data: activeOrders } = await supabase
    .from('orders_optimized')
    .select('*')
    .eq('sales_code', sales.sales_code)
    .in('status', ['confirmed_config', 'active']);
    
  console.log('\n📋 活跃订单数量:', activeOrders?.length || 0);
  
  if (activeOrders && activeOrders.length > 0) {
    console.log('\n订单详情:');
    
    // 计算到期时间的函数
    const calculateExpiryTime = (order) => {
      if (!order.effective_time && !order.created_at) return null;
      
      const startDate = new Date(order.effective_time || order.created_at);
      const expiryDate = new Date(startDate);
      
      // 根据购买时长计算到期时间
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
    };
    
    let reminderCount = 0;
    activeOrders.forEach((order, i) => {
      // 计算到期时间
      const calculatedExpiry = calculateExpiryTime(order);
      const expiryTime = order.expiry_time || calculatedExpiry;
      
      // 计算催单状态
      let needReminder = false;
      let daysUntilExpiry = null;
      
      if (expiryTime) {
        const now = new Date();
        const expiry = new Date(expiryTime);
        const diffTime = expiry - now;
        daysUntilExpiry = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        const hasAmount = (order.total_amount || order.amount || 0) > 0;
        const reminderDays = hasAmount ? 7 : 3;
        
        needReminder = (daysUntilExpiry >= 0 && daysUntilExpiry <= reminderDays) || 
                      (daysUntilExpiry < 0 && Math.abs(daysUntilExpiry) <= 30);
      }
      
      // 检查是否已催单
      const isNotReminded = !order.is_reminded;
      const shouldShowInReminder = needReminder && isNotReminded;
      
      if (shouldShowInReminder) {
        reminderCount++;
      }
      
      console.log(`  订单${i+1}:`);
      console.log('    - ID:', order.id);
      console.log('    - 客户:', order.customer_wechat);
      console.log('    - 金额:', order.amount);
      console.log('    - 时长:', order.duration);
      console.log('    - 状态:', order.status);
      console.log('    - is_reminded:', order.is_reminded, isNotReminded ? '(未催单)' : '(已催单)');
      console.log('    - 创建时间:', order.created_at);
      console.log('    - 生效时间:', order.effective_time || '无');
      console.log('    - 到期时间(数据库):', order.expiry_time || '无');
      console.log('    - 到期时间(计算):', calculatedExpiry || '无法计算');
      console.log('    - 剩余天数:', daysUntilExpiry);
      console.log('    - 需要催单:', needReminder ? '是' : '否');
      console.log('    - 显示在催单列表:', shouldShowInReminder ? '✅ 是' : '❌ 否');
      console.log('');
    });
    
    console.log(`\n📊 统计结果: ${reminderCount} 个订单应该显示在催单列表中`);
  }
  
  // 3. 查看客户管理页面是如何查询的
  console.log('\n🔍 检查客户管理页面的数据...');
  const { data: customers } = await supabase
    .from('customers_optimized')
    .select('*')
    .eq('sales_wechat_name', 'Liangjunhao889');
    
  console.log('客户管理页面查询到的客户数量:', customers?.length || 0);
  
  if (customers && customers.length > 0) {
    const needReminder = customers.filter(c => {
      if (!c.expiry_time) return false;
      const now = new Date();
      const expiry = new Date(c.expiry_time);
      const daysUntilExpiry = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));
      const hasAmount = (c.total_amount || c.amount || 0) > 0;
      const reminderDays = hasAmount ? 7 : 3;
      
      const isActiveOrder = c.status === 'confirmed_config' || c.status === 'active';
      
      return isActiveOrder && (
        (daysUntilExpiry >= 0 && daysUntilExpiry <= reminderDays) || 
        (daysUntilExpiry < 0 && Math.abs(daysUntilExpiry) <= 30)
      );
    });
    
    console.log('\n客户管理页面需要催单的客户数:', needReminder.length);
    needReminder.forEach(c => {
      const expiry = new Date(c.expiry_time);
      const now = new Date();
      const daysUntilExpiry = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));
      console.log('  -', c.customer_wechat, 
        '| 到期时间:', c.expiry_time?.split('T')[0], 
        '| 剩余天数:', daysUntilExpiry,
        '| 催单状态:', c.is_reminded ? '已催单' : '未催单',
        '| 订单状态:', c.status);
    });
  }
  
  console.log('\n❓ 可能的问题:');
  console.log('1. orders_optimized 表的 expiry_time 字段可能为空');
  console.log('2. 需要根据 effective_time 或 created_at 计算到期时间');
  console.log('3. is_reminded 字段的值可能影响显示');
  console.log('4. 客户管理页面使用 customers_optimized 表，销售对账页面使用 orders_optimized 表');
}

checkReminderLogic().catch(console.error);