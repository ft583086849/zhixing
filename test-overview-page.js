// 模拟AdminOverview组件的数据获取逻辑
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './client/.env' });

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ 缺少环境变量');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// 模拟AdminOverview组件的getSales调用
async function testGetSales() {
  console.log('📊 测试 getSales 函数（模拟AdminOverview组件）...\n');
  
  try {
    // 这是AdminOverview组件通过Redux调用的逻辑
    const { data: salesData, error } = await supabase
      .from('sales_optimized')
      .select('*')
      .order('total_amount', { ascending: false });
    
    if (error) {
      console.error('❌ getSales查询失败:', error);
      return [];
    }
    
    console.log(`✅ getSales返回 ${salesData?.length || 0} 个销售数据\n`);
    
    // 模拟AdminOverview组件的Top5处理逻辑
    const totalSalesAmount = salesData.reduce((sum, sale) => 
      sum + (sale.total_amount || 0), 0
    );
    
    // 智能去重逻辑（来自AdminOverview组件）
    const processedSales = [];
    const processedPrimaryIds = new Set();
    
    salesData.forEach(sale => {
      if (sale.sales_type === 'secondary' && sale.parent_sales_id) {
        const primarySales = salesData.find(s => 
          s.sales_type === 'primary' && 
          s.id === sale.parent_sales_id
        );
        
        if (primarySales) {
          if (sale.total_amount >= (primarySales.total_amount || 0)) {
            processedPrimaryIds.add(primarySales.id);
            sale.primary_sales_name = primarySales.wechat_name || primarySales.name || '-';
          }
        }
        processedSales.push(sale);
      } 
      else if (sale.sales_type === 'primary' && !processedPrimaryIds.has(sale.id)) {
        processedSales.push(sale);
      }
      else if (sale.sales_type === 'independent') {
        processedSales.push(sale);
      }
    });
    
    // 取前5名
    const top5 = processedSales
      .slice(0, 5)
      .map((sale, index) => ({
        key: sale.id || index,
        rank: index + 1,
        sales_type: sale.sales_type === 'primary' ? '一级销售' : 
                   (sale.sales_type === 'secondary' ? '二级销售' : '独立销售'),
        sales_name: sale.wechat_name || sale.name || '-',
        primary_sales_name: sale.primary_sales_name || sale.parent_sales_name || '-',
        total_amount: sale.total_amount || 0,
        commission_amount: sale.total_commission || 0,
        percentage: totalSalesAmount > 0 
          ? ((sale.total_amount || 0) / totalSalesAmount * 100).toFixed(2)
          : '0.00'
      }));
    
    console.log('🏆 Top5销售排行榜（AdminOverview组件处理后）:');
    console.log('─'.repeat(80));
    console.log('排名 | 类型     | 销售名称         | 销售额    | 佣金      | 占比');
    console.log('─'.repeat(80));
    
    top5.forEach(sale => {
      console.log(
        `${sale.rank.toString().padEnd(4)} | ` +
        `${sale.sales_type.padEnd(8)} | ` +
        `${sale.sales_name.padEnd(16)} | ` +
        `$${sale.total_amount.toString().padEnd(8)} | ` +
        `$${sale.commission_amount.toString().padEnd(8)} | ` +
        `${sale.percentage}%`
      );
    });
    
    return top5;
  } catch (error) {
    console.error('❌ 测试失败:', error);
    return [];
  }
}

// 模拟getStats调用
async function testGetStats() {
  console.log('\n\n📈 测试 getStats 函数（模拟AdminOverview组件）...\n');
  
  try {
    // 获取订单数据
    const { data: orders, error } = await supabase
      .from('orders_optimized')
      .select('*');
    
    if (error) {
      console.error('❌ getStats查询失败:', error);
      return {};
    }
    
    const validOrders = orders.filter(o => o.status !== 'rejected');
    const totalOrders = validOrders.length;
    
    // 计算订单分类统计
    const stats = {
      free_trial_orders: validOrders.filter(o => o.duration === '7天' || o.duration === '7days').length,
      one_month_orders: validOrders.filter(o => o.duration === '1个月' || o.duration === '1month').length,
      three_month_orders: validOrders.filter(o => o.duration === '3个月' || o.duration === '3months').length,
      six_month_orders: validOrders.filter(o => o.duration === '6个月' || o.duration === '6months').length,
      yearly_orders: validOrders.filter(o => o.duration === '1年' || o.duration === '1year').length,
    };
    
    // 计算百分比
    Object.keys(stats).forEach(key => {
      const percentage = totalOrders > 0 ? (stats[key] / totalOrders * 100) : 0;
      stats[key + '_percentage'] = percentage;
    });
    
    console.log('订单分类统计:');
    console.log('─'.repeat(50));
    console.log(`7天免费: ${stats.free_trial_orders} 笔 (${stats.free_trial_orders_percentage.toFixed(2)}%)`);
    console.log(`1个月: ${stats.one_month_orders} 笔 (${stats.one_month_orders_percentage.toFixed(2)}%)`);
    console.log(`3个月: ${stats.three_month_orders} 笔 (${stats.three_month_orders_percentage.toFixed(2)}%)`);
    console.log(`6个月: ${stats.six_month_orders} 笔 (${stats.six_month_orders_percentage.toFixed(2)}%)`);
    console.log(`1年: ${stats.yearly_orders} 笔 (${stats.yearly_orders_percentage.toFixed(2)}%)`);
    
    return stats;
  } catch (error) {
    console.error('❌ 测试失败:', error);
    return {};
  }
}

// 运行测试
async function runTests() {
  console.log('=' .repeat(80));
  console.log('测试 AdminOverview 组件的数据获取逻辑');
  console.log('=' .repeat(80));
  
  const top5 = await testGetSales();
  const stats = await testGetStats();
  
  console.log('\n\n📊 测试总结:');
  console.log('─'.repeat(50));
  console.log(`✓ Top5销售数据: ${top5.length > 0 ? '有数据' : '⚠️ 无数据'}`);
  console.log(`✓ 订单统计数据: ${Object.keys(stats).length > 0 ? '有数据' : '⚠️ 无数据'}`);
  
  if (top5.length === 0) {
    console.log('\n⚠️  注意: Top5销售排行榜没有数据，可能原因：');
    console.log('  1. sales_optimized表中的total_amount都是0');
    console.log('  2. 数据处理逻辑有问题');
    console.log('  3. 数据库连接有问题');
  }
  
  console.log('\n请在浏览器中访问: http://localhost:3000/admin/dashboard');
  console.log('查看页面是否正确显示这些数据');
}

runTests();