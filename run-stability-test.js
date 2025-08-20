// 一键测试数据稳定性修复效果
console.log('🔧 一键测试数据稳定性修复效果\n');
console.log('=' .repeat(60));

async function runStabilityTest() {
  const testParams = {
    wechat_name: 'WML792355703', 
    sales_code: 'PRI17547241780648255'
  };
  
  console.log('📋 测试计划:');
  console.log('1. 验证数据库源数据');
  console.log('2. 测试API稳定性（连续5次调用）');
  console.log('3. 检查Redux状态一致性'); 
  console.log('4. 验证页面显示效果');
  console.log('');
  
  let testResults = {
    database: null,
    apiCalls: [],
    redux: null,
    summary: {
      success: 0,
      failed: 0,
      consistent: true
    }
  };
  
  // 1. 验证数据库源数据
  console.log('📊 步骤1: 验证数据库源数据');
  console.log('-'.repeat(40));
  
  if (window.supabaseClient) {
    try {
      const { data: dbData, error } = await window.supabaseClient
        .from('sales_optimized')
        .select('total_commission, direct_commission, secondary_avg_rate, secondary_share_commission, secondary_orders_amount, month_commission, today_commission')
        .eq('sales_code', testParams.sales_code)
        .single();
      
      if (!error && dbData) {
        testResults.database = dbData;
        console.log('✅ 数据库数据获取成功:');
        console.log(`   总佣金: ${dbData.total_commission}`);
        console.log(`   一级销售佣金: ${dbData.direct_commission}`);
        console.log(`   平均二级佣金率: ${dbData.secondary_avg_rate}`);
        console.log(`   二级佣金收益: ${dbData.secondary_share_commission}`);
        console.log(`   二级订单总额: ${dbData.secondary_orders_amount}`);
        console.log(`   本月佣金: ${dbData.month_commission}`);
        console.log(`   当日佣金: ${dbData.today_commission}`);
      } else {
        console.error('❌ 数据库查询失败:', error?.message);
        return;
      }
    } catch (error) {
      console.error('❌ 数据库连接失败:', error.message);
      return;
    }
  } else {
    console.error('❌ Supabase客户端未初始化');
    return;
  }
  
  // 2. 测试API稳定性
  console.log('\n📡 步骤2: 测试API稳定性（连续5次调用）');
  console.log('-'.repeat(40));
  
  if (window.SupabaseService) {
    for (let i = 0; i < 5; i++) {
      try {
        console.log(`🔍 第${i + 1}次API调用...`);
        
        const response = await window.SupabaseService.getPrimarySalesSettlement(testParams);
        
        if (response && response.data && response.data.sales) {
          const apiSales = response.data.sales;
          
          const callResult = {
            callNumber: i + 1,
            success: true,
            data: {
              total_commission: apiSales.total_commission,
              direct_commission: apiSales.direct_commission,
              secondary_avg_rate: apiSales.secondary_avg_rate,
              secondary_share_commission: apiSales.secondary_share_commission,
              secondary_orders_amount: apiSales.secondary_orders_amount,
              month_commission: apiSales.month_commission,
              today_commission: apiSales.today_commission
            }
          };
          
          testResults.apiCalls.push(callResult);
          testResults.summary.success++;
          
          console.log(`✅ 第${i + 1}次调用成功:`);
          console.log(`   一级销售佣金: ${apiSales.direct_commission}`);
          console.log(`   平均二级佣金率: ${apiSales.secondary_avg_rate}`);
          console.log(`   二级佣金收益: ${apiSales.secondary_share_commission}`);
          console.log(`   二级订单总额: ${apiSales.secondary_orders_amount}`);
          
          // 与数据库数据对比
          const dbMatch = (
            testResults.database.direct_commission === apiSales.direct_commission &&
            testResults.database.secondary_avg_rate === apiSales.secondary_avg_rate &&
            testResults.database.secondary_share_commission === apiSales.secondary_share_commission &&
            testResults.database.secondary_orders_amount === apiSales.secondary_orders_amount
          );
          
          if (dbMatch) {
            console.log('✅ 与数据库数据一致');
          } else {
            console.log('❌ 与数据库数据不一致');
            testResults.summary.consistent = false;
          }
          
        } else {
          console.log(`❌ 第${i + 1}次调用返回格式异常`);
          testResults.apiCalls.push({
            callNumber: i + 1,
            success: false,
            error: 'API返回格式异常'
          });
          testResults.summary.failed++;
        }
      } catch (error) {
        console.error(`❌ 第${i + 1}次调用失败:`, error.message);
        testResults.apiCalls.push({
          callNumber: i + 1,
          success: false,
          error: error.message
        });
        testResults.summary.failed++;
      }
      
      // 间隔500ms
      if (i < 4) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
  } else {
    console.error('❌ SupabaseService未定义');
    return;
  }
  
  // 3. 检查Redux状态
  console.log('\n⚛️ 步骤3: 检查Redux状态一致性');
  console.log('-'.repeat(40));
  
  if (window.store) {
    const state = window.store.getState();
    if (state.sales && state.sales.primarySalesSettlement) {
      const reduxData = state.sales.primarySalesSettlement;
      console.log('✅ Redux状态存在');
      
      if (reduxData.sales) {
        testResults.redux = reduxData.sales;
        console.log('Redux中的sales数据:');
        console.log(`   一级销售佣金: ${reduxData.sales.direct_commission}`);
        console.log(`   平均二级佣金率: ${reduxData.sales.secondary_avg_rate}`);
        console.log(`   二级佣金收益: ${reduxData.sales.secondary_share_commission}`);
        console.log(`   二级订单总额: ${reduxData.sales.secondary_orders_amount}`);
      } else {
        console.log('❌ Redux中缺少sales数据');
      }
    } else {
      console.log('❌ Redux中没有primarySalesSettlement数据');
    }
  } else {
    console.log('❌ Redux store未定义');
  }
  
  // 4. 综合分析结果
  console.log('\n📈 步骤4: 综合分析结果');
  console.log('=' .repeat(60));
  
  console.log(`🎯 成功率: ${testResults.summary.success}/5 (${(testResults.summary.success/5*100).toFixed(0)}%)`);
  console.log(`🎯 数据一致性: ${testResults.summary.consistent ? '✅ 一致' : '❌ 不一致'}`);
  
  // 检查API调用之间的一致性
  if (testResults.apiCalls.length > 1) {
    console.log('\n🔍 API调用间一致性检查:');
    
    const successfulCalls = testResults.apiCalls.filter(call => call.success);
    if (successfulCalls.length > 1) {
      const firstCall = successfulCalls[0].data;
      let apiConsistent = true;
      
      for (let i = 1; i < successfulCalls.length; i++) {
        const currentCall = successfulCalls[i].data;
        if (currentCall.direct_commission !== firstCall.direct_commission ||
            currentCall.secondary_avg_rate !== firstCall.secondary_avg_rate ||
            currentCall.secondary_share_commission !== firstCall.secondary_share_commission ||
            currentCall.secondary_orders_amount !== firstCall.secondary_orders_amount) {
          apiConsistent = false;
          console.log(`❌ 第${successfulCalls[i].callNumber}次与第1次数据不一致`);
        }
      }
      
      if (apiConsistent) {
        console.log('✅ 所有API调用返回数据完全一致');
      } else {
        console.log('❌ API调用之间数据不一致');
      }
    }
  }
  
  // 最终结论
  console.log('\n🎉 最终结论:');
  console.log('=' .repeat(60));
  
  if (testResults.summary.success === 5 && testResults.summary.consistent) {
    console.log('🎊 修复完全成功！');
    console.log('✅ 数据稳定性问题已彻底解决');
    console.log('✅ 所有关键字段值稳定显示');
    console.log('✅ API调用结果完全一致');
    console.log('✅ 数据库与API数据同步');
    console.log('');
    console.log('📋 稳定的数据值:');
    if (testResults.apiCalls.length > 0 && testResults.apiCalls[0].success) {
      const stableData = testResults.apiCalls[0].data;
      console.log(`   💰 一级销售佣金额: ${stableData.direct_commission}`);
      console.log(`   📊 平均二级佣金率: ${stableData.secondary_avg_rate}%`);
      console.log(`   💵 二级佣金收益额: ${stableData.secondary_share_commission}`);
      console.log(`   📈 二级销售订单总额: ${stableData.secondary_orders_amount}`);
    }
  } else if (testResults.summary.success >= 3) {
    console.log('🔄 修复基本成功，但仍需关注');
    console.log(`⚠️ 成功率: ${testResults.summary.success}/5`);
    console.log('💡 建议刷新页面后重新测试');
  } else {
    console.log('❌ 修复效果有限，需要进一步排查');
    console.log('🔧 建议检查代码是否正确部署');
    console.log('🔧 可能需要重启开发服务器');
  }
}

// 执行完整测试
runStabilityTest().catch(console.error);

console.log('\n💡 使用说明:');
console.log('1. 确保在一级销售对账页面运行 (localhost:3000/sales/commission)');
console.log('2. 如果测试失败，请先刷新页面');
console.log('3. 测试完成后检查页面显示是否稳定');