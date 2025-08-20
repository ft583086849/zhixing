require('dotenv').config({ path: './client/.env' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY
);

async function getAllWMLOrders() {
  console.log('查询WML792355703所有相关订单（金额>0）');
  console.log('='.repeat(100));
  
  // 1. 获取WML的信息
  const { data: primarySale } = await supabase
    .from('primary_sales')
    .select('*')
    .eq('wechat_name', 'WML792355703')
    .single();
  
  console.log('WML792355703信息:');
  console.log(`  一级销售ID: ${primarySale.id}`);
  console.log(`  销售代码: ${primarySale.sales_code}`);
  console.log('');
  
  // 2. 查询WML的直销订单（primary_sales_id=4且secondary_sales_id为空）
  const { data: directOrders } = await supabase
    .from('orders_optimized')
    .select('*')
    .eq('primary_sales_id', primarySale.id)
    .is('secondary_sales_id', null)
    .gt('amount', 0)  // 只要金额大于0的
    .order('created_at', { ascending: false });
  
  console.log('【一、WML直销订单】（无二级销售参与）');
  console.log('-'.repeat(100));
  console.log('订单ID | 用户名 | 金额 | 状态 | 创建时间 | 订单号');
  console.log('-'.repeat(100));
  
  let directTotal = 0;
  let directConfirmed = 0;
  const confirmedStatuses = ['confirmed', 'confirmed_config', 'confirmed_configuration', 'active'];
  
  directOrders?.forEach(order => {
    console.log(`${order.id} | ${order.tradingview_username} | $${order.amount} | ${order.status} | ${new Date(order.created_at).toLocaleDateString('zh-CN')} | ${order.order_number}`);
    directTotal += order.amount;
    if (confirmedStatuses.includes(order.status)) {
      directConfirmed += order.amount;
    }
  });
  
  console.log('-'.repeat(100));
  console.log(`直销订单数: ${directOrders?.length || 0}个`);
  console.log(`直销总金额: $${directTotal}`);
  console.log(`直销确认金额: $${directConfirmed}`);
  console.log('');
  
  // 3. 获取WML的团队成员
  const { data: teamMembers } = await supabase
    .from('secondary_sales')
    .select('*')
    .eq('primary_sales_id', primarySale.id);
  
  console.log('【二、团队成员列表】');
  console.log('-'.repeat(100));
  teamMembers?.forEach(member => {
    console.log(`ID: ${member.id} | 名称: ${member.wechat_name} | 佣金率: ${member.commission_rate || 0.25}`);
  });
  console.log(`团队成员总数: ${teamMembers?.length || 0}个`);
  console.log('');
  
  // 4. 查询团队成员的所有订单（金额>0）
  console.log('【三、团队成员的订单】（二级销售的订单）');
  console.log('-'.repeat(100));
  
  let teamTotal = 0;
  let teamConfirmed = 0;
  let allTeamOrders = [];
  
  for (const member of teamMembers || []) {
    const { data: memberOrders } = await supabase
      .from('orders_optimized')
      .select('*')
      .eq('secondary_sales_id', member.id)
      .gt('amount', 0)  // 只要金额大于0的
      .order('created_at', { ascending: false });
    
    if (memberOrders && memberOrders.length > 0) {
      console.log(`\n${member.wechat_name}（ID:${member.id}）的订单:`);
      console.log('订单ID | 用户名 | 金额 | 状态 | 创建时间 | 一级销售ID');
      memberOrders.forEach(order => {
        console.log(`  ${order.id} | ${order.tradingview_username} | $${order.amount} | ${order.status} | ${new Date(order.created_at).toLocaleDateString('zh-CN')} | ${order.primary_sales_id}`);
        teamTotal += order.amount;
        if (confirmedStatuses.includes(order.status)) {
          teamConfirmed += order.amount;
        }
        allTeamOrders.push({...order, salesName: member.wechat_name});
      });
    }
  }
  
  if (allTeamOrders.length === 0) {
    console.log('（无金额大于0的团队订单）');
  }
  
  console.log('-'.repeat(100));
  console.log(`团队订单数: ${allTeamOrders.length}个`);
  console.log(`团队总金额: $${teamTotal}`);
  console.log(`团队确认金额: $${teamConfirmed}`);
  console.log('');
  
  // 5. 额外检查：是否有primary_sales_id=4但有secondary_sales_id的订单
  const { data: mixedOrders } = await supabase
    .from('orders_optimized')
    .select('*')
    .eq('primary_sales_id', primarySale.id)
    .not('secondary_sales_id', 'is', null)
    .gt('amount', 0)
    .order('created_at', { ascending: false });
  
  if (mixedOrders && mixedOrders.length > 0) {
    console.log('【四、混合订单】（一级是WML，但有二级销售参与）');
    console.log('-'.repeat(100));
    console.log('订单ID | 用户名 | 金额 | 状态 | 二级销售ID | 创建时间');
    
    let mixedTotal = 0;
    mixedOrders.forEach(order => {
      console.log(`${order.id} | ${order.tradingview_username} | $${order.amount} | ${order.status} | 二级ID:${order.secondary_sales_id} | ${new Date(order.created_at).toLocaleDateString('zh-CN')}`);
      mixedTotal += order.amount;
    });
    console.log(`混合订单总金额: $${mixedTotal}`);
    console.log('');
  }
  
  // 6. 汇总
  console.log('【五、汇总统计】');
  console.log('='.repeat(100));
  console.log(`直销确认金额: $${directConfirmed}`);
  console.log(`团队确认金额: $${teamConfirmed}`);
  console.log(`总确认金额: $${directConfirmed + teamConfirmed}`);
  console.log('');
  console.log('【佣金计算】');
  console.log(`直销佣金: $${directConfirmed} × 40% = $${directConfirmed * 0.4}`);
  console.log(`团队差价: $${teamConfirmed} × (40% - 25%) = $${teamConfirmed * 0.15}`);
  console.log(`总佣金: $${directConfirmed * 0.4 + teamConfirmed * 0.15}`);
  console.log('');
  console.log('【页面显示对比】');
  console.log('页面显示: 总金额$676, 直销$676, 团队$1588, 佣金$1001.40');
  console.log(`实际应该: 总金额$${directConfirmed + teamConfirmed}, 直销$${directConfirmed}, 团队$${teamConfirmed}, 佣金$${(directConfirmed * 0.4 + teamConfirmed * 0.15).toFixed(2)}`);
}

getAllWMLOrders();