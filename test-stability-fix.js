// 测试数据稳定性修复是否成功
console.log('🧪 测试数据稳定性修复结果...\n');

async function testStabilityFix() {
  const testParams = {
    wechat_name: 'WML792355703',
    sales_code: 'PRI17547241780648255'
  };
  
  console.log('📊 开始连续测试...');
  console.log('=' .repeat(50));
  
  const results = [];
  const testCount = 5;
  
  for (let i = 0; i < testCount; i++) {
    console.log(`\n🔍 第${i + 1}次测试:`);
    
    try {
      // 1. 直接查询数据库作为基准
      let dbData = null;
      if (window.supabaseClient) {
        const { data, error } = await window.supabaseClient
          .from('sales_optimized')
          .select('total_commission, direct_commission, secondary_avg_rate, secondary_share_commission, secondary_orders_amount')
          .eq('sales_code', testParams.sales_code)
          .single();
        
        if (!error) {
          dbData = data;
          console.log('📊 数据库数据:', dbData);
        }
      }
      
      // 2. 调用修复后的API
      if (window.SupabaseService) {
        const response = await window.SupabaseService.getPrimarySalesSettlement(testParams);
        
        if (response && response.data && response.data.sales) {
          const apiData = response.data.sales;
          
          console.log('📡 API返回数据:');
          console.log(`  direct_commission: ${apiData.direct_commission}`);
          console.log(`  secondary_avg_rate: ${apiData.secondary_avg_rate}`);
          console.log(`  secondary_share_commission: ${apiData.secondary_share_commission}`);
          console.log(`  secondary_orders_amount: ${apiData.secondary_orders_amount}`);
          
          // 记录测试结果
          const result = {
            test: i + 1,
            time: new Date().toLocaleTimeString(),
            success: true,
            dbData: dbData,
            apiData: {
              direct_commission: apiData.direct_commission,
              secondary_avg_rate: apiData.secondary_avg_rate,
              secondary_share_commission: apiData.secondary_share_commission,
              secondary_orders_amount: apiData.secondary_orders_amount
            },
            isConsistent: dbData ? (
              dbData.direct_commission === apiData.direct_commission &&
              dbData.secondary_avg_rate === apiData.secondary_avg_rate &&
              dbData.secondary_share_commission === apiData.secondary_share_commission &&
              dbData.secondary_orders_amount === apiData.secondary_orders_amount
            ) : true
          };
          
          results.push(result);
          
          if (result.isConsistent) {
            console.log('✅ 数据一致');
          } else {
            console.log('❌ 数据不一致');
          }
        } else {
          console.log('❌ API返回格式异常');
          results.push({
            test: i + 1,
            success: false,
            error: 'API返回格式异常'
          });
        }
      }
      
    } catch (error) {
      console.error(`❌ 第${i + 1}次测试失败:`, error.message);
      results.push({
        test: i + 1,
        success: false,
        error: error.message
      });
    }
    
    // 等待1秒
    if (i < testCount - 1) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  // 分析结果
  console.log('\n📊 测试结果分析:');
  console.log('=' .repeat(50));
  
  const successTests = results.filter(r => r.success);
  const failedTests = results.filter(r => !r.success);
  const consistentTests = results.filter(r => r.success && r.isConsistent);
  
  console.log(`✅ 成功测试: ${successTests.length}/${testCount}`);
  console.log(`✅ 数据一致: ${consistentTests.length}/${testCount}`);
  console.log(`❌ 失败测试: ${failedTests.length}/${testCount}`);
  
  if (successTests.length > 0) {
    console.log('\n📈 数据稳定性检查:');
    
    // 检查所有成功测试中的数据是否一致
    const firstSuccess = successTests[0];
    let allConsistent = true;
    
    for (let i = 1; i < successTests.length; i++) {
      const current = successTests[i];
      if (current.apiData.direct_commission !== firstSuccess.apiData.direct_commission ||
          current.apiData.secondary_avg_rate !== firstSuccess.apiData.secondary_avg_rate ||
          current.apiData.secondary_share_commission !== firstSuccess.apiData.secondary_share_commission ||
          current.apiData.secondary_orders_amount !== firstSuccess.apiData.secondary_orders_amount) {
        allConsistent = false;
        console.log(`❌ 第${current.test}次与第1次数据不一致`);
        break;
      }
    }
    
    if (allConsistent) {
      console.log('✅ 所有测试数据完全一致！修复成功！');
      console.log('\n💰 稳定的数据值:');
      console.log(`  一级销售佣金额: ${firstSuccess.apiData.direct_commission}`);
      console.log(`  平均二级佣金率: ${firstSuccess.apiData.secondary_avg_rate}%`);
      console.log(`  二级佣金收益额: ${firstSuccess.apiData.secondary_share_commission}`);
      console.log(`  二级销售订单总额: ${firstSuccess.apiData.secondary_orders_amount}`);
    } else {
      console.log('❌ 数据仍然不稳定，需要进一步检查');
    }
  }
  
  // 如果有失败的测试，显示详情
  if (failedTests.length > 0) {
    console.log('\n❌ 失败测试详情:');
    failedTests.forEach(test => {
      console.log(`  第${test.test}次: ${test.error}`);
    });
  }
  
  // 提供下一步建议
  console.log('\n💡 下一步建议:');
  console.log('=' .repeat(50));
  
  if (allConsistent && successTests.length === testCount) {
    console.log('🎉 修复完全成功！数据稳定性问题已解决');
    console.log('✅ 可以正常使用一级销售对账页面了');
  } else if (successTests.length > failedTests.length) {
    console.log('🔄 部分修复成功，但仍有不稳定因素');
    console.log('🔧 建议检查网络连接和Supabase服务状态');
  } else {
    console.log('❌ 修复效果不明显，需要深入检查');
    console.log('🔧 建议检查代码修改是否生效，是否需要重启服务');
  }
}

// 执行测试
testStabilityFix().catch(console.error);

console.log('\n💡 提示: 请确保在一级销售对账页面运行此脚本');
console.log('💡 如果数据仍然不稳定，可能需要清除缓存并刷新页面');