require('dotenv').config({ path: './client/.env' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY
);

async function traceCommissionCalculation() {
  console.log('追踪佣金计算的完整过程');
  console.log('='.repeat(80));
  
  // 获取WML的销售信息
  const { data: primarySale } = await supabase
    .from('primary_sales')
    .select('*')
    .eq('wechat_name', 'WML792355703')
    .single();
  
  // 获取所有订单
  const { data: allOrders } = await supabase
    .from('orders_optimized')
    .select('*');
  
  // 建立ordersBySalesCode索引
  const ordersBySalesCode = new Map();
  allOrders?.forEach(order => {
    if (order.sales_code) {
      if (!ordersBySalesCode.has(order.sales_code)) {
        ordersBySalesCode.set(order.sales_code, []);
      }
      ordersBySalesCode.get(order.sales_code).push(order);
    }
  });
  
  // 获取directOrders
  const directOrders = ordersBySalesCode.get(primarySale.sales_code) || [];
  const confirmedStatuses = ['confirmed', 'confirmed_config', 'confirmed_configuration', 'active'];
  
  // 模拟salesCache.js第167-175行：计算confirmedAmount
  let confirmedAmount = 0;
  directOrders.forEach(order => {
    if (confirmedStatuses.includes(order.status)) {
      const amount = parseFloat(order.actual_payment_amount || order.amount || 0);
      const amountUSD = order.payment_method === 'alipay' ? amount / 7.15 : amount;
      confirmedAmount += amountUSD;
    }
  });
  
  console.log('步骤1: 计算直销确认金额（confirmedAmount）');
  console.log(`  confirmedAmount = ${confirmedAmount}元`);
  console.log('');
  
  // 获取团队成员
  const { data: managedSecondaries } = await supabase
    .from('secondary_sales')
    .select('*')
    .eq('primary_sales_id', primarySale.id);
  
  console.log('步骤2: 获取团队成员');
  console.log(`  团队成员数: ${managedSecondaries?.length || 0}个`);
  
  // 模拟salesCache.js第181-195行：计算团队相关数据
  let secondaryOrdersAmount = 0;
  let secondaryTotalCommission = 0;
  
  console.log('\n步骤3: 计算团队订单金额');
  managedSecondaries?.forEach(secondary => {
    const secOrders = (ordersBySalesCode.get(secondary.sales_code) || [])
      .filter(o => confirmedStatuses.includes(o.status));
    
    let secAmount = 0;
    secOrders.forEach(order => {
      const amount = parseFloat(order.actual_payment_amount || order.amount || 0);
      const amountUSD = order.payment_method === 'alipay' ? amount / 7.15 : amount;
      secAmount += amountUSD;
      secondaryOrdersAmount += amountUSD;
      
      const secRate = secondary.commission_rate > 1 ? 
        secondary.commission_rate / 100 : 
        (secondary.commission_rate || 0.25);
      secondaryTotalCommission += amountUSD * secRate;
    });
    
    if (secAmount > 0) {
      console.log(`  ${secondary.wechat_name}: ${secAmount}元`);
    }
  });
  
  console.log(`  secondaryOrdersAmount总计 = ${secondaryOrdersAmount}元`);
  console.log(`  secondaryTotalCommission = ${secondaryTotalCommission}元`);
  console.log('');
  
  // 模拟salesCache.js第198-201行：计算佣金
  const primaryRate = 0.4;
  console.log('步骤4: 计算佣金');
  console.log(`  primaryRate = ${primaryRate} (40%)`);
  
  const primaryDirectCommission = confirmedAmount * primaryRate;
  console.log(`  primaryDirectCommission = ${confirmedAmount} × ${primaryRate} = ${primaryDirectCommission}元`);
  
  const secondaryShareCommission = secondaryOrdersAmount * primaryRate - secondaryTotalCommission;
  console.log(`  secondaryShareCommission = ${secondaryOrdersAmount} × ${primaryRate} - ${secondaryTotalCommission}`);
  console.log(`                           = ${secondaryOrdersAmount * primaryRate} - ${secondaryTotalCommission}`);
  console.log(`                           = ${secondaryShareCommission}元`);
  
  const totalCommission = primaryDirectCommission + secondaryShareCommission;
  console.log(`  totalCommission = ${primaryDirectCommission} + ${secondaryShareCommission} = ${totalCommission}元`);
  
  console.log('\n' + '='.repeat(80));
  console.log('结果对比:');
  console.log(`  计算出的总佣金: ${Math.round(totalCommission * 100) / 100}元`);
  console.log(`  页面显示的佣金: 1001.40元`);
  console.log(`  差异: ${1001.40 - Math.round(totalCommission * 100) / 100}元`);
  
  // 反推页面的佣金是怎么算出来的
  console.log('\n反推分析:');
  console.log(`  1001.40 ÷ 0.4 = ${1001.40 / 0.4}元（佣金对应的基数）`);
  console.log(`  如果基数是 ${confirmedAmount} + ${secondaryOrdersAmount} = ${confirmedAmount + secondaryOrdersAmount}元`);
  console.log(`  那么佣金应该是 ${confirmedAmount + secondaryOrdersAmount} × 0.4 = ${(confirmedAmount + secondaryOrdersAmount) * 0.4}元`);
}

traceCommissionCalculation();