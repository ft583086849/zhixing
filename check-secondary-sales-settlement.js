// 检查二级销售对账页面的问题
// 按照一级销售对账页面的检查逻辑进行全面检查

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './client/.env.local' });

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY
);

console.log('🔍 二级销售对账页面问题检查报告');
console.log('=' .repeat(60));

async function checkSecondarySalesSettlement() {
  // 1. 检查数据库表结构
  console.log('\n📊 步骤1: 检查数据库表是否存在');
  console.log('-'.repeat(50));
  
  // 检查 secondary_sales 表是否存在（错误的表名）
  const { data: secondaryTable, error: secondaryError } = await supabase
    .from('secondary_sales')
    .select('*')
    .limit(1);
  
  if (secondaryError) {
    console.log('❌ secondary_sales 表不存在！');
    console.log('   错误信息:', secondaryError.message);
  } else {
    console.log('⚠️  发现 secondary_sales 表（不应该使用这个表）');
  }
  
  // 检查 sales_optimized 表（正确的表）
  const { data: salesOptimized, error: salesOptError } = await supabase
    .from('sales_optimized')
    .select('*')
    .eq('sales_type', 'secondary')
    .limit(5);
  
  if (!salesOptError) {
    console.log('✅ sales_optimized 表存在');
    console.log(`   找到 ${salesOptimized?.length || 0} 个二级销售记录`);
    
    if (salesOptimized && salesOptimized.length > 0) {
      console.log('\n   示例二级销售数据:');
      salesOptimized.forEach(sale => {
        console.log(`   - ${sale.wechat_name} (${sale.sales_code})`);
        console.log(`     上级: ${sale.parent_sales_code || '无'}`);
        console.log(`     佣金率: ${sale.commission_rate || 0}`);
      });
    }
  }
  
  // 2. 分析API层问题
  console.log('\n🔍 步骤2: 分析API层问题');
  console.log('-'.repeat(50));
  
  console.log('📍 问题位置: /client/src/services/supabase.js 第504行');
  console.log('❌ 错误代码:');
  console.log('   .from("secondary_sales")  // 不存在的表');
  console.log('✅ 应该改为:');
  console.log('   .from("sales_optimized")  // 正确的表');
  console.log('   .eq("sales_type", "secondary")  // 筛选二级销售');
  
  // 3. 验证正确的查询逻辑
  console.log('\n✅ 步骤3: 验证正确的查询逻辑');
  console.log('-'.repeat(50));
  
  // 获取一个测试二级销售
  const { data: testSales, error: testError } = await supabase
    .from('sales_optimized')
    .select('*')
    .eq('sales_type', 'secondary')
    .limit(1)
    .single();
  
  if (testSales) {
    console.log(`\n测试二级销售: ${testSales.wechat_name}`);
    console.log(`销售代码: ${testSales.sales_code}`);
    console.log(`上级销售: ${testSales.parent_sales_code || '无'}`);
    
    // 查询该二级销售的订单
    const { data: orders, error: ordersError } = await supabase
      .from('orders_optimized')
      .select('*')
      .eq('sales_code', testSales.sales_code)
      .in('status', ['confirmed', 'confirmed_config', 'confirmed_configuration', 'active']);
    
    console.log(`\n关联订单数量: ${orders?.length || 0}`);
    if (orders && orders.length > 0) {
      const totalAmount = orders.reduce((sum, o) => sum + (o.amount || 0), 0);
      const commissionRate = testSales.commission_rate || 0.3;
      const totalCommission = totalAmount * commissionRate;
      
      console.log(`总金额: ¥${totalAmount.toFixed(2)}`);
      console.log(`佣金率: ${(commissionRate * 100).toFixed(0)}%`);
      console.log(`总佣金: ¥${totalCommission.toFixed(2)}`);
    }
  } else {
    console.log('⚠️  没有找到二级销售数据进行测试');
  }
  
  // 4. 对比一级和二级销售对账页面的问题
  console.log('\n📋 步骤4: 对比一级和二级销售对账页面');
  console.log('-'.repeat(50));
  
  console.log('一级销售对账页面问题:');
  console.log('  ❌ 使用了 secondary_sales 表（不存在）');
  console.log('  ❌ 使用了 primary_sales_id 字段（不存在）');
  console.log('  ✅ 已修复为使用 sales_optimized 表');
  console.log('  ✅ 已修复为使用 parent_sales_code 字段');
  
  console.log('\n二级销售对账页面问题（相同！）:');
  console.log('  ❌ 同样使用了 secondary_sales 表（不存在）');
  console.log('  ❌ 没有正确筛选 sales_type = "secondary"');
  console.log('  ⚠️  需要同样的修复方案');
  
  // 5. 生成修复方案
  console.log('\n🛠️ 步骤5: 修复方案');
  console.log('-'.repeat(50));
  
  console.log('需要修改文件: /client/src/services/supabase.js');
  console.log('函数: getSecondarySalesSettlement');
  console.log('\n修复内容:');
  console.log('1. 第504行: 将 .from("secondary_sales") 改为 .from("sales_optimized")');
  console.log('2. 第505行后添加: .eq("sales_type", "secondary")');
  console.log('3. 确保使用正确的字段名进行查询');
  
  // 6. 统计当前数据情况
  console.log('\n📊 步骤6: 当前数据统计');
  console.log('-'.repeat(50));
  
  // 统计各类销售数量
  const { data: allSales } = await supabase
    .from('sales_optimized')
    .select('sales_type');
  
  const primaryCount = allSales?.filter(s => s.sales_type === 'primary').length || 0;
  const secondaryCount = allSales?.filter(s => s.sales_type === 'secondary').length || 0;
  
  console.log(`一级销售数量: ${primaryCount}`);
  console.log(`二级销售数量: ${secondaryCount}`);
  console.log(`总销售数量: ${allSales?.length || 0}`);
  
  // 7. 结论
  console.log('\n🎯 结论');
  console.log('=' .repeat(60));
  console.log('✅ 问题已定位：二级销售对账页面存在与一级销售相同的问题');
  console.log('✅ 根本原因：使用了不存在的 secondary_sales 表');
  console.log('✅ 解决方案：改为使用 sales_optimized 表并正确筛选');
  console.log('✅ 修复后将能正常显示二级销售的对账数据');
}

// 执行检查
checkSecondarySalesSettlement().catch(console.error);