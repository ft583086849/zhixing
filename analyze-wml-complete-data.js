require('dotenv').config({ path: './client/.env' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY
);

async function analyzeWMLCompleteData() {
  console.log('完整分析WML792355703的销售数据');
  console.log('='.repeat(100));
  
  // 1. 获取WML的信息
  const { data: primarySale } = await supabase
    .from('primary_sales')
    .select('*')
    .eq('wechat_name', 'WML792355703')
    .single();
  
  console.log('一级销售信息:');
  console.log(`  ID: ${primarySale.id}`);
  console.log(`  名称: ${primarySale.wechat_name}`);
  console.log(`  销售代码: ${primarySale.sales_code}`);
  console.log('');
  
  // 2. 查询WML作为一级销售的直接订单（无二级销售）
  const { data: directOrders } = await supabase
    .from('orders_optimized')
    .select('*')
    .eq('primary_sales_id', primarySale.id)
    .is('secondary_sales_id', null)
    .order('created_at', { ascending: false });
  
  console.log('【一、直销订单】（WML直接销售，无二级销售）');
  console.log('-'.repeat(100));
  
  const confirmedStatuses = ['confirmed', 'confirmed_config', 'confirmed_configuration', 'active'];
  let directTotalAmount = 0;
  let directConfirmedAmount = 0;
  let directOrderCount = 0;
  
  console.log('订单ID | 用户 | 金额 | 状态 | 创建时间 | 订单号');
  directOrders?.forEach(order => {
    if (order.amount > 0 || confirmedStatuses.includes(order.status)) {
      console.log(`${order.id} | ${order.tradingview_username} | $${order.amount} | ${order.status} | ${new Date(order.created_at).toLocaleDateString('zh-CN')} | ${order.order_number}`);
      
      directTotalAmount += order.amount;
      if (confirmedStatuses.includes(order.status)) {
        directConfirmedAmount += order.amount;
        directOrderCount++;
      }
    }
  });
  
  console.log(`\n直销统计:`);
  console.log(`  总订单数: ${directOrders?.length || 0}个`);
  console.log(`  确认订单数: ${directOrderCount}个`);
  console.log(`  总金额: $${directTotalAmount}`);
  console.log(`  确认金额: $${directConfirmedAmount}`);
  console.log('');
  
  // 3. 获取团队成员
  const { data: teamMembers } = await supabase
    .from('secondary_sales')
    .select('*')
    .eq('primary_sales_id', primarySale.id);
  
  console.log('【二、团队成员】');
  console.log('-'.repeat(100));
  teamMembers?.forEach(member => {
    console.log(`${member.id} | ${member.wechat_name} | 佣金率: ${member.commission_rate || 0.25}`);
  });
  console.log(`团队成员总数: ${teamMembers?.length || 0}个`);
  console.log('');
  
  // 4. 查询团队成员的订单
  console.log('【三、团队订单】（通过二级销售产生）');
  console.log('-'.repeat(100));
  
  let teamTotalAmount = 0;
  let teamConfirmedAmount = 0;
  let teamOrderCount = 0;
  
  for (const member of teamMembers || []) {
    const { data: memberOrders } = await supabase
      .from('orders_optimized')
      .select('*')
      .eq('secondary_sales_id', member.id)
      .order('created_at', { ascending: false });
    
    if (memberOrders && memberOrders.length > 0) {
      console.log(`\n${member.wechat_name}的订单:`);
      memberOrders.forEach(order => {
        if (order.amount > 0 || confirmedStatuses.includes(order.status)) {
          console.log(`  订单${order.id} | ${order.tradingview_username} | $${order.amount} | ${order.status} | ${new Date(order.created_at).toLocaleDateString('zh-CN')}`);
          
          teamTotalAmount += order.amount;
          if (confirmedStatuses.includes(order.status)) {
            teamConfirmedAmount += order.amount;
            teamOrderCount++;
          }
        }
      });
    }
  }
  
  console.log(`\n团队统计:`);
  console.log(`  确认订单数: ${teamOrderCount}个`);
  console.log(`  总金额: $${teamTotalAmount}`);
  console.log(`  确认金额: $${teamConfirmedAmount}`);
  console.log('');
  
  // 5. 计算佣金
  console.log('【四、佣金计算】');
  console.log('-'.repeat(100));
  
  // 直销佣金
  const directCommissionRate = 0.4;
  const directCommission = directConfirmedAmount * directCommissionRate;
  console.log('直销佣金:');
  console.log(`  ${directConfirmedAmount} × ${directCommissionRate} = $${directCommission}`);
  
  // 团队佣金（差价）
  const primaryRateForTeam = 0.4;
  const secondaryRate = 0.25; // 假设都是25%
  const teamCommissionDiff = teamConfirmedAmount * (primaryRateForTeam - secondaryRate);
  console.log('\n团队佣金（差价）:');
  console.log(`  ${teamConfirmedAmount} × (${primaryRateForTeam} - ${secondaryRate}) = ${teamConfirmedAmount} × 0.15 = $${teamCommissionDiff}`);
  
  const totalCommission = directCommission + teamCommissionDiff;
  console.log('\n总佣金:');
  console.log(`  ${directCommission} + ${teamCommissionDiff} = $${totalCommission}`);
  console.log('');
  
  // 6. 对比页面显示
  console.log('【五、页面显示 vs 实际计算】');
  console.log('-'.repeat(100));
  console.log('页面显示:');
  console.log('  总金额: $676.00');
  console.log('  直销金额: $676.00');
  console.log('  团队金额: $1,588.00');
  console.log('  直销佣金: $1,001.40');
  console.log('');
  console.log('实际计算:');
  console.log(`  总金额应该是: $${directConfirmedAmount + teamConfirmedAmount} (直销${directConfirmedAmount} + 团队${teamConfirmedAmount})`);
  console.log(`  直销金额应该是: $${directConfirmedAmount}`);
  console.log(`  团队金额应该是: $${teamConfirmedAmount}`);
  console.log(`  总佣金应该是: $${Math.round(totalCommission * 100) / 100}`);
  console.log('');
  
  // 7. 问题分析
  console.log('【六、问题分析】');
  console.log('-'.repeat(100));
  console.log('1. 总金额问题:');
  console.log('   页面显示$676，只显示了直销金额，没有加上团队金额');
  console.log('   应该修改为: 直销金额 + 团队金额');
  console.log('');
  console.log('2. 直销金额问题:');
  console.log(`   页面显示$676，实际计算$${directConfirmedAmount}`);
  if (directConfirmedAmount !== 676) {
    console.log('   可能原因: 某些订单状态判断有误或时间过滤条件不同');
  }
  console.log('');
  console.log('3. 佣金计算问题:');
  console.log('   页面显示$1,001.40，实际应该是$' + Math.round(totalCommission * 100) / 100);
  console.log('   差异: $' + (1001.40 - Math.round(totalCommission * 100) / 100));
  console.log('   可能原因: 佣金计算逻辑有误，可能错误地包含了其他金额');
}

analyzeWMLCompleteData();