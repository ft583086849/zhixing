// 专门调试 AdminAPI.getStats() 的佣金计算问题
console.log('🔍 调试 getStats() 佣金计算问题...\n');

async function debugGetStatsCalculation() {
  // 1. 手动调用 AdminAPI.getSales() 查看返回格式
  console.log('📊 步骤1: 直接调用 AdminAPI.getSales()');
  console.log('=' .repeat(50));
  
  try {
    // 导入 AdminAPI
    const { AdminAPI } = await import('/src/services/api.js');
    
    console.log('📡 调用 AdminAPI.getSales()...');
    const salesResponse = await AdminAPI.getSales();
    
    console.log('getSales 返回格式:');
    console.log(`  success: ${salesResponse.success}`);
    console.log(`  data 类型: ${Array.isArray(salesResponse.data) ? 'Array' : typeof salesResponse.data}`);
    console.log(`  data 长度: ${salesResponse.data ? salesResponse.data.length : 'null'}`);
    
    // 检查返回的数据结构
    if (salesResponse.success && salesResponse.data && salesResponse.data.length > 0) {
      console.log('\n前3条销售数据的结构:');
      salesResponse.data.slice(0, 3).forEach((sale, index) => {
        console.log(`\n销售 ${index + 1}:`);
        console.log(`  wechat_name: ${sale.wechat_name}`);
        console.log(`  total_commission: ${sale.total_commission}`);
        console.log(`  commission_amount: ${sale.commission_amount}`);
        console.log(`  paid_commission: ${sale.paid_commission}`);
        
        // 检查字段存在性
        const hasCommission = sale.total_commission !== undefined;
        const hasCommissionAmount = sale.commission_amount !== undefined;
        console.log(`  ✅ total_commission 字段: ${hasCommission ? '存在' : '不存在'}`);
        console.log(`  ✅ commission_amount 字段: ${hasCommissionAmount ? '存在' : '不存在'}`);
      });
      
      // 2. 手动模拟 getStats 中的佣金计算逻辑
      console.log('\n📊 步骤2: 手动模拟 getStats 佣金计算');
      console.log('=' .repeat(50));
      
      let total_commission = 0;
      let paid_commission = 0;
      let pending_commission = 0;
      
      console.log('执行佣金计算...');
      salesResponse.data.forEach((sale, index) => {
        // 使用和 API 中相同的逻辑
        const commissionAmount = sale.total_commission || sale.commission_amount || 0;
        total_commission += commissionAmount;
        
        const paidAmount = sale.paid_commission || 0;
        paid_commission += paidAmount;
        
        const pendingAmount = commissionAmount - paidAmount;
        pending_commission += pendingAmount;
        
        if (commissionAmount > 0) {
          console.log(`  ${sale.wechat_name}: 佣金=$${commissionAmount}, 已付=$${paidAmount}`);
        }
      });
      
      console.log('\n💰 手动计算结果:');
      console.log(`  应返佣金总额: $${total_commission.toFixed(2)}`);
      console.log(`  已返佣金总额: $${paid_commission.toFixed(2)}`);
      console.log(`  待返佣金总额: $${pending_commission.toFixed(2)}`);
      
      // 3. 对比数据库直接查询的结果
      console.log('\n📊 步骤3: 对比数据库直接查询');
      console.log('=' .repeat(50));
      
      const supabase = window.supabaseClient;
      const { data: dbSales } = await supabase
        .from('sales_optimized')
        .select('wechat_name, total_commission, paid_commission');
      
      let dbTotalCommission = 0;
      let dbPaidCommission = 0;
      
      if (dbSales) {
        dbSales.forEach(sale => {
          dbTotalCommission += (sale.total_commission || 0);
          dbPaidCommission += (sale.paid_commission || 0);
        });
      }
      
      console.log('数据库直接查询结果:');
      console.log(`  数据库总佣金: $${dbTotalCommission.toFixed(2)}`);
      console.log(`  数据库已付佣金: $${dbPaidCommission.toFixed(2)}`);
      
      console.log('\n🔍 对比分析:');
      console.log(`  AdminAPI.getSales() 计算: $${total_commission.toFixed(2)}`);
      console.log(`  数据库直接查询: $${dbTotalCommission.toFixed(2)}`);
      
      if (Math.abs(total_commission - dbTotalCommission) < 0.01) {
        console.log('✅ AdminAPI.getSales() 返回的数据正确');
      } else {
        console.log('❌ AdminAPI.getSales() 返回的数据有问题');
        console.log('   可能原因: 数据格式不匹配或字段缺失');
      }
      
      // 4. 检查 AdminAPI.getStats() 的实际返回
      console.log('\n📊 步骤4: 检查 AdminAPI.getStats() 实际返回');
      console.log('=' .repeat(50));
      
      const statsResult = await AdminAPI.getStats({
        timeRange: 'all',
        usePaymentTime: true
      });
      
      console.log('AdminAPI.getStats() 返回:');
      console.log(`  total_commission: $${statsResult.total_commission || 0}`);
      console.log(`  commission_amount: $${statsResult.commission_amount || 0}`);
      console.log(`  pending_commission: $${statsResult.pending_commission || 0}`);
      console.log(`  pending_commission_amount: $${statsResult.pending_commission_amount || 0}`);
      
      // 5. 最终诊断
      console.log('\n🎯 最终诊断结果:');
      console.log('=' .repeat(50));
      
      if (total_commission > 0 && (statsResult.total_commission || 0) === 0) {
        console.log('❌ 确认问题: getSales() 数据正确，但 getStats() 返回0');
        console.log('🔧 问题定位: getStats() 方法内部计算逻辑有bug');
        console.log('🔍 需要检查: api.js 中 getStats() 方法的销售数据处理');
      } else if ((statsResult.total_commission || 0) > 0) {
        console.log('✅ AdminAPI.getStats() 返回正确');
        console.log('🔧 问题可能在: Redux store 或前端组件显示');
      } else {
        console.log('❌ 整个链路都有问题，需要深入调试');
      }
      
    } else {
      console.log('❌ AdminAPI.getSales() 返回空数据或格式错误');
    }
    
  } catch (error) {
    console.error('❌ 调试过程出错:', error);
  }
}

debugGetStatsCalculation();