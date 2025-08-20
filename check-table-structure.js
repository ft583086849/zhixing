require('dotenv').config({ path: './client/.env' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY
);

async function checkTableStructure() {
  console.log('检查orders_optimized表的字段结构');
  console.log('='.repeat(50));
  
  // 获取一条记录看字段
  const { data: sample } = await supabase
    .from('orders_optimized')
    .select('*')
    .limit(1)
    .single();
    
  console.log('\norders_optimized表的所有字段:');
  if (sample) {
    Object.keys(sample).forEach(key => {
      console.log(`  ${key}: ${sample[key]}`);
    });
  }
  
  console.log('\n检查关键字段:');
  console.log('  commission_amount字段:', sample?.commission_amount);
  console.log('  secondary_commission_amount字段:', sample?.secondary_commission_amount);
  console.log('  primary_commission_amount字段:', sample?.primary_commission_amount);
  
  // 查看fl261247的订单
  const { data: flOrder } = await supabase
    .from('orders_optimized')
    .select('*')
    .eq('id', 3)
    .single();
    
  console.log('\nfl261247的订单（ID=3）:');
  console.log('  sales_code:', flOrder?.sales_code);
  console.log('  amount:', flOrder?.amount);
  console.log('  commission_amount:', flOrder?.commission_amount);
  console.log('  secondary_commission_amount:', flOrder?.secondary_commission_amount);
  
  console.log('\n分析:');
  console.log('update-sales-optimized.js第137行使用了order.secondary_commission_amount');
  console.log('这个字段的值是:', flOrder?.secondary_commission_amount);
  if (flOrder?.secondary_commission_amount) {
    console.log('脚本把这个值加到了WML的secondary_commission_amount上，所以是$397');
    console.log('但实际上应该计算差价：$1588 × 15% = $238.20');
  }
}

checkTableStructure();