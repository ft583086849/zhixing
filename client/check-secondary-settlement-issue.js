// 在浏览器控制台运行，检查二级销售对账页面问题
console.log('🔍 二级销售对账页面问题检查（基于一级销售问题）\n');
console.log('=' .repeat(60));

async function checkSecondarySettlement() {
  const supabase = window.supabaseClient;
  if (!supabase) {
    console.error('❌ 未找到supabase客户端');
    return;
  }
  
  console.log('📊 步骤1: 检查数据库表结构');
  console.log('-'.repeat(50));
  
  // 1. 检查错误的表名 secondary_sales
  console.log('\n尝试查询 secondary_sales 表（API中使用的错误表名）...');
  const { data: secondaryTable, error: secondaryError } = await supabase
    .from('secondary_sales')
    .select('*')
    .limit(1);
  
  if (secondaryError) {
    console.log('❌ secondary_sales 表不存在！');
    console.log('   错误:', secondaryError.message);
    console.log('   这就是问题的根源！API试图查询不存在的表');
  } else {
    console.log('⚠️ 意外：secondary_sales 表存在');
  }
  
  // 2. 检查正确的表 sales_optimized
  console.log('\n检查正确的表 sales_optimized...');
  const { data: salesOptimized, error: salesOptError } = await supabase
    .from('sales_optimized')
    .select('*')
    .eq('sales_type', 'secondary')
    .limit(5);
  
  if (!salesOptError) {
    console.log('✅ sales_optimized 表存在');
    console.log(`   找到 ${salesOptimized?.length || 0} 个二级销售`);
    
    if (salesOptimized && salesOptimized.length > 0) {
      console.log('\n   二级销售示例:');
      salesOptimized.forEach(sale => {
        console.log(`   - ${sale.wechat_name} (${sale.sales_code})`);
        console.log(`     上级: ${sale.parent_sales_code || '无'}`);
        console.log(`     佣金率: ${(sale.commission_rate * 100).toFixed(0)}%`);
      });
    }
  }
  
  // 3. 分析问题
  console.log('\n\n🔍 步骤2: 问题分析');
  console.log('-'.repeat(50));
  console.log('📍 错误位置: /client/src/services/supabase.js');
  console.log('   函数: getSecondarySalesSettlement (第500行)');
  console.log('\n❌ 当前错误代码:');
  console.log('   let salesQuery = supabase');
  console.log('     .from("secondary_sales")  // ← 错误！不存在的表');
  console.log('     .select("*");');
  console.log('\n✅ 应该修改为:');
  console.log('   let salesQuery = supabase');
  console.log('     .from("sales_optimized")  // ← 正确的表');
  console.log('     .select("*")');
  console.log('     .eq("sales_type", "secondary");  // ← 筛选二级销售');
  
  // 4. 验证修复方案
  console.log('\n\n✅ 步骤3: 验证修复方案');
  console.log('-'.repeat(50));
  
  // 模拟修复后的查询
  console.log('使用正确的查询方式测试...');
  const testWechat = salesOptimized?.[0]?.wechat_name;
  
  if (testWechat) {
    const { data: testSale, error: testError } = await supabase
      .from('sales_optimized')
      .select('*')
      .eq('wechat_name', testWechat)
      .eq('sales_type', 'secondary')
      .single();
    
    if (testSale) {
      console.log(`✅ 成功查询到二级销售: ${testSale.wechat_name}`);
      
      // 查询订单
      const { data: orders } = await supabase
        .from('orders_optimized')
        .select('*')
        .eq('sales_code', testSale.sales_code)
        .in('status', ['confirmed', 'confirmed_config', 'active']);
      
      const totalAmount = orders?.reduce((sum, o) => sum + (o.amount || 0), 0) || 0;
      const commission = totalAmount * (testSale.commission_rate || 0.3);
      
      console.log(`   关联订单: ${orders?.length || 0} 个`);
      console.log(`   总金额: ¥${totalAmount.toFixed(2)}`);
      console.log(`   预计佣金: ¥${commission.toFixed(2)}`);
    }
  }
  
  // 5. 对比两个页面的问题
  console.log('\n\n📋 步骤4: 问题对比');
  console.log('-'.repeat(50));
  console.log('┌─────────────────────┬───────────────────────────────────┐');
  console.log('│     页面            │            问题                    │');
  console.log('├─────────────────────┼───────────────────────────────────┤');
  console.log('│ 一级销售对账        │ ❌ 使用 secondary_sales 表        │');
  console.log('│                     │ ❌ 使用 primary_sales_id 字段     │');
  console.log('│                     │ ✅ 已修复                         │');
  console.log('├─────────────────────┼───────────────────────────────────┤');
  console.log('│ 二级销售对账        │ ❌ 同样使用 secondary_sales 表    │');
  console.log('│                     │ ❌ 没有筛选 sales_type            │');
  console.log('│                     │ ⚠️ 需要修复                       │');
  console.log('└─────────────────────┴───────────────────────────────────┘');
  
  // 6. 总结
  console.log('\n\n🎯 结论');
  console.log('=' .repeat(60));
  console.log('✅ 问题已确认：二级销售对账页面存在相同的表名错误');
  console.log('✅ 根本原因：使用了不存在的 secondary_sales 表');
  console.log('✅ 修复方案：');
  console.log('   1. 修改表名为 sales_optimized');
  console.log('   2. 添加 sales_type = "secondary" 筛选条件');
  console.log('   3. 确保所有字段名与实际表结构一致');
  console.log('\n💡 建议：立即修复，否则二级销售无法查看对账信息');
}

// 执行检查
checkSecondarySettlement().catch(console.error);
console.log('\n请在浏览器控制台运行此脚本进行检查');