const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://itvmeamoqthfqtkpubdv.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0dm1lYW1vcXRoZnF0a3B1YmR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0ODEyMzUsImV4cCI6MjA3MDA1NzIzNX0.ypBF3lJJTJtSPLEu1zWXqPorS-FDSZzRUy_0ge_Y-r0');

async function finalCheck() {
  console.log('最终检查：订单佣金字段一致性');
  console.log('================================\n');
  
  const { data } = await supabase
    .from('orders_optimized')
    .select('id, tradingview_username, amount, commission_amount, primary_commission_amount, sales_code')
    .gt('amount', 0)
    .order('id');
  
  const problems = [];
  
  data?.forEach(order => {
    const oldField = order.commission_amount || 0;
    const newField = order.primary_commission_amount || 0;
    
    if (oldField !== newField) {
      problems.push({
        id: order.id,
        user: order.tradingview_username,
        salesCode: order.sales_code,
        amount: order.amount,
        oldField: oldField,
        newField: newField
      });
    }
  });
  
  if (problems.length > 0) {
    console.log(`发现 ${problems.length} 个不一致的订单：\n`);
    
    problems.forEach((p, i) => {
      console.log(`${i+1}. 订单 ${p.id} (${p.user})`);
      console.log(`   销售代码: ${p.salesCode}`);
      console.log(`   订单金额: ¥${p.amount}`);
      console.log(`   commission_amount: ${p.oldField}`);
      console.log(`   primary_commission_amount: ${p.newField}`);
      
      if (p.oldField > 0 && p.newField === 0) {
        console.log(`   ➡️ 建议: 将 ${p.oldField} 复制到 primary_commission_amount`);
      } else if (p.oldField === 0 && p.newField > 0) {
        console.log(`   ➡️ 建议: 将 ${p.newField} 复制到 commission_amount`);
      } else {
        console.log(`   ⚠️ 需要人工检查`);
      }
      console.log('');
    });
    
    console.log('需要修复的订单ID列表:', problems.map(p => p.id).join(', '));
  } else {
    console.log('✅ 所有订单的佣金字段都一致！');
  }
  
  const total = data?.length || 0;
  const correct = total - problems.length;
  
  console.log('\n================================');
  console.log('统计汇总');
  console.log('================================');
  console.log(`总订单数: ${total}`);
  console.log(`字段一致: ${correct} (${Math.round(correct/total*100)}%)`);
  console.log(`需要修复: ${problems.length} (${Math.round(problems.length/total*100)}%)`);
}

finalCheck();