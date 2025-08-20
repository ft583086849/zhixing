const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://itvmeamoqthfqtkpubdv.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0dm1lYW1vcXRoZnF0a3B1YmR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0ODEyMzUsImV4cCI6MjA3MDA1NzIzNX0.ypBF3lJJTJtSPLEu1zWXqPorS-FDSZzRUy_0ge_Y-r0');

async function check() {
  const { data } = await supabase
    .from('orders_optimized')
    .select('*')
    .gt('amount', 0)
    .order('id');
  
  const problems = [];
  
  data?.forEach(o => {
    const old_val = o.commission_amount || 0;
    const new_val = o.primary_commission_amount || 0;
    
    if (old_val \!= new_val) {
      problems.push({
        id: o.id,
        user: o.tradingview_username,
        amount: o.amount,
        old: old_val,
        new: new_val
      });
    }
  });
  
  if (problems.length > 0) {
    console.log('发现', problems.length, '个不一致的订单：');
    problems.forEach(p => {
      console.log('\n订单', p.id, '-', p.user);
      console.log('  金额:', p.amount);
      console.log('  旧字段:', p.old);
      console.log('  新字段:', p.new);
      if (p.old > 0 && p.new === 0) {
        console.log('  建议: 复制', p.old, '到新字段');
      }
    });
  } else {
    console.log('所有订单字段一致');
  }
  
  console.log('\n总计:', data?.length, '个订单');
  console.log('不一致:', problems.length, '个');
}

check();
