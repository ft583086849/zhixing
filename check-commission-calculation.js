require('dotenv').config({ path: './client/.env' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY
);

async function checkCommissionCalculation() {
  console.log('检查佣金计算逻辑');
  console.log('='.repeat(100));
  
  // 获取WML信息
  const { data: wml } = await supabase
    .from('primary_sales')
    .select('*')
    .eq('wechat_name', 'WML792355703')
    .single();
  
  // 获取所有订单
  const { data: allOrders } = await supabase
    .from('orders_optimized')
    .select('*');
  
  // 建立索引
  const ordersBySalesCode = new Map();
  allOrders?.forEach(order => {
    if (order.sales_code) {
      if (!ordersBySalesCode.has(order.sales_code)) {
        ordersBySalesCode.set(order.sales_code, []);
      }
      ordersBySalesCode.get(order.sales_code).push(order);
    }
  });
  
  // 获取直销订单
  const directOrders = ordersBySalesCode.get(wml.sales_code) || [];
  const confirmedStatuses = ['confirmed', 'confirmed_config', 'confirmed_configuration', 'active'];
  
  // 计算直销金额（只计算确认的订单）
  let confirmedAmount = 0;
  console.log('确认的直销订单:');
  directOrders.forEach(order => {
    if (confirmedStatuses.includes(order.status) && order.amount > 0) {
      console.log(`  订单${order.id}: status=${order.status}, amount=$${order.amount}`);
      confirmedAmount += order.amount;
    }
  });
  console.log(`确认的直销金额: $${confirmedAmount}`);
  
  // 获取团队成员
  const { data: teamMembers } = await supabase
    .from('secondary_sales')
    .select('*')
    .eq('primary_sales_id', wml.id);
  
  // 计算团队订单金额
  let secondaryOrdersAmount = 0;
  let secondaryTotalCommission = 0;
  
  console.log('\n团队成员和他们的订单:');
  for (const member of teamMembers || []) {
    const memberOrders = ordersBySalesCode.get(member.sales_code) || [];
    console.log(`  ${member.wechat_name} (佣金率: ${member.commission_rate}%):`);
    
    memberOrders.forEach(order => {
      if (confirmedStatuses.includes(order.status) && order.amount > 0) {
        console.log(`    订单${order.id}: $${order.amount}`);
        secondaryOrdersAmount += order.amount;
        
        // 二级销售的佣金率
        const secRate = member.commission_rate > 1 ? 
          member.commission_rate / 100 : 
          (member.commission_rate || 0.25);
        secondaryTotalCommission += order.amount * secRate;
      }
    });
  }
  console.log(`团队总销售额: $${secondaryOrdersAmount}`);
  console.log(`二级销售总佣金: $${secondaryTotalCommission}`);
  
  // 按照salesCache.js的逻辑计算
  console.log('\n按照salesCache.js逻辑计算:');
  const primaryRate = 0.4;
  const primaryDirectCommission = confirmedAmount * primaryRate;
  const secondaryShareCommission = secondaryOrdersAmount * primaryRate - secondaryTotalCommission;
  const totalCommission = primaryDirectCommission + secondaryShareCommission;
  
  console.log(`直销佣金: $${confirmedAmount} × 40% = $${primaryDirectCommission}`);
  console.log(`团队差价: ($${secondaryOrdersAmount} × 40%) - $${secondaryTotalCommission} = $${secondaryShareCommission}`);
  console.log(`总佣金: $${totalCommission}`);
  
  // 检查是否有订单状态问题
  console.log('\n检查所有订单状态:');
  directOrders.forEach(order => {
    if (!confirmedStatuses.includes(order.status)) {
      console.log(`  订单${order.id}: status=${order.status} (未确认，未计入佣金)`);
    }
  });
}

checkCommissionCalculation();