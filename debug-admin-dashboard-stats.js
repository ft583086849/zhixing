#!/usr/bin/env node

/**
 * 🔍 管理员仪表板数据概览调试脚本
 * 诊断为什么数据概览显示为0的问题
 */

const { createClient } = require('@supabase/supabase-js');

// Supabase配置
const supabaseUrl = 'https://itvmeamoqthfqtkpubdv.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0dm1lYW1vcXRoZnF0a3B1YmR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0ODEyMzUsImV4cCI6MjA3MDA1NzIzNX0.ypBF3lJJTJtSPLEu1zWXqPorS-FDSZzRUy_0ge_Y-r0';

// 创建Supabase客户端
const supabase = createClient(supabaseUrl, supabaseAnonKey);

console.log('🔍 开始诊断管理员仪表板数据概览问题...\n');

async function diagnoseIssue() {
  try {
    // 1. 测试数据库连接
    console.log('📡 测试数据库连接...');
    const { data: testData, error: testError } = await supabase
      .from('admins')
      .select('count', { count: 'exact', head: true });
    
    if (testError) {
      console.error('❌ 数据库连接失败:', testError);
      return;
    }
    console.log('✅ 数据库连接正常\n');

    // 2. 检查订单表数据
    console.log('📊 检查订单表数据...');
    const { data: orders, error: ordersError, count: ordersCount } = await supabase
      .from('orders')
      .select('*', { count: 'exact' });
    
    if (ordersError) {
      console.error('❌ 获取订单数据失败:', ordersError);
      console.log('   可能原因: RLS策略限制或表不存在\n');
    } else {
      console.log(`✅ 订单表访问正常，共有 ${ordersCount || 0} 条记录`);
      if (orders && orders.length > 0) {
        console.log(`   最近订单: ${JSON.stringify(orders[0], null, 2).substring(0, 200)}...`);
      }
    }

    // 3. 检查RLS策略状态
    console.log('\n🔐 检查RLS（行级安全）策略...');
    const { data: rls, error: rlsError } = await supabase.rpc('check_rls_status');
    
    if (rlsError) {
      console.log('⚠️  无法直接检查RLS状态（需要特殊权限）');
      console.log('   建议: 在Supabase控制台检查orders表的RLS策略');
    } else {
      console.log('RLS状态:', rls);
    }

    // 4. 检查销售表数据
    console.log('\n👥 检查销售表数据...');
    const [primarySales, secondarySales] = await Promise.all([
      supabase.from('primary_sales').select('*', { count: 'exact' }),
      supabase.from('secondary_sales').select('*', { count: 'exact' })
    ]);

    if (primarySales.error) {
      console.error('❌ 获取一级销售数据失败:', primarySales.error);
    } else {
      console.log(`✅ 一级销售: ${primarySales.count || 0} 条记录`);
    }

    if (secondarySales.error) {
      console.error('❌ 获取二级销售数据失败:', secondarySales.error);
    } else {
      console.log(`✅ 二级销售: ${secondarySales.count || 0} 条记录`);
    }

    // 5. 尝试直接执行统计查询
    console.log('\n📈 尝试执行统计查询...');
    const today = new Date().toISOString().split('T')[0];
    
    // 获取总订单数
    const { count: totalOrders } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true });
    
    // 获取今日订单数
    const { count: todayOrders } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', today);
    
    // 获取订单状态分布
    const { data: statusData } = await supabase
      .from('orders')
      .select('status');
    
    let statusCounts = {};
    if (statusData) {
      statusData.forEach(order => {
        statusCounts[order.status] = (statusCounts[order.status] || 0) + 1;
      });
    }

    console.log('📊 统计结果:');
    console.log(`   - 总订单数: ${totalOrders || 0}`);
    console.log(`   - 今日订单: ${todayOrders || 0}`);
    console.log(`   - 状态分布:`, statusCounts);

    // 6. 诊断总结
    console.log('\n\n🎯 诊断总结:');
    console.log('='.repeat(50));
    
    if (!orders || orders.length === 0) {
      console.log('⚠️  问题: 订单表中没有数据');
      console.log('   解决方案:');
      console.log('   1. 创建测试订单数据');
      console.log('   2. 或等待实际订单产生');
    } else if (ordersError) {
      console.log('⚠️  问题: 无法访问订单数据');
      console.log('   可能原因:');
      console.log('   1. RLS策略限制了anon角色的访问');
      console.log('   2. 需要以authenticated用户身份访问');
      console.log('   解决方案:');
      console.log('   1. 检查Supabase控制台的RLS策略设置');
      console.log('   2. 确保管理员登录后使用正确的认证token');
    } else {
      console.log('✅ 数据访问正常，但可能存在前端显示问题');
      console.log('   建议:');
      console.log('   1. 检查浏览器控制台错误');
      console.log('   2. 清除浏览器缓存');
      console.log('   3. 检查Redux状态是否正确更新');
    }

    // 7. 创建测试数据（可选）
    console.log('\n\n💡 是否需要创建测试数据？');
    console.log('   如需创建测试数据，请运行: node create-test-order.js');

  } catch (error) {
    console.error('\n❌ 诊断过程出错:', error);
  }
}

// 运行诊断
diagnoseIssue().then(() => {
  console.log('\n✅ 诊断完成');
  process.exit(0);
}).catch(error => {
  console.error('❌ 诊断失败:', error);
  process.exit(1);
});
