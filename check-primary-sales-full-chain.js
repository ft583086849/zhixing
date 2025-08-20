// 全链路检查一级销售对账数据问题
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: 'client/.env.local' });

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY
);

async function checkFullDataChain() {
  console.log('🔍 全链路检查一级销售对账数据流\n');
  console.log('=' .repeat(60));
  
  // 测试销售代码 - 请根据实际情况修改
  const testSalesCode = 'PRI17547241780648255';
  
  console.log(`📊 测试销售代码: ${testSalesCode}\n`);
  
  // 1. 检查一级销售数据
  console.log('1️⃣ 检查sales_optimized表中的一级销售数据:');
  console.log('-' .repeat(50));
  
  const { data: primarySale, error: primaryError } = await supabase
    .from('sales_optimized')
    .select('*')
    .eq('sales_code', testSalesCode)
    .single();
  
  if (primaryError) {
    console.error('❌ 查询一级销售失败:', primaryError);
    return;
  }
  
  console.log('✅ 找到一级销售:');
  console.log('  - 微信名:', primarySale.wechat_name);
  console.log('  - 销售代码:', primarySale.sales_code);
  console.log('  - 销售类型:', primarySale.sales_type);
  console.log('  - 总佣金:', primarySale.total_commission);
  console.log('  - 直销佣金:', primarySale.direct_commission);
  console.log('  - 二级返佣:', primarySale.secondary_share_commission);
  console.log('  - 平均二级佣金率:', primarySale.secondary_avg_rate);
  console.log('  - 二级订单总额:', primarySale.secondary_orders_amount);
  
  // 2. 检查二级销售
  console.log('\n2️⃣ 检查该一级销售的二级销售:');
  console.log('-' .repeat(50));
  
  const { data: secondarySales, error: secondaryError } = await supabase
    .from('sales_optimized')
    .select('*')
    .eq('parent_sales_code', testSalesCode)
    .eq('sales_type', 'secondary');
  
  if (secondaryError) {
    console.error('❌ 查询二级销售失败:', secondaryError);
  } else {
    console.log(`✅ 找到 ${secondarySales?.length || 0} 个二级销售`);
    
    if (secondarySales && secondarySales.length > 0) {
      secondarySales.forEach((ss, index) => {
        console.log(`\n  二级销售 ${index + 1}:`);
        console.log(`    - 微信名: ${ss.wechat_name}`);
        console.log(`    - 销售代码: ${ss.sales_code}`);
        console.log(`    - 佣金率: ${ss.commission_rate}`);
        console.log(`    - 订单总额: ${ss.total_amount}`);
        console.log(`    - 佣金总额: ${ss.total_commission}`);
      });
      
      // 计算返佣
      let totalSecondaryAmount = 0;
      let totalSecondaryCommission = 0;
      let totalShareCommission = 0;
      
      secondarySales.forEach(ss => {
        const amount = ss.total_amount || 0;
        const commission = ss.total_commission || 0;
        const rate = ss.commission_rate || 0;
        const shareCommission = amount * (0.4 - rate);
        
        totalSecondaryAmount += amount;
        totalSecondaryCommission += commission;
        totalShareCommission += shareCommission;
      });
      
      console.log('\n  📊 二级销售汇总:');
      console.log(`    - 二级订单总额: ${totalSecondaryAmount}`);
      console.log(`    - 二级总佣金: ${totalSecondaryCommission}`);
      console.log(`    - 一级返佣收益: ${totalShareCommission}`);
    }
  }
  
  // 3. 检查订单数据
  console.log('\n3️⃣ 检查订单数据:');
  console.log('-' .repeat(50));
  
  // 一级销售直销订单
  const { data: primaryOrders, error: primaryOrdersError } = await supabase
    .from('orders_optimized')
    .select('*')
    .eq('sales_code', testSalesCode)
    .in('status', ['confirmed', 'confirmed_config', 'paid', 'completed']);
  
  console.log(`✅ 一级销售直销订单: ${primaryOrders?.length || 0} 个`);
  if (primaryOrders && primaryOrders.length > 0) {
    const totalAmount = primaryOrders.reduce((sum, o) => sum + (o.amount || 0), 0);
    console.log(`  - 直销订单总额: ${totalAmount}`);
    console.log(`  - 直销佣金(40%): ${totalAmount * 0.4}`);
  }
  
  // 二级销售订单
  if (secondarySales && secondarySales.length > 0) {
    const secondaryCodes = secondarySales.map(s => s.sales_code);
    
    const { data: secondaryOrders, error: secondaryOrdersError } = await supabase
      .from('orders_optimized')
      .select('*')
      .in('sales_code', secondaryCodes)
      .in('status', ['confirmed', 'confirmed_config', 'paid', 'completed']);
    
    console.log(`✅ 二级销售订单: ${secondaryOrders?.length || 0} 个`);
    if (secondaryOrders && secondaryOrders.length > 0) {
      const totalAmount = secondaryOrders.reduce((sum, o) => sum + (o.amount || 0), 0);
      console.log(`  - 二级订单总额: ${totalAmount}`);
    }
  }
  
  // 4. 检查今日和本月数据
  console.log('\n4️⃣ 检查时间范围数据(中国时区):');
  console.log('-' .repeat(50));
  
  const now = new Date();
  const chinaOffset = 8 * 60 * 60 * 1000;
  const chinaNow = new Date(now.getTime() + chinaOffset);
  const todayStart = new Date(chinaNow.getFullYear(), chinaNow.getMonth(), chinaNow.getDate() - chinaOffset/1000/60/60);
  const monthStart = new Date(chinaNow.getFullYear(), chinaNow.getMonth(), 1 - chinaOffset/1000/60/60);
  
  // 今日订单
  const { data: todayOrders } = await supabase
    .from('orders_optimized')
    .select('*')
    .eq('sales_code', testSalesCode)
    .gte('payment_time', todayStart.toISOString())
    .in('status', ['confirmed', 'confirmed_config', 'paid', 'completed']);
  
  console.log(`✅ 今日订单: ${todayOrders?.length || 0} 个`);
  if (todayOrders && todayOrders.length > 0) {
    const todayAmount = todayOrders.reduce((sum, o) => sum + (o.amount || 0), 0);
    console.log(`  - 今日订单金额: ${todayAmount}`);
    console.log(`  - 今日佣金(40%): ${todayAmount * 0.4}`);
  }
  
  // 本月订单
  const { data: monthOrders } = await supabase
    .from('orders_optimized')
    .select('*')
    .eq('sales_code', testSalesCode)
    .gte('payment_time', monthStart.toISOString())
    .in('status', ['confirmed', 'confirmed_config', 'paid', 'completed']);
  
  console.log(`✅ 本月订单: ${monthOrders?.length || 0} 个`);
  if (monthOrders && monthOrders.length > 0) {
    const monthAmount = monthOrders.reduce((sum, o) => sum + (o.amount || 0), 0);
    console.log(`  - 本月订单金额: ${monthAmount}`);
    console.log(`  - 本月佣金(40%): ${monthAmount * 0.4}`);
  }
  
  console.log('\n' + '=' .repeat(60));
  console.log('📊 诊断建议:');
  console.log('1. 如果二级销售为0，需要检查parent_sales_code字段是否正确设置');
  console.log('2. 如果订单为0，需要检查订单状态是否在确认状态');
  console.log('3. 如果今日/本月为0，需要检查payment_time字段是否有值');
  console.log('4. 检查sales_optimized表的统计字段是否需要重新计算');
}

// 执行检查
checkFullDataChain().catch(console.error);