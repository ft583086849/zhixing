require('dotenv').config({ path: './client/.env' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY
);

async function recalculateSalesOptimized() {
  console.log('重新计算sales_optimized表（使用正确的逻辑）');
  console.log('='.repeat(80));
  
  // 1. 获取所有销售人员
  const { data: primarySales } = await supabase
    .from('primary_sales')
    .select('*');
    
  const { data: secondarySales } = await supabase
    .from('secondary_sales')
    .select('*');
    
  console.log(`找到 ${primarySales?.length || 0} 个一级销售`);
  console.log(`找到 ${secondarySales?.length || 0} 个二级销售`);
  
  // 2. 创建映射
  const primaryById = new Map();
  const primaryByCode = new Map();
  primarySales?.forEach(p => {
    primaryById.set(p.id, p);
    primaryByCode.set(p.sales_code, p);
  });
  
  const secondaryByCode = new Map();
  const secondaryToPrimary = new Map(); // 二级销售code -> 一级销售
  secondarySales?.forEach(s => {
    secondaryByCode.set(s.sales_code, s);
    if (s.primary_sales_id) {
      const primary = primaryById.get(s.primary_sales_id);
      if (primary) {
        secondaryToPrimary.set(s.sales_code, primary);
      }
    }
  });
  
  // 3. 获取所有有效订单
  const { data: orders } = await supabase
    .from('orders_optimized')
    .select('*')
    .neq('status', 'rejected');
    
  console.log(`找到 ${orders?.length || 0} 个有效订单\n`);
  
  // 4. 计算每个一级销售的数据
  console.log('计算一级销售数据...');
  for (const primary of primarySales || []) {
    let directOrders = 0;
    let directAmount = 0;
    let directCommission = 0;
    let teamOrders = 0;
    let teamAmount = 0;
    let teamDifferenceCommission = 0; // 差价收益
    
    // 计算直销
    orders?.forEach(order => {
      if (order.sales_code === primary.sales_code) {
        directOrders++;
        directAmount += order.amount || 0;
        directCommission += order.amount * 0.4; // 一级销售40%佣金
      }
    });
    
    // 计算团队销售和差价收益
    secondarySales?.forEach(secondary => {
      if (secondary.primary_sales_id === primary.id) {
        orders?.forEach(order => {
          if (order.sales_code === secondary.sales_code) {
            teamOrders++;
            teamAmount += order.amount || 0;
            // 差价计算：一级拿40%，二级拿25%，差价15%
            const difference = order.amount * 0.15;
            teamDifferenceCommission += difference;
          }
        });
      }
    });
    
    const totalCommission = directCommission + teamDifferenceCommission;
    
    console.log(`${primary.wechat_name}:`);
    console.log(`  直销: ${directOrders}单, $${directAmount}, 佣金$${directCommission.toFixed(2)}`);
    console.log(`  团队: ${teamOrders}单, $${teamAmount}, 差价$${teamDifferenceCommission.toFixed(2)}`);
    console.log(`  总佣金: $${totalCommission.toFixed(2)}`);
    
    // 更新数据库
    const { error } = await supabase
      .from('sales_optimized')
      .update({
        total_orders: directOrders + teamOrders,
        total_amount: directAmount + teamAmount,
        total_direct_orders: directOrders,
        total_direct_amount: directAmount,
        primary_commission_amount: directCommission,
        total_team_orders: teamOrders,
        total_team_amount: teamAmount,
        secondary_commission_amount: teamDifferenceCommission, // 这是差价收益，不是二级销售的佣金
        total_commission: totalCommission,
        updated_at: new Date().toISOString()
      })
      .eq('sales_code', primary.sales_code);
      
    if (error) {
      console.error(`  更新失败:`, error);
    }
  }
  
  // 5. 计算每个二级销售的数据
  console.log('\n计算二级销售数据...');
  for (const secondary of secondarySales || []) {
    let totalOrders = 0;
    let totalAmount = 0;
    let totalCommission = 0;
    
    orders?.forEach(order => {
      if (order.sales_code === secondary.sales_code) {
        totalOrders++;
        totalAmount += order.amount || 0;
        totalCommission += order.amount * 0.25; // 二级销售25%佣金
      }
    });
    
    console.log(`${secondary.wechat_name}: ${totalOrders}单, $${totalAmount}, 佣金$${totalCommission.toFixed(2)}`);
    
    // 更新数据库
    const { error } = await supabase
      .from('sales_optimized')
      .update({
        total_orders: totalOrders,
        total_amount: totalAmount,
        total_commission: totalCommission,
        updated_at: new Date().toISOString()
      })
      .eq('sales_code', secondary.sales_code);
      
    if (error) {
      console.error(`  更新失败:`, error);
    }
  }
  
  console.log('\n✅ 重新计算完成！');
}

recalculateSalesOptimized();