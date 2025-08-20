#!/usr/bin/env node

/**
 * 测试API层面的排除功能
 * 验证前端API是否正确应用了排除过滤
 */

console.log('🔍 测试API层面的排除功能\n');

console.log('请在管理后台页面的浏览器控制台执行以下代码:\n');

const apiTestCode = `
// 测试API层面的排除功能
async function testAPIExclusion() {
  console.log('🔍 测试API层面的排除功能...');
  
  try {
    const module = await import('/src/services/api.js');
    const AdminAPI = module.AdminAPI;
    const ExcludedSalesService = (await import('/src/services/excludedSalesService.js')).default;
    
    // 1. 先清空排除名单
    console.log('\\n1️⃣ 清空排除名单:');
    const supabase = (await import('/src/services/supabase.js')).supabase;
    await supabase
      .from('excluded_sales_config')
      .update({ is_active: false })
      .neq('id', '00000000-0000-0000-0000-000000000000');
    console.log('   ✅ 所有排除记录已设为不激活');
    
    // 2. 获取排除前的统计
    console.log('\\n2️⃣ 获取排除前的统计:');
    const beforeStats = await AdminAPI.getStats({ timeRange: 'all' });
    console.log('   排除前:');
    console.log('   • total_orders:', beforeStats.total_orders);
    console.log('   • total_amount:', beforeStats.total_amount);
    console.log('   • total_commission:', beforeStats.total_commission);
    console.log('   • pending_commission:', beforeStats.pending_commission);
    console.log('   • total_sales:', beforeStats.total_sales);
    
    // 3. 添加wangming到排除名单
    console.log('\\n3️⃣ 添加wangming到排除名单:');
    
    // 获取wangming的sales_code
    const { data: wangmingSales } = await supabase
      .from('sales_optimized')
      .select('sales_code')
      .eq('wechat_name', 'wangming')
      .single();
    
    if (!wangmingSales) {
      console.log('   ❌ 找不到wangming');
      return;
    }
    
    // 激活已有的记录或创建新记录
    const { data: existingRecord } = await supabase
      .from('excluded_sales_config')
      .select('id')
      .eq('wechat_name', 'wangming')
      .eq('sales_code', wangmingSales.sales_code)
      .single();
    
    if (existingRecord) {
      await supabase
        .from('excluded_sales_config')
        .update({ is_active: true })
        .eq('id', existingRecord.id);
      console.log('   ✅ 激活已有记录');
    } else {
      await ExcludedSalesService.addExcludedSales({
        wechat_name: 'wangming',
        sales_code: wangmingSales.sales_code,
        reason: 'API测试',
        excluded_by: 'API测试'
      });
      console.log('   ✅ 创建新排除记录');
    }
    
    // 4. 验证排除名单
    console.log('\\n4️⃣ 验证排除名单:');
    const excludedCodes = await ExcludedSalesService.getExcludedSalesCodes();
    console.log('   排除的sales_code:', excludedCodes);
    
    if (!excludedCodes.includes(wangmingSales.sales_code)) {
      console.log('   ❌ wangming未在排除名单中');
      return;
    }
    console.log('   ✅ wangming已在排除名单中');
    
    // 5. 获取排除后的统计
    console.log('\\n5️⃣ 获取排除后的统计:');
    const afterStats = await AdminAPI.getStats({ timeRange: 'all' });
    console.log('   排除后:');
    console.log('   • total_orders:', afterStats.total_orders);
    console.log('   • total_amount:', afterStats.total_amount);
    console.log('   • total_commission:', afterStats.total_commission);
    console.log('   • pending_commission:', afterStats.pending_commission);
    console.log('   • total_sales:', afterStats.total_sales);
    
    // 6. 对比分析
    console.log('\\n6️⃣ 对比分析:');
    const changes = {
      total_orders: beforeStats.total_orders - afterStats.total_orders,
      total_amount: beforeStats.total_amount - afterStats.total_amount,
      total_commission: beforeStats.total_commission - afterStats.total_commission,
      pending_commission: beforeStats.pending_commission - afterStats.pending_commission,
      total_sales: beforeStats.total_sales - afterStats.total_sales
    };
    
    console.log('   变化量:');
    Object.entries(changes).forEach(([key, value]) => {
      console.log(\`   • \${key}: \${value}\`);
      if (value > 0) {
        console.log(\`     ✅ 有变化，排除生效\`);
      } else if (key !== 'pending_commission') {
        console.log(\`     ❌ 无变化，可能未生效\`);
      }
    });
    
    // 7. 测试其他API
    console.log('\\n7️⃣ 测试其他API方法:');
    
    // 测试getSalesConversionStats
    const beforeConversion = await AdminAPI.getSalesConversionStats({ skipExclusion: true });
    const afterConversion = await AdminAPI.getSalesConversionStats({});
    console.log(\`   转化率统计: \${beforeConversion.length} → \${afterConversion.length} 条\`);
    if (beforeConversion.length > afterConversion.length) {
      console.log('   ✅ 转化率统计排除生效');
    }
    
    // 测试getTopSales
    const beforeTop = await AdminAPI.getTopSales({ skipExclusion: true });
    const afterTop = await AdminAPI.getTopSales({});
    const wangmingInBefore = beforeTop.some(s => s.wechat_name === 'wangming');
    const wangmingInAfter = afterTop.some(s => s.wechat_name === 'wangming');
    
    if (wangmingInBefore && !wangmingInAfter) {
      console.log('   ✅ Top销售排行榜排除生效');
    } else if (!wangmingInBefore) {
      console.log('   ⚠️ wangming不在Top销售中');
    } else {
      console.log('   ❌ Top销售排行榜排除未生效');
    }
    
    // 8. 清理测试数据
    console.log('\\n8️⃣ 清理测试数据:');
    await supabase
      .from('excluded_sales_config')
      .update({ is_active: false })
      .eq('wechat_name', 'wangming');
    console.log('   ✅ 已清理测试数据');
    
    // 9. 总结
    console.log('\\n🎯 API层面排除功能测试总结:');
    const hasChanges = Object.values(changes).some(v => v > 0);
    if (hasChanges) {
      console.log('   ✅ API排除功能正常工作');
      console.log('   管理员看到的统计数据已排除wangming');
    } else {
      console.log('   ❌ API排除功能可能未生效');
      console.log('   需要检查API实现');
    }
    
  } catch (error) {
    console.error('❌ 测试失败:', error);
  }
}

// 执行测试
testAPIExclusion();
`;

console.log(apiTestCode);

console.log('\n📋 测试说明:');
console.log('1. 这个脚本会测试前端API是否正确应用了排除过滤');
console.log('2. 会对比排除前后的各项统计数据');
console.log('3. 验证getStats、getSalesConversionStats、getTopSales等方法');
console.log('4. 确认管理员看到的数据确实排除了wangming');

console.log('\n🎯 预期结果:');
console.log('• 所有统计数据应该减少（订单数、金额、佣金等）');
console.log('• wangming不应该出现在Top销售排行榜中');
console.log('• 转化率统计应该排除wangming的数据');