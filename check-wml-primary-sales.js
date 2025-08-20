require('dotenv').config({ path: './client/.env' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY
);

async function checkWMLPrimarySalesData() {
  console.log('检查WML792355703（一级销售）的销售数据');
  console.log('='.repeat(80));
  
  // 查找WML792355703的一级销售ID
  const { data: primarySalesInfo } = await supabase
    .from('primary_sales')
    .select('id, wechat_name')
    .eq('wechat_name', 'WML792355703')
    .single();
  
  if (!primarySalesInfo) {
    console.log('未找到一级销售WML792355703');
    return;
  }
  
  console.log('一级销售信息:');
  console.log('ID:', primarySalesInfo.id);
  console.log('名称:', primarySalesInfo.wechat_name);
  console.log('');
  
  // 查询作为一级销售的直接订单
  const { data: directOrders } = await supabase
    .from('orders_optimized')
    .select('id, tradingview_username, amount, actual_payment_amount, duration, created_at, secondary_sales_id')
    .eq('primary_sales_id', primarySalesInfo.id)
    .is('secondary_sales_id', null)  // 只有一级销售，没有二级销售
    .order('id');
  
  console.log('直销订单（只有一级销售，无二级销售）:');
  console.log('-'.repeat(80));
  let directTotal = 0;
  directOrders?.forEach(order => {
    console.log(`订单ID: ${order.id}, 用户: ${order.tradingview_username}, 金额: ${order.amount}, 实付: ${order.actual_payment_amount}, 时长: ${order.duration}`);
    directTotal += order.amount;
  });
  console.log(`直销订单数: ${directOrders?.length || 0}个`);
  console.log(`直销总金额: ${directTotal}元`);
  console.log('');
  
  // 查询团队成员（以WML792355703为一级销售的二级销售）
  const { data: teamMembers } = await supabase
    .from('secondary_sales')
    .select('id, wechat_name')
    .eq('primary_sales_id', primarySalesInfo.id);
  
  console.log('团队成员（二级销售）:');
  teamMembers?.forEach(member => {
    console.log(`- ${member.wechat_name} (ID: ${member.id})`);
  });
  console.log(`团队成员数: ${teamMembers?.length || 0}个`);
  console.log('');
  
  // 查询团队成员的订单
  let teamTotal = 0;
  let teamOrderDetails = [];
  if (teamMembers && teamMembers.length > 0) {
    const teamMemberIds = teamMembers.map(m => m.id);
    const { data: teamOrders } = await supabase
      .from('orders_optimized')
      .select('id, tradingview_username, amount, actual_payment_amount, duration, secondary_sales_id')
      .in('secondary_sales_id', teamMemberIds)
      .order('id');
    
    console.log('团队订单（通过二级销售产生）:');
    console.log('-'.repeat(80));
    teamOrders?.forEach(order => {
      const member = teamMembers.find(m => m.id === order.secondary_sales_id);
      console.log(`订单ID: ${order.id}, 用户: ${order.tradingview_username}, 金额: ${order.amount}, 实付: ${order.actual_payment_amount}, 时长: ${order.duration}, 二级销售: ${member?.wechat_name}`);
      teamTotal += order.amount;
      teamOrderDetails.push({...order, salesName: member?.wechat_name});
    });
    console.log(`团队订单数: ${teamOrders?.length || 0}个`);
    console.log(`团队总金额: ${teamTotal}元`);
  }
  
  // 查询所有关联订单（primary_sales_id = WML的所有订单）
  const { data: allRelatedOrders } = await supabase
    .from('orders_optimized')
    .select('id, amount, secondary_sales_id')
    .eq('primary_sales_id', primarySalesInfo.id);
  
  let allTotal = 0;
  allRelatedOrders?.forEach(order => {
    allTotal += order.amount;
  });
  
  console.log('');
  console.log('='.repeat(80));
  console.log('汇总:');
  console.log(`直销金额（无二级销售）: ${directTotal}元`);
  console.log(`团队金额（通过二级销售）: ${teamTotal}元`);
  console.log(`所有关联订单总金额: ${allTotal}元`);
  console.log('');
  console.log('页面显示的值:');
  console.log('总金额: 676.00');
  console.log('团队金额: 1,588.00');
  console.log('直销金额: 676.00');
  console.log('');
  console.log('问题分析:');
  console.log('1. 总金额应该 = 直销金额 + 团队金额');
  console.log(`2. 正确的总金额应该是: ${directTotal} + ${teamTotal} = ${directTotal + teamTotal}元`);
  console.log('3. 现在页面显示的总金额676只包含了直销金额，没有加上团队金额');
}

checkWMLPrimarySalesData();