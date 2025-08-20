/**
 * 手动测试AdminOverview页面
 * 使用API直接验证新统计功能
 */

const { createClient } = require('@supabase/supabase-js');

// Supabase配置
const supabaseUrl = 'https://itvmeamoqthfqtkpubdv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0dm1lYW1vcXRoZnF0a3B1YmR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0ODEyMzUsImV4cCI6MjA3MDA1NzIzNX0.ypBF3lJJTJtSPLEu1zWXqPorS-FDSZzRUy_0ge_Y-r0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testAdminOverview() {
  console.log('🚀 开始测试AdminOverview统计功能...\n');
  
  try {
    // 1. 测试管理员登录
    console.log('1️⃣ 验证管理员账户...');
    const { data: admin, error: adminError } = await supabase
      .from('admins')
      .select('*')
      .eq('username', 'admin')
      .single();
    
    if (adminError) {
      console.error('❌ 无法获取管理员信息:', adminError.message);
      return;
    }
    
    console.log('✅ 管理员账户存在:', admin.username);
    
    // 2. 检查overview_stats表
    console.log('\n2️⃣ 检查overview_stats表...');
    const { data: stats, error: statsError } = await supabase
      .from('overview_stats')
      .select('*')
      .eq('stat_type', 'realtime')
      .eq('stat_period', 'all')
      .single();
    
    if (statsError) {
      console.error('❌ 无法读取overview_stats表:', statsError.message);
      console.log('💡 提示: 请确保已执行SQL脚本创建表');
      return;
    }
    
    console.log('✅ overview_stats表存在并可访问');
    console.log('📊 当前统计数据:');
    console.log(`   - 总订单数: ${stats.total_orders || 0}`);
    console.log(`   - 总金额: $${stats.total_amount || 0}`);
    console.log(`   - 总佣金: $${stats.total_commission || 0}`);
    console.log(`   - 最后更新: ${stats.last_calculated_at}`);
    
    // 3. 测试新旧查询方式的性能对比
    console.log('\n3️⃣ 性能对比测试...');
    
    // 测试新方式（从统计表读取）
    console.log('\n📊 新方式（从统计表读取）:');
    const startNew = Date.now();
    const { data: newStats, error: newError } = await supabase
      .from('overview_stats')
      .select('*')
      .eq('stat_type', 'realtime');
    const endNew = Date.now();
    
    if (!newError) {
      console.log(`   ✅ 查询成功，耗时: ${endNew - startNew}ms`);
      console.log(`   📈 返回 ${newStats.length} 条记录`);
    } else {
      console.log(`   ❌ 查询失败: ${newError.message}`);
    }
    
    // 测试旧方式（实时查询）
    console.log('\n📊 旧方式（实时JOIN查询）:');
    const startOld = Date.now();
    
    // 模拟旧的复杂查询
    const { count: orderCount } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true });
    
    const { count: salesCount } = await supabase
      .from('sales')
      .select('*', { count: 'exact', head: true });
    
    const endOld = Date.now();
    console.log(`   ✅ 查询成功，耗时: ${endOld - startOld}ms`);
    console.log(`   📈 订单数: ${orderCount}, 销售数: ${salesCount}`);
    
    // 性能对比
    console.log('\n⚡ 性能提升:');
    const improvement = ((endOld - startOld) - (endNew - startNew)) / (endOld - startOld) * 100;
    if (improvement > 0) {
      console.log(`   ✅ 新方式快 ${improvement.toFixed(1)}%`);
    } else {
      console.log(`   ⚠️ 新方式慢 ${Math.abs(improvement).toFixed(1)}%`);
    }
    
    // 4. 检查环境变量配置
    console.log('\n4️⃣ 环境变量配置检查...');
    console.log('   REACT_APP_ENABLE_NEW_STATS 应设置为: true');
    console.log('   当前文件位置: client/.env');
    
    // 5. 提供手动测试步骤
    console.log('\n📝 手动测试步骤:');
    console.log('1. 访问: http://localhost:3000/admin');
    console.log('2. 登录账号: admin / 123456');
    console.log('3. 进入数据概览页面');
    console.log('4. 打开浏览器控制台 (F12)');
    console.log('5. 查看是否有 "📊 使用新的统计方式" 的日志');
    console.log('6. 观察页面加载速度是否有提升');
    
    // 6. 触发一次数据更新
    console.log('\n5️⃣ 触发数据更新...');
    const { error: updateError } = await supabase
      .from('overview_stats')
      .update({ 
        last_calculated_at: new Date().toISOString(),
        calculation_duration_ms: endNew - startNew
      })
      .eq('stat_type', 'realtime')
      .eq('stat_period', 'all');
    
    if (!updateError) {
      console.log('✅ 统计数据已更新');
    } else {
      console.log('⚠️ 更新失败:', updateError.message);
    }
    
    console.log('\n✨ 测试完成！');
    console.log('\n💡 下一步建议:');
    console.log('1. 手动访问管理后台验证功能');
    console.log('2. 监控实际加载性能');
    console.log('3. 确认数据准确性');
    
  } catch (error) {
    console.error('❌ 测试失败:', error);
  }
}

// 执行测试
testAdminOverview();