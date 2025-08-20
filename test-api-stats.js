/**
 * 测试API统计数据
 */

// 模拟浏览器环境变量
process.env.REACT_APP_ENABLE_NEW_STATS = 'true';

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://itvmeamoqthfqtkpubdv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0dm1lYW1vcXRoZnF0a3B1YmR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0ODEyMzUsImV4cCI6MjA3MDA1NzIzNX0.ypBF3lJJTJtSPLEu1zWXqPorS-FDSZzRUy_0ge_Y-r0'
);

async function testStatsAPI() {
  console.log('🧪 测试统计API...\n');
  
  try {
    // 1. 检查环境变量
    console.log('1️⃣ 环境变量设置:');
    console.log('   REACT_APP_ENABLE_NEW_STATS:', process.env.REACT_APP_ENABLE_NEW_STATS);
    const useNewStats = process.env.REACT_APP_ENABLE_NEW_STATS === 'true';
    console.log(`   使用${useNewStats ? '新' : '旧'}的统计方式\n`);
    
    // 2. 直接查询overview_stats表
    console.log('2️⃣ 直接查询overview_stats表:');
    const { data: statsData, error } = await supabase
      .from('overview_stats')
      .select('*')
      .eq('stat_type', 'realtime')
      .eq('stat_period', 'all')
      .single();
    
    if (error) {
      console.error('❌ 查询失败:', error);
      return;
    }
    
    console.log('✅ 查询成功，数据:');
    console.log('   总订单:', statsData.total_orders);
    console.log('   活跃订单:', statsData.active_orders);
    console.log('   总金额: $', statsData.total_amount);
    console.log('   总佣金: $', statsData.total_commission);
    console.log('   一级销售:', statsData.primary_sales_count);
    console.log('   二级销售:', statsData.secondary_sales_count);
    
    // 3. 模拟API格式化
    console.log('\n3️⃣ 模拟API格式化后的数据:');
    const formattedData = {
      total_orders: statsData.total_orders || 0,
      today_orders: statsData.today_orders || 0,
      pending_payment_orders: statsData.pending_payment_orders || 0,
      confirmed_payment_orders: statsData.confirmed_payment_orders || 0,
      pending_config_orders: statsData.pending_config_orders || 0,
      confirmed_config_orders: statsData.confirmed_config_orders || 0,
      rejected_orders: statsData.rejected_orders || 0,
      total_amount: parseFloat(statsData.total_amount || 0),
      today_amount: parseFloat(statsData.today_amount || 0),
      confirmed_amount: parseFloat(statsData.confirmed_amount || 0),
      total_commission: parseFloat(statsData.total_commission || 0),
      paid_commission: parseFloat(statsData.paid_commission || 0),
      pending_commission: parseFloat(statsData.pending_commission || 0),
      primary_sales_count: statsData.primary_sales_count || 0,
      secondary_sales_count: statsData.secondary_sales_count || 0,
      independent_sales_count: statsData.independent_sales_count || 0,
      total_sales: (statsData.primary_sales_count || 0) + 
                   (statsData.secondary_sales_count || 0) + 
                   (statsData.independent_sales_count || 0),
      sales_with_orders: statsData.active_sales_count || 0
    };
    
    console.log(JSON.stringify(formattedData, null, 2));
    
    // 4. 检查页面渲染问题
    console.log('\n4️⃣ 可能的问题诊断:');
    
    if (formattedData.total_orders === 0) {
      console.log('⚠️ 总订单数为0，可能原因:');
      console.log('   - overview_stats表数据未更新');
      console.log('   - 需要运行 node update-stats-final.js 更新数据');
    }
    
    if (!useNewStats) {
      console.log('⚠️ 未启用新统计模式，可能原因:');
      console.log('   - client/.env 文件中 REACT_APP_ENABLE_NEW_STATS 未设置为 true');
      console.log('   - 需要重启开发服务器');
    }
    
    console.log('\n5️⃣ 修复建议:');
    console.log('1. 确保 client/.env 中设置了 REACT_APP_ENABLE_NEW_STATS=true');
    console.log('2. 运行 node update-stats-final.js 更新数据');
    console.log('3. 重启前端服务: npm start');
    console.log('4. 清除浏览器缓存并刷新页面');
    
  } catch (error) {
    console.error('❌ 测试失败:', error);
  }
}

testStatsAPI();