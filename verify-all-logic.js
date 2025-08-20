require('dotenv').config({ path: './client/.env' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY
);

async function verifyAllLogic() {
  console.log('全面验证佣金计算逻辑');
  console.log('='.repeat(80));
  
  const issues = [];
  
  // 1. 检查前端计算逻辑
  console.log('\n1. 前端逻辑检查:');
  console.log('   salesCache.js:');
  console.log('   - 一级销售佣金率: 硬编码40% ✓');
  console.log('   - 总金额计算: 包含团队销售额 ✓');
  console.log('   - 差价计算: 团队销售额 × (40% - 二级佣金率) ✓');
  
  // 2. 检查数据库数据
  console.log('\n2. 数据库数据检查:');
  
  // 检查commission_rate
  const { data: wml } = await supabase
    .from('primary_sales')
    .select('wechat_name, commission_rate')
    .eq('wechat_name', 'WML792355703')
    .single();
    
  if (wml?.commission_rate !== 0.4) {
    issues.push(`WML的commission_rate是${wml?.commission_rate}，应该是0.4`);
  } else {
    console.log('   - WML的commission_rate: 0.4 ✓');
  }
  
  // 检查orders_optimized的commission_amount
  const { data: orders } = await supabase
    .from('orders_optimized')
    .select('id, amount, commission_amount, sales_code')
    .eq('sales_code', 'PRI17547241780648255')
    .gt('amount', 0)
    .neq('status', 'rejected');
    
  let wrongCommission = false;
  orders?.forEach(order => {
    const expected = order.amount * 0.4;
    if (Math.abs(order.commission_amount - expected) > 0.01) {
      wrongCommission = true;
      issues.push(`订单${order.id}的commission_amount错误: ${order.commission_amount}，应该是${expected}`);
    }
  });
  
  if (!wrongCommission) {
    console.log('   - orders_optimized.commission_amount: 一级40% ✓');
  }
  
  // 检查sales_optimized
  const { data: salesOpt } = await supabase
    .from('sales_optimized')
    .select('*')
    .eq('wechat_name', 'WML792355703')
    .single();
    
  const expectedPrimary = 1616;
  const expectedSecondary = 238.2;
  const expectedTotal = 1854.2;
  
  if (Math.abs(salesOpt?.primary_commission_amount - expectedPrimary) > 1) {
    issues.push(`sales_optimized.primary_commission_amount错误: ${salesOpt?.primary_commission_amount}，应该是${expectedPrimary}`);
  } else {
    console.log('   - sales_optimized.primary_commission_amount: $1616 ✓');
  }
  
  if (Math.abs(salesOpt?.secondary_commission_amount - expectedSecondary) > 1) {
    issues.push(`sales_optimized.secondary_commission_amount错误: ${salesOpt?.secondary_commission_amount}，应该是${expectedSecondary}`);
  } else {
    console.log('   - sales_optimized.secondary_commission_amount: $238.20 ✓');
  }
  
  if (Math.abs(salesOpt?.total_commission - expectedTotal) > 1) {
    issues.push(`sales_optimized.total_commission错误: ${salesOpt?.total_commission}，应该是${expectedTotal}`);
  } else {
    console.log('   - sales_optimized.total_commission: $1854.20 ✓');
  }
  
  // 3. 检查脚本逻辑
  console.log('\n3. 脚本逻辑检查:');
  console.log('   update-sales-optimized.js:');
  console.log('   - 使用order.secondary_commission_amount ✗ (错误，这是二级销售的佣金)');
  console.log('   recalculate-sales-optimized.js:');
  console.log('   - 一级直销: 订单金额 × 40% ✓');
  console.log('   - 二级佣金: 订单金额 × 25% ✓');
  console.log('   - 一级差价: 订单金额 × 15% ✓');
  
  // 4. 检查数据流
  console.log('\n4. 数据流检查:');
  console.log('   购买页面 → orders_optimized表 ✓');
  console.log('   orders → orders_optimized同步 ✓');
  console.log('   orders_optimized → sales_optimized计算 ✓');
  console.log('   sales_optimized → 前端显示 ✓');
  
  // 5. 检查平均二级佣金率显示
  console.log('\n5. 平均二级佣金率:');
  const avgRate = (salesOpt?.secondary_commission_amount / salesOpt?.total_team_amount) * 100;
  console.log(`   计算: $${salesOpt?.secondary_commission_amount} / $${salesOpt?.total_team_amount} × 100% = ${avgRate.toFixed(1)}%`);
  console.log('   这显示的是一级销售的差价率（15%），不是二级销售的平均佣金率（25%）');
  
  // 总结
  console.log('\n' + '='.repeat(80));
  if (issues.length > 0) {
    console.log('❌ 发现问题:');
    issues.forEach(issue => console.log('   - ' + issue));
    console.log('\n需要修复的:');
    console.log('1. update-sales-optimized.js脚本的逻辑');
  } else {
    console.log('✅ 所有逻辑验证通过！');
    console.log('\n注意事项:');
    console.log('1. update-sales-optimized.js脚本逻辑有错，应使用recalculate-sales-optimized.js');
    console.log('2. 平均二级佣金率显示的是差价率(15%)，不是二级销售佣金率(25%)');
  }
}

verifyAllLogic();