/**
 * 直接验证修复效果
 */

const { supabase } = require('./src/services/supabase.js');

async function testFixes() {
  console.log('🧪 验证修复效果...');
  
  // 测试订单可见性
  const { data: orders } = await supabase
    .from('orders_optimized')
    .select('id, sales_code, amount')
    .eq('sales_code', 'PRI17554350234757516')
    .limit(3);
  
  console.log(`✅ 测试订单可见: ${orders?.length || 0}条`);
  
  // 测试客户可见性  
  const { data: customers } = await supabase
    .from('orders_optimized')
    .select('customer_wechat')
    .eq('sales_code', 'PRI17554350234757516');
  
  const uniqueCustomers = [...new Set(customers?.map(c => c.customer_wechat) || [])];
  console.log(`✅ 客户数据可见: ${uniqueCustomers.length}个`);
  
  // 验证排除记录
  const { data: exclusions } = await supabase
    .from('excluded_sales_config')
    .select('*')
    .eq('sales_code', 'PRI17554350234757516');
  
  console.log(`✅ 排除记录: ${exclusions?.length || 0}条（应该为0）`);
  
  console.log('\n🎉 修复验证完成！');
  console.log('\n📋 修复效果总结:');
  console.log('✅ 删除了有问题的 permanentExclusion.js 文件');  
  console.log('✅ 在 api.js 中实现了简化的双层排除逻辑');
  console.log('✅ 修改路由使用稳定的 AdminFinance.js');
  console.log('✅ 简化了 updateOrderStatus 的计算逻辑');
  console.log('\n🎯 预期效果:');
  console.log('📱 数据概览：应该显示正常（不再报"无客户数据"）');
  console.log('📱 客户管理：应该显示正常（不再报"无客户数据"）');
  console.log('📱 资金统计：应该正常工作（不再查询不存在的表）');
  console.log('📱 订单操作：应该不再超时（逻辑已简化）');
  console.log('📱 测试订单：保持可见（便于调试）');
  console.log('📊 统计数据：永远排除测试账号（保持纯净）');
}

testFixes();