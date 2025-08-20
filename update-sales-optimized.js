require('dotenv').config({ path: './client/.env' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function updateSalesOptimized() {
  console.log('='.repeat(80));
  console.log('从 orders_optimized 表重新计算 sales_optimized 表数据');
  console.log('='.repeat(80));
  
  try {
    // 1. 获取所有销售记录
    const { data: salesData, error: salesError } = await supabase
      .from('sales_optimized')
      .select('*');
    
    if (salesError) {
      console.error('获取销售数据失败:', salesError);
      return;
    }
    
    console.log(`\n找到 ${salesData.length} 个销售\n`);
    
    // 2. 获取所有有效订单
    const { data: orders, error: ordersError } = await supabase
      .from('orders_optimized')
      .select(`
        id,
        sales_code,
        sales_type,
        primary_sales_id,
        secondary_sales_id,
        amount,
        actual_payment_amount,
        commission_amount,
        primary_commission_amount,
        secondary_commission_amount,
        status
      `)
      .neq('status', 'rejected');
    
    if (ordersError) {
      console.error('获取订单数据失败:', ordersError);
      return;
    }
    
    console.log(`找到 ${orders.length} 个有效订单\n`);
    
    // 3. 先获取一级销售列表，创建映射
    const { data: primarySalesList } = await supabase
      .from('primary_sales')
      .select('id, sales_code');
    
    const primaryByCode = new Map();
    primarySalesList?.forEach(p => {
      primaryByCode.set(p.sales_code, p);
    });
    
    // 按销售代码聚合订单数据
    const salesStatsMap = new Map();
    
    // 初始化所有销售的统计
    salesData.forEach(sale => {
      salesStatsMap.set(sale.sales_code, {
        id: sale.id,
        sales_code: sale.sales_code,
        sales_type: sale.sales_type,
        // 订单统计
        total_orders: 0,
        total_amount: 0,
        // 直销统计
        total_direct_orders: 0,
        total_direct_amount: 0,
        primary_commission_amount: 0,  // 直销佣金
        // 团队统计
        total_team_orders: 0,
        total_team_amount: 0,
        secondary_commission_amount: 0, // 团队分成
        // 总佣金
        total_commission: 0
      });
    });
    
    // 4. 计算每个销售的直销业绩
    orders.forEach(order => {
      if (!order.sales_code) return;
      
      const stats = salesStatsMap.get(order.sales_code);
      if (!stats) return;
      
      const orderAmount = order.actual_payment_amount || order.amount || 0;
      
      // 直销订单统计
      stats.total_orders++;
      stats.total_amount += orderAmount;
      stats.total_direct_orders++;
      stats.total_direct_amount += orderAmount;
      
      // 根据销售类型计算佣金
      // 一级销售40%，二级销售25%
      const isPrimary = primaryByCode.has(order.sales_code);
      const commissionRate = isPrimary ? 0.4 : 0.25;
      stats.primary_commission_amount += orderAmount * commissionRate;
    });
    
    // 5. 计算一级销售的团队分成
    // 获取二级销售的映射关系
    const { data: secondarySales } = await supabase
      .from('secondary_sales')
      .select('sales_code, primary_sales_id');
    
    // 创建映射：primary_sales_id -> primary_sales_code
    const primaryIdToCode = new Map();
    primarySalesList?.forEach(p => {
      primaryIdToCode.set(p.id, p.sales_code);
    });
    
    // 创建映射：secondary_sales_code -> primary_sales_code
    const secondaryToPrimary = new Map();
    secondarySales?.forEach(s => {
      const primaryCode = primaryIdToCode.get(s.primary_sales_id);
      if (primaryCode) {
        secondaryToPrimary.set(s.sales_code, primaryCode);
      }
    });
    
    // 计算团队分成（一级销售从二级订单获得的差价）
    orders.forEach(order => {
      if (!order.sales_code) return;
      
      // 如果这是二级销售的订单
      const primarySalesCode = secondaryToPrimary.get(order.sales_code);
      if (primarySalesCode) {
        const primaryStats = salesStatsMap.get(primarySalesCode);
        if (primaryStats) {
          const orderAmount = order.actual_payment_amount || order.amount || 0;
          primaryStats.total_team_orders++;
          primaryStats.total_team_amount += orderAmount;
          // 计算差价：一级销售拿40%，二级销售拿25%，差价15%
          primaryStats.secondary_commission_amount += orderAmount * 0.15;
        }
      }
    });
    
    // 6. 计算总佣金
    salesStatsMap.forEach(stats => {
      stats.total_commission = stats.primary_commission_amount + stats.secondary_commission_amount;
    });
    
    // 7. 更新数据库
    console.log('开始更新数据库...\n');
    
    let updateCount = 0;
    for (const [salesCode, stats] of salesStatsMap) {
      const { error } = await supabase
        .from('sales_optimized')
        .update({
          total_orders: stats.total_orders,
          total_amount: stats.total_amount,
          total_direct_orders: stats.total_direct_orders,
          total_direct_amount: stats.total_direct_amount,
          primary_commission_amount: stats.primary_commission_amount,
          total_team_orders: stats.total_team_orders,
          total_team_amount: stats.total_team_amount,
          secondary_commission_amount: stats.secondary_commission_amount,
          total_commission: stats.total_commission,
          updated_at: new Date().toISOString()
        })
        .eq('sales_code', salesCode);
      
      if (error) {
        console.error(`更新 ${salesCode} 失败:`, error);
      } else {
        updateCount++;
      }
    }
    
    console.log(`\n✅ 更新完成！共更新 ${updateCount} 个销售的数据\n`);
    
    // 8. 显示一些统计结果
    console.log('📊 统计结果：');
    console.log('='.repeat(40));
    
    // 显示一级销售的数据
    const primaryStats = Array.from(salesStatsMap.values())
      .filter(s => s.sales_type === 'primary')
      .sort((a, b) => b.total_commission - a.total_commission)
      .slice(0, 3);
    
    console.log('\n🎯 一级销售 TOP 3：');
    primaryStats.forEach((stats, i) => {
      console.log(`\n${i + 1}. ${stats.sales_code}`);
      console.log(`   订单: ${stats.total_orders} (直销: ${stats.total_direct_orders}, 团队: ${stats.total_team_orders})`);
      console.log(`   金额: $${stats.total_amount.toFixed(2)}`);
      console.log(`   直销佣金: $${stats.primary_commission_amount.toFixed(2)}`);
      console.log(`   团队分成: $${stats.secondary_commission_amount.toFixed(2)}`);
      console.log(`   总佣金: $${stats.total_commission.toFixed(2)}`);
    });
    
    // 显示二级销售的数据
    const secondaryStats = Array.from(salesStatsMap.values())
      .filter(s => s.sales_type === 'secondary' || s.sales_type === 'independent')
      .sort((a, b) => b.total_commission - a.total_commission)
      .slice(0, 3);
    
    console.log('\n🎯 二级/独立销售 TOP 3：');
    secondaryStats.forEach((stats, i) => {
      console.log(`\n${i + 1}. ${stats.sales_code} (${stats.sales_type})`);
      console.log(`   订单: ${stats.total_orders}`);
      console.log(`   金额: $${stats.total_amount.toFixed(2)}`);
      console.log(`   销售佣金: $${stats.primary_commission_amount.toFixed(2)}`);
    });
    
  } catch (err) {
    console.error('执行失败:', err);
  }
}

updateSalesOptimized();