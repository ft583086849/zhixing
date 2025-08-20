const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://itvmeamoqthfqtkpubdv.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0dm1lYW1vcXRoZnF0a3B1YmR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0ODEyMzUsImV4cCI6MjA3MDA1NzIzNX0.ypBF3lJJTJtSPLEu1zWXqPorS-FDSZzRUy_0ge_Y-r0');

async function check() {
  const { data: all } = await supabase
    .from('orders_optimized')
    .select('id, tradingview_username, amount, commission_amount, primary_commission_amount, created_at')
    .gt('amount', 0)
    .order('id');
  
  const inconsistent = all?.filter(o => {
    const old = o.commission_amount || 0;
    const new_field = o.primary_commission_amount || 0;
    return old \!== new_field;
  });
  
  console.log('===== 检查结果 =====\n');
  
  if (inconsistent && inconsistent.length > 0) {
    console.log('发现', inconsistent.length, '个字段不一致的订单：\n');
    
    inconsistent.forEach(order => {
      console.log('订单ID:', order.id);
      console.log('  用户:', order.tradingview_username);
      console.log('  创建时间:', new Date(order.created_at).toLocaleDateString());
      console.log('  订单金额:', order.amount);
      console.log('  commission_amount(旧):', order.commission_amount || 0);
      console.log('  primary_commission_amount(新):', order.primary_commission_amount || 0);
      
      if (order.commission_amount > 0 && order.primary_commission_amount === 0) {
        console.log('  建议: 将', order.commission_amount, '复制到新字段');
      } else if (order.commission_amount === 0 && order.primary_commission_amount > 0) {
        console.log('  建议: 将', order.primary_commission_amount, '复制到旧字段');
      }
      console.log('');
    });
  } else {
    console.log('✅ 所有订单的佣金字段都一致');
  }
  
  const total = all?.length || 0;
  const correct = total - (inconsistent?.length || 0);
  
  console.log('===== 统计 =====');
  console.log('总订单:', total);
  console.log('一致:', correct);
  console.log('不一致:', inconsistent?.length || 0);
  console.log('一致率:', Math.round(correct/total*100) + '%');
}

check();
