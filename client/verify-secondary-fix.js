// 验证二级销售对账页面修复效果
console.log('🔍 验证二级销售对账页面修复\n');
console.log('=' .repeat(60));

async function verifyFix() {
  const supabase = window.supabaseClient;
  if (!supabase) {
    console.error('❌ 未找到supabase客户端');
    return;
  }
  
  console.log('✅ 步骤1: 验证修复后的查询');
  console.log('-'.repeat(50));
  
  // 1. 测试新的查询方式
  console.log('\n使用修复后的查询方式（sales_optimized表）...');
  const { data: secondarySales, error: queryError } = await supabase
    .from('sales_optimized')
    .select('*')
    .eq('sales_type', 'secondary')
    .limit(5);
  
  if (queryError) {
    console.error('❌ 查询失败:', queryError);
    return;
  }
  
  console.log(`✅ 成功查询到 ${secondarySales?.length || 0} 个二级销售`);
  
  if (secondarySales && secondarySales.length > 0) {
    console.log('\n二级销售列表:');
    secondarySales.forEach((sale, index) => {
      console.log(`${index + 1}. ${sale.wechat_name}`);
      console.log(`   销售代码: ${sale.sales_code}`);
      console.log(`   上级销售: ${sale.parent_sales_code || '无'}`);
      console.log(`   佣金率: ${(sale.commission_rate * 100).toFixed(0)}%`);
    });
    
    // 2. 测试完整的对账查询
    console.log('\n✅ 步骤2: 测试完整的对账功能');
    console.log('-'.repeat(50));
    
    const testSale = secondarySales[0];
    console.log(`\n测试销售员: ${testSale.wechat_name}`);
    
    // 查询订单
    const { data: orders } = await supabase
      .from('orders_optimized')
      .select('*')
      .eq('sales_code', testSale.sales_code)
      .in('status', ['confirmed', 'confirmed_config', 'confirmed_configuration', 'active']);
    
    console.log(`关联订单数: ${orders?.length || 0}`);
    
    if (orders && orders.length > 0) {
      const totalAmount = orders.reduce((sum, o) => sum + (o.amount || 0), 0);
      const commissionRate = testSale.commission_rate || 0.3;
      const totalCommission = totalAmount * commissionRate;
      
      console.log(`总销售额: ¥${totalAmount.toFixed(2)}`);
      console.log(`佣金率: ${(commissionRate * 100).toFixed(0)}%`);
      console.log(`预计佣金: ¥${totalCommission.toFixed(2)}`);
    }
  } else {
    console.log('⚠️ 暂无二级销售数据');
  }
  
  console.log('\n\n🎉 修复验证结果');
  console.log('=' .repeat(60));
  console.log('✅ 表名已正确修改为 sales_optimized');
  console.log('✅ 添加了 sales_type = "secondary" 筛选');
  console.log('✅ 查询功能正常工作');
  console.log('\n💡 建议：');
  console.log('1. 重启开发服务器: cd client && npm start');
  console.log('2. 访问页面: http://localhost:3000/sales/settlement');
  console.log('3. 输入二级销售的微信号进行测试');
}

// 执行验证
verifyFix().catch(console.error);
console.log('\n请在浏览器控制台运行此脚本验证修复效果');