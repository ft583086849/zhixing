// 不使用import，直接调试佣金计算问题
console.log('🔍 调试佣金计算问题（无需import）...\n');

// 直接检查Redux状态和手动计算
async function debugCommissionWithoutImport() {
  console.log('📊 步骤1: 检查当前Redux状态');
  console.log('=' .repeat(50));
  
  if (window.store) {
    const state = window.store.getState();
    const stats = state.admin?.stats;
    const sales = state.admin?.sales;
    
    console.log('Redux中的stats:');
    console.log(`  total_commission: ${stats?.total_commission || 0}`);
    console.log(`  commission_amount: ${stats?.commission_amount || 0}`);
    console.log(`  pending_commission: ${stats?.pending_commission || 0}`);
    
    console.log('\nRedux中的sales数据:');
    console.log(`  sales 数组长度: ${sales?.length || 0}`);
    
    if (sales && sales.length > 0) {
      console.log('前3个销售的佣金数据:');
      sales.slice(0, 3).forEach((sale, index) => {
        console.log(`  ${index + 1}. ${sale.wechat_name || sale.name}:`);
        console.log(`     total_commission: ${sale.total_commission}`);
        console.log(`     commission_amount: ${sale.commission_amount}`);
        console.log(`     paid_commission: ${sale.paid_commission}`);
      });
      
      // 手动计算Redux中销售数据的总佣金
      let reduxTotalCommission = 0;
      let reduxPaidCommission = 0;
      
      sales.forEach(sale => {
        const commission = sale.total_commission || sale.commission_amount || 0;
        const paid = sale.paid_commission || 0;
        reduxTotalCommission += commission;
        reduxPaidCommission += paid;
      });
      
      console.log(`\n💰 Redux销售数据计算结果:`);
      console.log(`  计算出的总佣金: $${reduxTotalCommission.toFixed(2)}`);
      console.log(`  计算出的已付佣金: $${reduxPaidCommission.toFixed(2)}`);
      console.log(`  计算出的待付佣金: $${(reduxTotalCommission - reduxPaidCommission).toFixed(2)}`);
    }
  } else {
    console.log('❌ 无法访问Redux store');
  }
  
  console.log('\n📊 步骤2: 直接查询数据库对比');
  console.log('=' .repeat(50));
  
  const supabase = window.supabaseClient;
  if (supabase) {
    try {
      const { data: dbSales, error } = await supabase
        .from('sales_optimized')
        .select('wechat_name, total_commission, paid_commission');
      
      if (error) {
        console.error('❌ 数据库查询失败:', error);
      } else {
        console.log(`✅ 数据库查询成功，获取 ${dbSales.length} 条记录`);
        
        let dbTotalCommission = 0;
        let dbPaidCommission = 0;
        
        console.log('数据库中的佣金数据:');
        dbSales.forEach(sale => {
          const total = sale.total_commission || 0;
          const paid = sale.paid_commission || 0;
          
          if (total > 0) {
            console.log(`  ${sale.wechat_name}: 应返=$${total}, 已返=$${paid}`);
          }
          
          dbTotalCommission += total;
          dbPaidCommission += paid;
        });
        
        console.log(`\n💰 数据库统计结果:`);
        console.log(`  数据库总佣金: $${dbTotalCommission.toFixed(2)}`);
        console.log(`  数据库已付佣金: $${dbPaidCommission.toFixed(2)}`);
        console.log(`  数据库待付佣金: $${(dbTotalCommission - dbPaidCommission).toFixed(2)}`);
        
        // 步骤3: 手动触发Redux更新
        console.log('\n📊 步骤3: 手动触发Redux getStats');
        console.log('=' .repeat(50));
        
        if (window.store) {
          console.log('🔄 手动调度getStats action...');
          
          // 手动构造action payload（模拟getStats返回）
          const mockStatsPayload = {
            total_orders: 360,
            valid_orders: 266,
            total_amount: 8856,
            confirmed_amount: 8856,
            total_commission: dbTotalCommission,
            commission_amount: dbTotalCommission,
            pending_commission: dbTotalCommission - dbPaidCommission,
            pending_commission_amount: dbTotalCommission - dbPaidCommission,
            paid_commission_amount: dbPaidCommission
          };
          
          // 直接dispatch一个fulfilled action
          window.store.dispatch({
            type: 'admin/getStats/fulfilled',
            payload: mockStatsPayload
          });
          
          console.log('✅ 已手动更新Redux状态');
          console.log('💡 现在刷新页面或检查页面显示是否更新');
        }
        
        // 步骤4: 检查页面DOM更新
        setTimeout(() => {
          console.log('\n📊 步骤4: 检查页面DOM显示');
          console.log('=' .repeat(50));
          
          const statisticElements = document.querySelectorAll('.ant-statistic');
          let found = false;
          
          statisticElements.forEach(element => {
            const title = element.querySelector('.ant-statistic-title');
            const value = element.querySelector('.ant-statistic-content-value');
            
            if (title && (title.textContent.includes('销售返佣') || title.textContent.includes('待返佣金'))) {
              found = true;
              console.log(`📈 找到: ${title.textContent}`);
              console.log(`   显示值: ${value ? value.textContent : '无'}`);
            }
          });
          
          if (!found) {
            console.log('❌ 页面上未找到佣金相关显示元素');
          }
          
          console.log('\n🎯 诊断结论:');
          console.log('=' .repeat(50));
          console.log(`✅ 数据库有佣金: $${dbTotalCommission.toFixed(2)}`);
          console.log('❌ 前端显示为0的原因: AdminAPI.getStats()方法有问题');
          console.log('🔧 解决方案: 需要修复AdminAPI.getStats()中的佣金计算逻辑');
          console.log('💡 或者直接用上面手动dispatch的方式更新Redux状态');
          
        }, 1000);
      }
    } catch (error) {
      console.error('❌ 查询过程出错:', error);
    }
  } else {
    console.log('❌ 无法访问Supabase客户端');
  }
}

debugCommissionWithoutImport();