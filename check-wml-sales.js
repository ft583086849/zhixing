require('dotenv').config({ path: './client/.env' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY
);

async function checkWMLSalesData() {
  console.log('检查WML792355703的销售数据');
  console.log('='.repeat(80));
  
  // 查找WML792355703的销售ID
  const { data: salesInfo } = await supabase
    .from('secondary_sales')
    .select('id, wechat_name, primary_sales_id')
    .eq('wechat_name', 'WML792355703')
    .single();
  
  if (!salesInfo) {
    console.log('未找到销售WML792355703');
    return;
  }
  
  console.log('销售信息:');
  console.log('二级销售ID:', salesInfo.id);
  console.log('一级销售ID:', salesInfo.primary_sales_id);
  console.log('');
  
  // 查询作为二级销售的订单（直销）
  const { data: directOrders } = await supabase
    .from('orders_optimized')
    .select('id, tradingview_username, amount, actual_payment_amount, duration, created_at')
    .eq('secondary_sales_id', salesInfo.id)
    .order('id');
  
  console.log('直销订单（作为二级销售）:');
  console.log('-'.repeat(80));
  let directTotal = 0;
  directOrders?.forEach(order => {
    console.log(`订单ID: ${order.id}, 用户: ${order.tradingview_username}, 金额: ${order.amount}, 实付: ${order.actual_payment_amount}, 时长: ${order.duration}`);
    directTotal += order.amount;
  });
  console.log(`直销订单数: ${directOrders?.length || 0}个`);
  console.log(`直销总金额: ${directTotal}元`);
  console.log('');
  
  // 查询团队成员的订单（团队销售）
  // 先找出所有以WML792355703为一级销售的二级销售
  const { data: teamMembers } = await supabase
    .from('secondary_sales')
    .select('id, wechat_name')
    .eq('primary_sales_id', salesInfo.id);
  
  console.log('团队成员（以WML792355703为一级销售的二级销售）:');
  teamMembers?.forEach(member => {
    console.log(`- ${member.wechat_name} (ID: ${member.id})`);
  });
  console.log('');
  
  // 查询团队成员的订单
  let teamTotal = 0;
  if (teamMembers && teamMembers.length > 0) {
    const teamMemberIds = teamMembers.map(m => m.id);
    const { data: teamOrders } = await supabase
      .from('orders_optimized')
      .select('id, tradingview_username, amount, actual_payment_amount, duration, secondary_sales_id')
      .in('secondary_sales_id', teamMemberIds)
      .order('id');
    
    console.log('团队订单（团队成员的订单）:');
    console.log('-'.repeat(80));
    teamOrders?.forEach(order => {
      const member = teamMembers.find(m => m.id === order.secondary_sales_id);
      console.log(`订单ID: ${order.id}, 用户: ${order.tradingview_username}, 金额: ${order.amount}, 实付: ${order.actual_payment_amount}, 时长: ${order.duration}, 销售: ${member?.wechat_name}`);
      teamTotal += order.amount;
    });
    console.log(`团队订单数: ${teamOrders?.length || 0}个`);
    console.log(`团队总金额: ${teamTotal}元`);
  }
  
  console.log('');
  console.log('='.repeat(80));
  console.log('汇总:');
  console.log(`直销金额: ${directTotal}元`);
  console.log(`团队金额: ${teamTotal}元`);
  console.log(`总金额（应该是）: ${directTotal + teamTotal}元`);
  console.log('');
  console.log('页面显示:');
  console.log('总金额: 676.00（错误，应该是' + (directTotal + teamTotal) + '）');
  console.log('团队金额: 1,588.00');
  console.log('直销金额: 676');
  console.log('');
  console.log('问题分析:');
  console.log('总金额显示的676只是直销金额，没有加上团队金额');
  console.log('正确的总金额应该是: 直销金额 + 团队金额');
}

checkWMLSalesData();