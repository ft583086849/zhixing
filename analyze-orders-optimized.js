require('dotenv').config({ path: './client/.env' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function analyzeOrdersOptimized() {
  console.log('='.repeat(80));
  console.log('分析 orders_optimized 表结构和佣金逻辑');
  console.log('='.repeat(80));
  
  try {
    // 1. 获取表结构
    const { data: sample, error: sampleError } = await supabase
      .from('orders_optimized')
      .select('*')
      .limit(1);
    
    if (sampleError) {
      console.error('Error:', sampleError);
      return;
    }
    
    if (sample && sample.length > 0) {
      console.log('\n📊 orders_optimized 表字段：');
      console.log('-'.repeat(40));
      const fields = Object.keys(sample[0]);
      fields.forEach(field => {
        const value = sample[0][field];
        const type = value === null ? 'null' : typeof value;
        console.log(`  ${field}: ${type}`);
      });
    }
    
    // 2. 分析佣金相关字段
    console.log('\n💰 佣金相关字段分析：');
    console.log('-'.repeat(40));
    
    const { data: commissionData, error: commissionError } = await supabase
      .from('orders_optimized')
      .select(`
        id,
        sales_wechat_name,
        sales_type,
        primary_sales_name,
        commission_rate,
        commission_amount,
        primary_commission_amount,
        secondary_commission_amount,
        actual_payment_amount,
        status
      `)
      .neq('status', 'rejected')
      .limit(10);
    
    if (commissionData) {
      console.log(`\n找到 ${commissionData.length} 条有效订单`);
      
      // 分析不同销售类型的佣金
      const primaryOrders = commissionData.filter(o => o.sales_type === 'primary');
      const secondaryOrders = commissionData.filter(o => o.sales_type === 'secondary');
      const independentOrders = commissionData.filter(o => o.sales_type === 'independent');
      
      console.log(`\n按销售类型分布：`);
      console.log(`  一级销售订单: ${primaryOrders.length}`);
      console.log(`  二级销售订单: ${secondaryOrders.length}`);
      console.log(`  独立销售订单: ${independentOrders.length}`);
      
      // 分析一级销售的佣金结构
      if (primaryOrders.length > 0) {
        console.log('\n🎯 一级销售佣金结构示例：');
        const order = primaryOrders[0];
        console.log(`  订单ID: ${order.id}`);
        console.log(`  销售: ${order.sales_wechat_name}`);
        console.log(`  实付金额: $${order.actual_payment_amount}`);
        console.log(`  佣金率: ${order.commission_rate}`);
        console.log(`  总佣金: $${order.commission_amount}`);
        console.log(`  直销佣金: $${order.primary_commission_amount || 0}`);
        console.log(`  分销收益: $${order.secondary_commission_amount || 0}`);
      }
      
      // 分析二级销售的佣金结构
      if (secondaryOrders.length > 0) {
        console.log('\n🎯 二级销售佣金结构示例：');
        const order = secondaryOrders[0];
        console.log(`  订单ID: ${order.id}`);
        console.log(`  销售: ${order.sales_wechat_name}`);
        console.log(`  上级: ${order.primary_sales_name}`);
        console.log(`  实付金额: $${order.actual_payment_amount}`);
        console.log(`  佣金率: ${order.commission_rate}`);
        console.log(`  二级佣金: $${order.commission_amount}`);
        console.log(`  上级分成: $${order.secondary_commission_amount || 0}`);
      }
    }
    
    // 3. 统计每个销售的数据
    console.log('\n📈 销售业绩统计逻辑：');
    console.log('-'.repeat(40));
    
    const { data: salesStats, error: statsError } = await supabase
      .from('orders_optimized')
      .select(`
        sales_wechat_name,
        sales_type,
        count,
        actual_payment_amount,
        commission_amount,
        primary_commission_amount,
        secondary_commission_amount
      `)
      .neq('status', 'rejected');
    
    if (salesStats) {
      // 按销售分组统计
      const salesMap = new Map();
      
      salesStats.forEach(order => {
        const key = order.sales_wechat_name;
        if (!salesMap.has(key)) {
          salesMap.set(key, {
            wechat_name: key,
            sales_type: order.sales_type,
            total_orders: 0,
            total_amount: 0,
            direct_commission: 0,  // 直销佣金
            team_commission: 0,    // 团队分成
            total_commission: 0
          });
        }
        
        const stats = salesMap.get(key);
        stats.total_orders++;
        stats.total_amount += order.actual_payment_amount || 0;
        
        // 根据销售类型计算佣金
        if (order.sales_type === 'primary') {
          // 一级销售：有直销佣金和团队分成
          stats.direct_commission += order.primary_commission_amount || order.commission_amount || 0;
          stats.team_commission += order.secondary_commission_amount || 0;
        } else {
          // 二级/独立销售：只有自己的佣金
          stats.direct_commission += order.commission_amount || 0;
        }
        
        stats.total_commission = stats.direct_commission + stats.team_commission;
      });
      
      console.log('\n销售管理页面应该展示的数据：');
      console.log('1. 基础信息：微信号、销售类型、销售代码');
      console.log('2. 订单统计：总订单数、总金额');
      console.log('3. 佣金明细：');
      console.log('   - 一级销售：直销佣金 + 团队分成');
      console.log('   - 二级销售：销售佣金');
      console.log('   - 独立销售：销售佣金');
      console.log('4. 已返/待返佣金');
      
      // 显示前3个销售的统计
      console.log('\n示例数据：');
      let count = 0;
      for (const [key, stats] of salesMap) {
        if (count++ >= 3) break;
        console.log(`\n销售: ${stats.wechat_name} (${stats.sales_type})`);
        console.log(`  订单: ${stats.total_orders}`);
        console.log(`  金额: $${stats.total_amount.toFixed(2)}`);
        if (stats.sales_type === 'primary') {
          console.log(`  直销佣金: $${stats.direct_commission.toFixed(2)}`);
          console.log(`  团队分成: $${stats.team_commission.toFixed(2)}`);
        }
        console.log(`  总佣金: $${stats.total_commission.toFixed(2)}`);
      }
    }
    
    // 4. 分析团队关系
    console.log('\n👥 团队关系分析：');
    console.log('-'.repeat(40));
    
    const { data: teamData, error: teamError } = await supabase
      .from('orders_optimized')
      .select('primary_sales_name, sales_wechat_name, sales_type')
      .eq('sales_type', 'secondary')
      .not('primary_sales_name', 'is', null);
    
    if (teamData) {
      const teamMap = new Map();
      teamData.forEach(order => {
        const primary = order.primary_sales_name;
        if (!teamMap.has(primary)) {
          teamMap.set(primary, new Set());
        }
        teamMap.get(primary).add(order.sales_wechat_name);
      });
      
      console.log('\n一级销售团队规模：');
      for (const [primary, team] of teamMap) {
        console.log(`  ${primary}: ${team.size} 个二级销售`);
      }
    }
    
    console.log('\n\n🎯 结论：');
    console.log('='.repeat(40));
    console.log('销售管理页面应该从 orders_optimized 表聚合数据，而不是依赖 sales_optimized 表');
    console.log('因为 orders_optimized 表有准确的佣金计算字段：');
    console.log('1. primary_commission_amount - 一级销售的直销佣金');
    console.log('2. secondary_commission_amount - 一级销售的团队分成');
    console.log('3. commission_amount - 二级/独立销售的佣金');
    console.log('\n建议：直接从 orders_optimized 表实时聚合数据，确保准确性');
    
  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

analyzeOrdersOptimized();