// 检查销售返佣金额和待返佣金额都为0的问题
console.log('🔍 检查销售返佣和待返佣金额问题...\n');

const supabase = window.supabaseClient;

async function checkCommissionIssues() {
  // 1. 直接从数据库查询佣金数据
  console.log('📊 步骤1: 直接查询数据库佣金数据');
  console.log('=' .repeat(50));
  
  const { data: sales, error } = await supabase
    .from('sales_optimized')
    .select('sales_code, wechat_name, total_commission, paid_commission');
  
  if (error) {
    console.error('❌ 查询失败:', error);
    return;
  }
  
  let dbTotalCommission = 0;
  let dbPaidCommission = 0;
  
  console.log('数据库中的佣金数据:');
  sales.forEach(sale => {
    const total = sale.total_commission || 0;
    const paid = sale.paid_commission || 0;
    
    if (total > 0 || paid > 0) {
      console.log(`  ${sale.wechat_name}: 应返$${total}, 已返$${paid}`);
    }
    
    dbTotalCommission += total;
    dbPaidCommission += paid;
  });
  
  console.log(`\n数据库汇总:`);
  console.log(`  应返佣金总额: $${dbTotalCommission.toFixed(2)}`);
  console.log(`  已返佣金总额: $${dbPaidCommission.toFixed(2)}`);
  console.log(`  待返佣金总额: $${(dbTotalCommission - dbPaidCommission).toFixed(2)}`);
  
  // 2. 检查Redux中的stats数据
  console.log('\n📦 步骤2: 检查Redux中的stats数据');
  console.log('=' .repeat(50));
  
  if (window.store) {
    const state = window.store.getState();
    const stats = state.admin?.stats;
    
    if (stats) {
      console.log('Redux中的stats:');
      console.log(`  total_commission: ${stats.total_commission}`);
      console.log(`  commission_amount: ${stats.commission_amount}`);
      console.log(`  pending_commission: ${stats.pending_commission}`);
      console.log(`  pending_commission_amount: ${stats.pending_commission_amount}`);
      
      // 检查是否所有字段都是0
      const allZero = [
        stats.total_commission,
        stats.commission_amount, 
        stats.pending_commission,
        stats.pending_commission_amount
      ].every(val => (val || 0) === 0);
      
      if (allZero) {
        console.log('⚠️ Redux中所有佣金字段都是0！');
      }
    } else {
      console.log('❌ Redux中没有stats数据');
    }
  }
  
  // 3. 手动调用getStats看返回结果
  console.log('\n🔧 步骤3: 手动触发getStats计算');
  console.log('=' .repeat(50));
  
  try {
    // 导入并调用AdminAPI.getStats
    const { AdminAPI } = await import('/src/services/api.js');
    
    console.log('📡 调用 AdminAPI.getStats...');
    const statsResult = await AdminAPI.getStats({
      timeRange: 'all',
      usePaymentTime: true
    });
    
    console.log('getStats返回结果:');
    console.log(`  total_commission: ${statsResult.total_commission}`);
    console.log(`  commission_amount: ${statsResult.commission_amount}`);
    console.log(`  pending_commission: ${statsResult.pending_commission}`);
    console.log(`  pending_commission_amount: ${statsResult.pending_commission_amount}`);
    
    // 4. 对比数据库和API结果
    console.log('\n🔍 步骤4: 数据对比分析');
    console.log('=' .repeat(50));
    
    console.log('数据对比:');
    console.log(`  数据库总佣金: $${dbTotalCommission.toFixed(2)}`);
    console.log(`  API返回total_commission: $${statsResult.total_commission || 0}`);
    console.log(`  API返回commission_amount: $${statsResult.commission_amount || 0}`);
    
    if (dbTotalCommission > 0 && (statsResult.total_commission || 0) === 0) {
      console.log('❌ 问题确认: 数据库有数据，但API返回0');
      console.log('   可能原因:');
      console.log('   1. AdminAPI.getSales()返回的数据格式不正确');
      console.log('   2. getStats中的计算逻辑有问题');
      console.log('   3. 缓存返回了错误的数据');
    }
    
  } catch (error) {
    console.error('❌ 调用getStats失败:', error);
  }
  
  // 5. 检查页面显示
  console.log('\n📱 步骤5: 检查页面显示元素');
  console.log('=' .repeat(50));
  
  const statistics = document.querySelectorAll('.ant-statistic');
  let foundCommissions = [];
  
  statistics.forEach(stat => {
    const title = stat.querySelector('.ant-statistic-title');
    const value = stat.querySelector('.ant-statistic-content-value');
    
    if (title && (title.textContent.includes('返佣') || title.textContent.includes('佣金'))) {
      foundCommissions.push({
        title: title.textContent,
        value: value ? value.textContent : '无'
      });
    }
  });
  
  console.log('页面显示的佣金相关数据:');
  foundCommissions.forEach(item => {
    console.log(`  ${item.title}: ${item.value}`);
  });
  
  console.log('\n💡 总结:');
  console.log('=' .repeat(50));
  if (dbTotalCommission > 0) {
    console.log('✅ 数据库中有佣金数据');
    console.log('❌ 但前端显示为0，问题在API或Redux层');
    console.log('🔧 需要检查AdminAPI.getSales()的返回格式');
  } else {
    console.log('❌ 数据库中也没有佣金数据');
    console.log('🔧 需要检查佣金计算和更新逻辑');
  }
}

checkCommissionIssues();