// 🎯 验证视图是否创建成功
// 执行方式：node 🎯验证视图创建成功.js

const { createClient } = require('@supabase/supabase-js');

// 直接使用项目中的 Supabase 配置
const supabaseUrl = 'https://itvmeamoqthfqtkpubdv.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0dm1lYW1vcXRoZnF0a3B1YmR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0ODEyMzUsImV4cCI6MjA3MDA1NzIzNX0.ypBF3lJJTJtSPLEu1zWXqPorS-FDSZzRUy_0ge_Y-r0';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function verify() {
  console.log('🎯 验证视图创建状态...\n');
  console.log('=====================================\n');

  let allSuccess = true;

  try {
    // 1. 检查 confirmed_orders 视图
    console.log('📌 1. 检查 confirmed_orders 视图...');
    const { data: confirmedOrders, error: confirmedError } = await supabase
      .from('confirmed_orders')
      .select('*');
    
    if (confirmedError) {
      console.error('   ❌ confirmed_orders 视图不存在或无法访问');
      console.error('   错误:', confirmedError.message);
      allSuccess = false;
    } else {
      console.log(`   ✅ confirmed_orders 视图正常，包含 ${confirmedOrders.length} 条记录`);
    }
    console.log('');

    // 2. 检查 secondary_sales_stats 视图
    console.log('📌 2. 检查 secondary_sales_stats 视图...');
    const { data: secondaryStats, error: secondaryError } = await supabase
      .from('secondary_sales_stats')
      .select('*');
    
    if (secondaryError) {
      console.error('   ❌ secondary_sales_stats 视图不存在或无法访问');
      console.error('   错误:', secondaryError.message);
      allSuccess = false;
    } else {
      console.log(`   ✅ secondary_sales_stats 视图正常，包含 ${secondaryStats.length} 条记录`);
      if (secondaryStats.length > 0) {
        console.log('   示例数据:');
        const sample = secondaryStats[0];
        console.log(`     - 销售: ${sample.wechat_name}`);
        console.log(`     - 销售代码: ${sample.sales_code}`);
        console.log(`     - 总订单数: ${sample.total_orders}`);
        console.log(`     - 总金额: $${sample.total_amount}`);
        console.log(`     - 总佣金: $${sample.total_commission}`);
      }
    }
    console.log('');

    // 3. 检查 primary_sales_stats 视图
    console.log('📌 3. 检查 primary_sales_stats 视图...');
    const { data: primaryStats, error: primaryError } = await supabase
      .from('primary_sales_stats')
      .select('*');
    
    if (primaryError) {
      console.error('   ❌ primary_sales_stats 视图不存在或无法访问');
      console.error('   错误:', primaryError.message);
      allSuccess = false;
    } else {
      console.log(`   ✅ primary_sales_stats 视图正常，包含 ${primaryStats.length} 条记录`);
      if (primaryStats.length > 0) {
        const sample = primaryStats[0];
        console.log('   示例数据:');
        console.log(`     - 一级销售: ${sample.name}`);
        console.log(`     - 销售代码: ${sample.sales_code}`);
        console.log(`     - 直接订单数: ${sample.direct_orders}`);
        console.log(`     - 直接订单金额: $${sample.direct_amount}`);
        console.log(`     - 总订单数: ${sample.total_orders}`);
        console.log(`     - 总金额: $${sample.total_amount}`);
      }
    }
    console.log('');

    // 4. 测试 API 调用
    console.log('📌 4. 模拟 getStats API 调用...');
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('*');
    
    if (!ordersError && orders) {
      const stats = {
        total_orders: orders.length,
        confirmed_orders: orders.filter(o => o.config_confirmed === true).length,
        pending_orders: orders.filter(o => o.status === 'pending_config').length,
        confirmed_payment: orders.filter(o => o.status === 'confirmed').length
      };
      console.log('   ✅ API数据统计:');
      console.log(`     - 总订单数: ${stats.total_orders}`);
      console.log(`     - 确认配置订单: ${stats.confirmed_orders}`);
      console.log(`     - 待配置订单: ${stats.pending_orders}`);
      console.log(`     - 已确认付款: ${stats.confirmed_payment}`);
    }
    console.log('');

    // 5. 最终结果
    console.log('=====================================');
    console.log('🏁 验证结果:');
    console.log('=====================================\n');
    
    if (allSuccess) {
      console.log('✅ 所有视图都已成功创建！');
      console.log('');
      console.log('👉 现在你可以：');
      console.log('   1. 访问管理员仪表板: https://zhixing-seven.vercel.app/admin/dashboard');
      console.log('   2. 数据概览页面应该能正常显示数据了');
      console.log('');
      console.log('💡 如果页面还是没有数据，请尝试：');
      console.log('   - 清除浏览器缓存 (Ctrl/Cmd + Shift + R)');
      console.log('   - 重新登录管理员账号');
    } else {
      console.log('⚠️  部分视图创建失败');
      console.log('');
      console.log('请执行以下操作：');
      console.log('   1. 登录 Supabase Dashboard');
      console.log('   2. 进入 SQL Editor');
      console.log('   3. 执行 🔧创建缺失视图.sql 文件的内容');
    }

  } catch (error) {
    console.error('❌ 验证过程出错:', error);
  }
}

// 执行验证
verify();
