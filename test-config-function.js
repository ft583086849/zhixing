/**
 * 测试配置确认功能
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://itvmeamoqthfqtkpubdv.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0dm1lYW1vcXRoZnF0a3B1YmR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0ODEyMzUsImV4cCI6MjA3MDA1NzIzNX0.ypBF3lJJTJtSPLEu1zWXqPorS-FDSZzRUy_0ge_Y-r0';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testConfigFunction() {
  console.log('========================================');
  console.log('测试配置确认功能');
  console.log(`时间: ${new Date().toLocaleString('zh-CN')}`);
  console.log('========================================\n');

  try {
    // 1. 获取一个待审批订单
    console.log('【1. 获取待审批订单】');
    const { data: pendingOrders, error: fetchError } = await supabase
      .from('orders_optimized')
      .select('id, tradingview_username, status, config_time')
      .eq('status', 'pending')
      .limit(1);
    
    if (fetchError) {
      console.error('❌ 获取订单失败:', fetchError.message);
      return;
    }
    
    if (!pendingOrders || pendingOrders.length === 0) {
      console.log('没有待审批订单可以测试');
      return;
    }
    
    const testOrder = pendingOrders[0];
    console.log(`找到测试订单: ID ${testOrder.id}, 用户: ${testOrder.tradingview_username}`);
    console.log(`当前状态: ${testOrder.status}`);
    console.log(`配置时间: ${testOrder.config_time || '空'}`);
    
    // 2. 模拟配置确认操作
    console.log('\n【2. 模拟配置确认】');
    console.log('更新订单状态为 confirmed_config...');
    
    const { data: updateResult, error: updateError } = await supabase
      .from('orders_optimized')
      .update({
        status: 'confirmed_config',
        config_time: new Date().toISOString()
      })
      .eq('id', testOrder.id)
      .select();
    
    if (updateError) {
      console.error('❌ 更新失败:', updateError.message);
      
      // 分析错误原因
      if (updateError.message.includes('config_time')) {
        console.log('\n问题诊断：');
        console.log('- config_time字段可能有问题');
        console.log('- 请确认字段类型是否正确');
      }
      return;
    }
    
    console.log('✅ 更新成功！');
    
    // 3. 验证更新结果
    console.log('\n【3. 验证更新结果】');
    const { data: verifyData, error: verifyError } = await supabase
      .from('orders_optimized')
      .select('id, status, config_time')
      .eq('id', testOrder.id)
      .single();
    
    if (verifyData) {
      console.log(`订单ID: ${verifyData.id}`);
      console.log(`新状态: ${verifyData.status}`);
      console.log(`配置时间: ${verifyData.config_time ? new Date(verifyData.config_time).toLocaleString('zh-CN') : '空'}`);
      
      if (verifyData.status === 'confirmed_config' && verifyData.config_time) {
        console.log('\n✅✅✅ 配置确认功能正常工作！');
      } else {
        console.log('\n⚠️ 功能部分正常，但可能有问题');
      }
    }
    
    // 4. 恢复测试数据（可选）
    console.log('\n【4. 恢复测试数据】');
    console.log('是否要恢复订单到pending状态？（用于继续测试）');
    
    // 如果需要恢复，取消下面的注释
    /*
    const { error: restoreError } = await supabase
      .from('orders_optimized')
      .update({
        status: 'pending',
        config_time: null
      })
      .eq('id', testOrder.id);
    
    if (!restoreError) {
      console.log('✅ 已恢复到pending状态');
    }
    */
    
  } catch (error) {
    console.error('测试过程出错:', error);
  }
  
  // 5. 统计当前订单状态
  console.log('\n【5. 当前订单状态统计】');
  const { data: stats } = await supabase
    .from('orders_optimized')
    .select('status');
  
  const statusCount = {};
  stats?.forEach(row => {
    statusCount[row.status] = (statusCount[row.status] || 0) + 1;
  });
  
  Object.entries(statusCount).forEach(([status, count]) => {
    console.log(`${status}: ${count} 个`);
  });
}

// 执行测试
testConfigFunction().then(() => {
  console.log('\n测试完成！');
  console.log('如果功能正常，可以在页面上操作其他待审批订单。');
});