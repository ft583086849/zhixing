require('dotenv').config({ path: './client/.env' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkOrdersCommission() {
  console.log('='.repeat(80));
  console.log('检查 orders_optimized 表的佣金字段');
  console.log('='.repeat(80));
  
  try {
    // 1. 获取一些有佣金的订单样本
    const { data: orders, error } = await supabase
      .from('orders_optimized')
      .select(`
        id,
        order_number,
        customer_wechat,
        amount,
        actual_payment_amount,
        sales_code,
        sales_type,
        sales_wechat_name,
        primary_sales_name,
        commission_rate,
        commission_amount,
        primary_commission_amount,
        secondary_commission_amount,
        secondary_commission_rate,
        status
      `)
      .neq('status', 'rejected')
      .gt('commission_amount', 0)
      .limit(10);
    
    if (error) {
      console.error('Error:', error);
      return;
    }
    
    console.log(`\n找到 ${orders?.length || 0} 条有佣金的订单\n`);
    
    if (orders && orders.length > 0) {
      // 分析不同销售类型的佣金结构
      const primaryOrders = orders.filter(o => o.sales_type === 'primary');
      const secondaryOrders = orders.filter(o => o.sales_type === 'secondary');
      const independentOrders = orders.filter(o => o.sales_type === 'independent');
      
      console.log('📊 销售类型分布：');
      console.log(`  一级销售订单: ${primaryOrders.length}`);
      console.log(`  二级销售订单: ${secondaryOrders.length}`);
      console.log(`  独立销售订单: ${independentOrders.length}`);
      console.log(`  无销售类型: ${orders.filter(o => !o.sales_type).length}`);
      
      // 显示一级销售的佣金结构
      if (primaryOrders.length > 0) {
        console.log('\n🎯 一级销售佣金示例：');
        console.log('-'.repeat(40));
        primaryOrders.slice(0, 2).forEach(order => {
          console.log(`订单: ${order.order_number}`);
          console.log(`  销售: ${order.sales_wechat_name || order.sales_code}`);
          console.log(`  金额: $${order.actual_payment_amount || order.amount}`);
          console.log(`  佣金率: ${(order.commission_rate * 100).toFixed(1)}%`);
          console.log(`  总佣金: $${order.commission_amount}`);
          console.log(`  ├─ 直销佣金: $${order.primary_commission_amount || 0}`);
          console.log(`  └─ 团队分成: $${order.secondary_commission_amount || 0}`);
          console.log('');
        });
      }
      
      // 显示二级销售的佣金结构
      if (secondaryOrders.length > 0) {
        console.log('\n🎯 二级销售佣金示例：');
        console.log('-'.repeat(40));
        secondaryOrders.slice(0, 2).forEach(order => {
          console.log(`订单: ${order.order_number}`);
          console.log(`  销售: ${order.sales_wechat_name || order.sales_code}`);
          console.log(`  上级: ${order.primary_sales_name || '未知'}`);
          console.log(`  金额: $${order.actual_payment_amount || order.amount}`);
          console.log(`  佣金率: ${(order.commission_rate * 100).toFixed(1)}%`);
          console.log(`  二级佣金: $${order.commission_amount}`);
          console.log(`  上级获得: $${order.secondary_commission_amount || 0} (${((order.secondary_commission_rate || 0) * 100).toFixed(1)}%)`);
          console.log('');
        });
      }
      
      // 统计销售业绩
      console.log('\n📈 销售业绩聚合逻辑：');
      console.log('='.repeat(40));
      
      const salesMap = new Map();
      
      orders.forEach(order => {
        const salesName = order.sales_wechat_name || order.sales_code || 'unknown';
        
        if (!salesMap.has(salesName)) {
          salesMap.set(salesName, {
            wechat_name: salesName,
            sales_type: order.sales_type,
            total_orders: 0,
            total_amount: 0,
            // 一级销售有两种佣金
            direct_commission: 0,     // 直销佣金
            team_commission: 0,        // 团队分成
            // 总佣金
            total_commission: 0
          });
        }
        
        const stats = salesMap.get(salesName);
        stats.total_orders++;
        stats.total_amount += order.actual_payment_amount || order.amount || 0;
        
        // 根据销售类型计算不同的佣金
        if (order.sales_type === 'primary') {
          // 一级销售：直销佣金 + 可能的团队分成
          if (order.primary_commission_amount > 0) {
            stats.direct_commission += order.primary_commission_amount;
          } else {
            // 如果没有分开记录，整个commission_amount都是直销佣金
            stats.direct_commission += order.commission_amount || 0;
          }
          
          // 团队分成（当一级销售的下级有订单时）
          if (order.secondary_commission_amount > 0) {
            stats.team_commission += order.secondary_commission_amount;
          }
        } else {
          // 二级/独立销售：只有销售佣金
          stats.direct_commission += order.commission_amount || 0;
        }
        
        stats.total_commission = stats.direct_commission + stats.team_commission;
      });
      
      console.log('\n销售业绩汇总：');
      for (const [name, stats] of salesMap) {
        console.log(`\n${name} (${stats.sales_type || '未知'})`);
        console.log(`  订单数: ${stats.total_orders}`);
        console.log(`  总金额: $${stats.total_amount.toFixed(2)}`);
        
        if (stats.sales_type === 'primary') {
          console.log(`  直销佣金: $${stats.direct_commission.toFixed(2)}`);
          if (stats.team_commission > 0) {
            console.log(`  团队分成: $${stats.team_commission.toFixed(2)}`);
          }
        } else {
          console.log(`  销售佣金: $${stats.direct_commission.toFixed(2)}`);
        }
        
        console.log(`  总佣金: $${stats.total_commission.toFixed(2)}`);
      }
    }
    
    // 检查是否有上下级关系的订单
    console.log('\n\n👥 检查团队关系：');
    console.log('='.repeat(40));
    
    const { data: teamOrders, error: teamError } = await supabase
      .from('orders_optimized')
      .select('sales_wechat_name, primary_sales_name, commission_amount, secondary_commission_amount')
      .eq('sales_type', 'secondary')
      .not('primary_sales_name', 'is', null)
      .gt('commission_amount', 0)
      .limit(5);
    
    if (teamOrders && teamOrders.length > 0) {
      console.log('\n二级销售及其上级分成示例：');
      teamOrders.forEach(order => {
        console.log(`  ${order.sales_wechat_name} -> 上级: ${order.primary_sales_name}`);
        console.log(`    二级获得: $${order.commission_amount}`);
        console.log(`    上级分成: $${order.secondary_commission_amount || 0}`);
      });
    }
    
    console.log('\n\n🎯 结论：');
    console.log('='.repeat(40));
    console.log('销售管理页面应该展示：');
    console.log('1. 基础信息：销售微信号、类型、代码、上级');
    console.log('2. 业绩统计：订单数、总金额');
    console.log('3. 佣金明细：');
    console.log('   - 一级销售：直销佣金（primary_commission_amount）+ 团队分成（从下级订单的secondary_commission_amount累加）');
    console.log('   - 二级销售：销售佣金（commission_amount）');
    console.log('   - 独立销售：销售佣金（commission_amount）');
    console.log('4. 已返/待返佣金（需要单独记录）');
    
  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

checkOrdersCommission();