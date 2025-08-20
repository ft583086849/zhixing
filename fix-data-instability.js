// 修复数据不稳定问题
console.log('🔧 修复数据不稳定问题...\n');

async function fixDataInstability() {
  const testParams = {
    wechat_name: 'WML792355703',
    sales_code: 'PRI17547241780648255'
  };
  
  console.log('📊 问题诊断和修复步骤:');
  console.log('=' .repeat(50));
  
  // 1. 先验证数据源稳定性
  console.log('1. 🔍 验证数据源稳定性...');
  
  if (window.supabaseClient) {
    const { data: sourceData, error } = await window.supabaseClient
      .from('sales_optimized')
      .select('*')
      .eq('sales_code', testParams.sales_code)
      .single();
    
    if (error) {
      console.error('❌ 数据源不稳定:', error);
      return;
    }
    
    console.log('✅ 数据源稳定，字段值:');
    console.log(`  total_commission: ${sourceData.total_commission}`);
    console.log(`  direct_commission: ${sourceData.direct_commission}`);
    console.log(`  secondary_avg_rate: ${sourceData.secondary_avg_rate}`);
    console.log(`  secondary_share_commission: ${sourceData.secondary_share_commission}`);
    console.log(`  secondary_orders_amount: ${sourceData.secondary_orders_amount}`);
    
    // 2. 检查API返回一致性
    console.log('\n2. 📡 检查API返回一致性...');
    
    if (window.SupabaseService) {
      try {
        const apiResponse = await window.SupabaseService.getPrimarySalesSettlement(testParams);
        
        if (apiResponse && apiResponse.data && apiResponse.data.sales) {
          const apiSales = apiResponse.data.sales;
          
          console.log('API返回的sales对象:');
          console.log(`  total_commission: ${apiSales.total_commission}`);
          console.log(`  direct_commission: ${apiSales.direct_commission}`);
          console.log(`  secondary_avg_rate: ${apiSales.secondary_avg_rate}`);
          console.log(`  secondary_share_commission: ${apiSales.secondary_share_commission}`);
          console.log(`  secondary_orders_amount: ${apiSales.secondary_orders_amount}`);
          
          // 对比数据源和API返回
          const fieldsToCheck = ['total_commission', 'direct_commission', 'secondary_avg_rate', 'secondary_share_commission', 'secondary_orders_amount'];
          let hasInconsistency = false;
          
          console.log('\n🔍 数据源 vs API 对比:');
          fieldsToCheck.forEach(field => {
            const sourceValue = sourceData[field];
            const apiValue = apiSales[field];
            const isMatch = sourceValue === apiValue;
            
            if (!isMatch) {
              hasInconsistency = true;
              console.log(`❌ ${field}: 数据源(${sourceValue}) != API(${apiValue})`);
            } else {
              console.log(`✅ ${field}: ${sourceValue}`);
            }
          });
          
          if (hasInconsistency) {
            console.log('\n❌ 发现API返回与数据源不一致！');
            console.log('💡 建议检查 supabase.js 中的 getPrimarySalesSettlement 方法');
          } else {
            console.log('\n✅ API返回与数据源一致');
          }
        } else {
          console.log('❌ API返回格式异常');
        }
      } catch (error) {
        console.error('❌ API调用失败:', error);
      }
    }
    
    // 3. 检查Redux状态管理
    console.log('\n3. ⚛️ 检查Redux状态管理...');
    
    if (window.store) {
      const currentState = window.store.getState();
      
      if (currentState.sales && currentState.sales.primarySalesSettlement) {
        const reduxData = currentState.sales.primarySalesSettlement;
        
        console.log('Redux中的数据:');
        if (reduxData.sales) {
          console.log('  sales对象存在');
          fieldsToCheck.forEach(field => {
            console.log(`    ${field}: ${reduxData.sales[field]}`);
          });
        } else {
          console.log('  ❌ Redux中缺少sales对象');
        }
        
        // 检查Redux数据是否与API一致
        if (apiResponse && apiResponse.data && reduxData.sales) {
          console.log('\n🔍 API vs Redux 对比:');
          fieldsToCheck.forEach(field => {
            const apiValue = apiResponse.data.sales[field];
            const reduxValue = reduxData.sales[field];
            const isMatch = apiValue === reduxValue;
            
            if (!isMatch) {
              console.log(`❌ ${field}: API(${apiValue}) != Redux(${reduxValue})`);
            } else {
              console.log(`✅ ${field}: ${apiValue}`);
            }
          });
        }
      } else {
        console.log('❌ Redux中没有primarySalesSettlement数据');
        
        // 尝试重新获取数据
        console.log('🔄 尝试重新获取数据...');
        if (window.store.dispatch && window.getPrimarySalesSettlement) {
          try {
            await window.store.dispatch(window.getPrimarySalesSettlement(testParams));
            console.log('✅ 重新获取数据完成');
          } catch (error) {
            console.error('❌ 重新获取数据失败:', error);
          }
        }
      }
    }
    
    // 4. 提供修复方案
    console.log('\n💡 修复方案:');
    console.log('=' .repeat(50));
    
    if (hasInconsistency) {
      console.log('🔧 检测到API数据不一致，建议修复:');
      console.log('1. 检查 supabase.js 中的字段映射');
      console.log('2. 确保所有字段都正确返回');
      console.log('3. 添加数据验证逻辑');
    } else {
      console.log('🔧 数据源一致，可能的问题:');
      console.log('1. 组件渲染时机问题');
      console.log('2. 状态更新异步问题');
      console.log('3. 页面刷新导致状态丢失');
    }
    
    // 5. 实施临时修复
    console.log('\n🛠️ 实施临时修复措施...');
    
    // 强制刷新Redux状态
    if (window.store && window.getPrimarySalesSettlement) {
      console.log('🔄 强制刷新Redux状态...');
      try {
        const action = await window.store.dispatch(window.getPrimarySalesSettlement(testParams));
        console.log('✅ Redux状态已刷新');
        
        // 验证刷新后的状态
        const newState = window.store.getState();
        if (newState.sales && newState.sales.primarySalesSettlement && newState.sales.primarySalesSettlement.sales) {
          console.log('✅ 刷新后的数据:');
          const refreshedSales = newState.sales.primarySalesSettlement.sales;
          fieldsToCheck.forEach(field => {
            console.log(`  ${field}: ${refreshedSales[field]}`);
          });
        }
      } catch (error) {
        console.error('❌ 强制刷新失败:', error);
      }
    }
    
    console.log('\n✅ 修复完成！请检查页面显示是否稳定。');
  }
}

// 执行修复
fixDataInstability().catch(console.error);

console.log('\n💡 提示: 如果问题持续，可能需要修改源代码');
console.log('💡 主要检查 supabase.js 和 PrimarySalesSettlementPage.js');