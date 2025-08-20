// 监测一级销售佣金数据的稳定性
console.log('🔍 开始监测数据稳定性...\n');

async function monitorDataStability() {
  const testParams = {
    wechat_name: 'WML792355703',
    sales_code: 'PRI17547241780648255'
  };
  
  let testCount = 0;
  const results = [];
  
  // 连续测试10次
  for (let i = 0; i < 10; i++) {
    testCount++;
    console.log(`\n🧪 第${testCount}次测试 (${new Date().toLocaleTimeString()})`);
    
    try {
      // 1. 直接查询数据库
      console.log('📊 直接查询sales_optimized表...');
      if (window.supabaseClient) {
        const { data: dbData, error } = await window.supabaseClient
          .from('sales_optimized')
          .select(`
            total_commission,
            direct_commission,
            secondary_avg_rate,
            secondary_share_commission,
            secondary_orders_amount
          `)
          .eq('sales_code', testParams.sales_code)
          .single();
        
        if (error) {
          console.error('❌ 数据库查询失败:', error);
        } else {
          console.log('数据库直查结果:', dbData);
        }
      }
      
      // 2. 调用Supabase服务
      console.log('📡 调用SupabaseService...');
      if (window.SupabaseService) {
        const serviceResponse = await window.SupabaseService.getPrimarySalesSettlement(testParams);
        console.log('SupabaseService响应:', serviceResponse);
        
        if (serviceResponse.data && serviceResponse.data.sales) {
          const sales = serviceResponse.data.sales;
          console.log('关键字段值:');
          console.log(`  direct_commission: ${sales.direct_commission}`);
          console.log(`  secondary_avg_rate: ${sales.secondary_avg_rate}`);
          console.log(`  secondary_share_commission: ${sales.secondary_share_commission}`);
          console.log(`  secondary_orders_amount: ${sales.secondary_orders_amount}`);
          
          // 记录结果
          results.push({
            test: testCount,
            time: new Date().toLocaleTimeString(),
            direct_commission: sales.direct_commission,
            secondary_avg_rate: sales.secondary_avg_rate,
            secondary_share_commission: sales.secondary_share_commission,
            secondary_orders_amount: sales.secondary_orders_amount,
            hasAllData: sales.direct_commission && sales.secondary_avg_rate && 
                       sales.secondary_share_commission && sales.secondary_orders_amount
          });
        }
      }
      
      // 3. 检查Redux状态
      if (window.store) {
        const state = window.store.getState();
        if (state.sales && state.sales.primarySalesSettlement) {
          console.log('Redux状态中的数据:');
          const settlement = state.sales.primarySalesSettlement;
          console.log('  primarySalesSettlement:', settlement);
        }
      }
      
    } catch (error) {
      console.error(`❌ 第${testCount}次测试失败:`, error);
      results.push({
        test: testCount,
        time: new Date().toLocaleTimeString(),
        error: error.message,
        hasAllData: false
      });
    }
    
    // 间隔1秒
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // 分析结果
  console.log('\n📊 测试结果分析:');
  console.log('=' .repeat(50));
  
  const successfulTests = results.filter(r => r.hasAllData);
  const failedTests = results.filter(r => !r.hasAllData);
  
  console.log(`✅ 成功获取完整数据: ${successfulTests.length}/10 次`);
  console.log(`❌ 数据不完整或失败: ${failedTests.length}/10 次`);
  
  if (failedTests.length > 0) {
    console.log('\n❌ 失败的测试详情:');
    failedTests.forEach(test => {
      console.log(`  第${test.test}次 (${test.time}): ${test.error || '数据字段为空'}`);
      if (!test.error) {
        console.log(`    direct_commission: ${test.direct_commission}`);
        console.log(`    secondary_avg_rate: ${test.secondary_avg_rate}`);
        console.log(`    secondary_share_commission: ${test.secondary_share_commission}`);
        console.log(`    secondary_orders_amount: ${test.secondary_orders_amount}`);
      }
    });
  }
  
  if (successfulTests.length > 0) {
    console.log('\n✅ 成功的测试数据对比:');
    successfulTests.forEach(test => {
      console.log(`  第${test.test}次 (${test.time}):`);
      console.log(`    direct_commission: ${test.direct_commission}`);
      console.log(`    secondary_avg_rate: ${test.secondary_avg_rate}`);
      console.log(`    secondary_share_commission: ${test.secondary_share_commission}`);
      console.log(`    secondary_orders_amount: ${test.secondary_orders_amount}`);
    });
  }
  
  // 检查数据是否一致
  if (successfulTests.length > 1) {
    console.log('\n🔍 检查数据一致性:');
    const first = successfulTests[0];
    let isConsistent = true;
    
    for (let i = 1; i < successfulTests.length; i++) {
      const current = successfulTests[i];
      if (current.direct_commission !== first.direct_commission ||
          current.secondary_avg_rate !== first.secondary_avg_rate ||
          current.secondary_share_commission !== first.secondary_share_commission ||
          current.secondary_orders_amount !== first.secondary_orders_amount) {
        isConsistent = false;
        console.log(`❌ 第${current.test}次数据与第1次不一致`);
      }
    }
    
    if (isConsistent) {
      console.log('✅ 所有成功测试的数据都一致');
    } else {
      console.log('❌ 数据在不同测试中不一致！');
    }
  }
}

// 执行监测
monitorDataStability().catch(console.error);

console.log('\n💡 提示: 这个脚本会连续测试10次，每次间隔1秒');
console.log('💡 请在控制台观察数据稳定性情况');