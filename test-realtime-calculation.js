require('dotenv').config({ path: './client/.env' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY
);

// 导入API
const { AdminAPI } = require('./client/src/services/api');

async function testRealtimeCalculation() {
  console.log('测试佣金率修改的实时计算功能');
  console.log('='.repeat(50));
  
  // 测试修改fl261247的佣金率
  const { data: fl } = await supabase
    .from('sales_optimized')
    .select('*')
    .eq('wechat_name', 'fl261247')
    .single();
    
  console.log('修改前:');
  console.log(`  fl261247佣金率: ${(fl.commission_rate * 100).toFixed(1)}%`);
  console.log(`  fl261247佣金金额: $${fl.primary_commission_amount}`);
  
  // 获取WML的数据
  const { data: wmlBefore } = await supabase
    .from('sales_optimized')
    .select('*')
    .eq('wechat_name', 'WML792355703')
    .single();
    
  console.log(`  WML团队差价: $${wmlBefore.secondary_commission_amount}`);
  console.log(`  WML总佣金: $${wmlBefore.total_commission}`);
  
  // 修改fl261247的佣金率为30%
  console.log('\n将fl261247的佣金率改为30%...');
  const result = await AdminAPI.updateSalesCommission(fl.id, 0.30);
  
  if (result.success) {
    console.log('✓ 修改成功');
    
    // 等待1秒让数据更新
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // 获取修改后的数据
    const { data: flAfter } = await supabase
      .from('sales_optimized')
      .select('*')
      .eq('wechat_name', 'fl261247')
      .single();
      
    const { data: wmlAfter } = await supabase
      .from('sales_optimized')
      .select('*')
      .eq('wechat_name', 'WML792355703')
      .single();
      
    console.log('\n修改后:');
    console.log(`  fl261247佣金率: ${(flAfter.commission_rate * 100).toFixed(1)}%`);
    console.log(`  fl261247佣金金额: $${flAfter.primary_commission_amount} (应该是$1588 × 30% = $476.40)`);
    console.log(`  WML团队差价: $${wmlAfter.secondary_commission_amount} (应该是$1588 × (40%-30%) = $158.80)`);
    console.log(`  WML总佣金: $${wmlAfter.total_commission} (应该是$1616 + $158.80 = $1774.80)`);
    
    // 恢复原值
    console.log('\n恢复为25%...');
    await AdminAPI.updateSalesCommission(fl.id, 0.25);
    console.log('✓ 已恢复');
  } else {
    console.error('修改失败:', result.message);
  }
}

// 因为AdminAPI需要在浏览器环境运行，这个测试脚本可能无法直接运行
// 实际测试需要在浏览器中通过界面操作
console.log('注意：实际测试请在浏览器中操作');
console.log('1. 访问 http://localhost:3000/admin/sales-test');
console.log('2. 找到fl261247，点击"编辑佣金"');
console.log('3. 将佣金率从25%改为30%');
console.log('4. 保存后查看WML的团队差价是否自动更新');