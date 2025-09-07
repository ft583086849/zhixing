/**
 * 直接修复排除销售逻辑
 * 删除PRI17554350234757516的所有排除记录
 */

// 引入项目现有配置
const { supabase } = require('./src/services/supabase.js');

async function fixExcludedSalesLogic() {
  console.log('🔧 开始修复排除销售逻辑问题...');
  
  try {
    // 1. 查看当前排除记录
    console.log('\n1. 查看当前排除记录:');
    const { data: current, error: selectError } = await supabase
      .from('excluded_sales_config')
      .select('*')
      .eq('sales_code', 'PRI17554350234757516');
    
    if (selectError) {
      console.error('❌ 查询失败:', selectError);
      return;
    }
    
    console.log(`📋 找到 ${current?.length || 0} 条排除记录:`, current);
    
    // 2. 删除所有相关记录
    console.log('\n2. 删除排除记录...');
    const { data: deleted, error: deleteError } = await supabase
      .from('excluded_sales_config')
      .delete()
      .eq('sales_code', 'PRI17554350234757516')
      .select();
    
    if (deleteError) {
      console.error('❌ 删除失败:', deleteError);
      return;
    }
    
    console.log(`✅ 成功删除 ${deleted?.length || 0} 条记录`);
    
    // 3. 验证删除结果
    console.log('\n3. 验证删除结果...');
    const { data: afterDelete, error: verifyError } = await supabase
      .from('excluded_sales_config')
      .select('*')
      .eq('sales_code', 'PRI17554350234757516');
    
    if (verifyError) {
      console.error('❌ 验证失败:', verifyError);
      return;
    }
    
    if (afterDelete && afterDelete.length === 0) {
      console.log('✅ 验证成功：PRI17554350234757516 已完全从排除列表中移除');
    } else {
      console.log('⚠️ 警告：仍有残留记录:', afterDelete);
    }
    
    // 4. 测试订单可见性
    console.log('\n4. 测试订单可见性...');
    const { data: orders, error: ordersError } = await supabase
      .from('orders_optimized')
      .select('order_id, amount, status, created_at')
      .eq('sales_code', 'PRI17554350234757516')
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (ordersError) {
      console.error('❌ 查询订单失败:', ordersError);
      return;
    }
    
    console.log(`📊 该销售的订单数量: ${orders?.length || 0}`);
    if (orders && orders.length > 0) {
      console.log('最新订单:', orders.slice(0, 3));
    }
    
    console.log('\n🎉 双层排除机制第一步完成！');
    console.log('📝 修复内容:');
    console.log('  ✅ 删除了PRI17554350234757516的所有排除记录');
    console.log('  ✅ 现在该销售的订单将正常显示在管理后台');
    console.log('  ⏳ 下一步：实现永久统计排除机制');
    
  } catch (error) {
    console.error('💥 修复过程异常:', error);
  }
}

// 执行修复
fixExcludedSalesLogic();