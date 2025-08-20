// 直接调用AdminAPI查看佣金数据
// 在浏览器控制台运行此脚本

console.log('🔍 开始检查佣金数据问题...\n');

// 动态导入API模块
import('/src/services/api.js').then(async (module) => {
  const AdminAPI = module.AdminAPI;
  
  console.log('📊 步骤1: 调用AdminAPI.getStats()');
  console.log('=' .repeat(60));
  
  try {
    const stats = await AdminAPI.getStats({
      timeRange: 'all',
      usePaymentTime: true
    });
    
    console.log('✅ getStats返回的数据:');
    console.log(stats);
    
    console.log('\n📈 佣金相关字段:');
    console.log(`  total_commission: ${stats.total_commission}`);
    console.log(`  commission_amount: ${stats.commission_amount}`);
    console.log(`  pending_commission: ${stats.pending_commission}`);
    console.log(`  pending_commission_amount: ${stats.pending_commission_amount}`);
    
    if (!stats.total_commission && !stats.commission_amount) {
      console.log('\n⚠️ 佣金为0，继续检查销售数据...');
    }
  } catch (error) {
    console.error('❌ getStats失败:', error);
  }
  
  console.log('\n📊 步骤2: 调用AdminAPI.getSales()');
  console.log('=' .repeat(60));
  
  try {
    const salesResponse = await AdminAPI.getSales();
    console.log('✅ getSales返回的数据:');
    console.log(`  success: ${salesResponse.success}`);
    console.log(`  data长度: ${salesResponse.data ? salesResponse.data.length : 0}`);
    
    if (salesResponse.data && salesResponse.data.length > 0) {
      // 计算总佣金
      let totalCommission = 0;
      let totalPaid = 0;
      
      console.log('\n前3个销售的详细数据:');
      salesResponse.data.slice(0, 3).forEach((sale, index) => {
        console.log(`\n${index + 1}. ${sale.wechat_name || sale.name || sale.sales_code}`);
        console.log(`   total_amount: ${sale.total_amount}`);
        console.log(`   total_commission: ${sale.total_commission}`);
        console.log(`   commission_amount: ${sale.commission_amount}`);
        console.log(`   primary_commission_amount: ${sale.primary_commission_amount}`);
        console.log(`   secondary_commission_amount: ${sale.secondary_commission_amount}`);
        console.log(`   paid_commission: ${sale.paid_commission}`);
        
        // 累加佣金
        const commission = sale.total_commission || sale.commission_amount || 0;
        totalCommission += commission;
        totalPaid += (sale.paid_commission || 0);
      });
      
      // 计算所有销售的总佣金
      salesResponse.data.forEach(sale => {
        const commission = sale.total_commission || sale.commission_amount || 0;
        totalCommission += commission;
        totalPaid += (sale.paid_commission || 0);
      });
      
      console.log('\n💰 从销售数据计算的总佣金:');
      console.log(`  应返佣金: $${totalCommission.toFixed(2)}`);
      console.log(`  已返佣金: $${totalPaid.toFixed(2)}`);
      console.log(`  待返佣金: $${(totalCommission - totalPaid).toFixed(2)}`);
    }
  } catch (error) {
    console.error('❌ getSales失败:', error);
  }
  
  console.log('\n📊 步骤3: 调用AdminAPI.getSalesOptimized()');
  console.log('=' .repeat(60));
  
  try {
    const optimizedResponse = await AdminAPI.getSalesOptimized();
    console.log('✅ getSalesOptimized返回的数据:');
    console.log(`  success: ${optimizedResponse.success}`);
    console.log(`  data长度: ${optimizedResponse.data ? optimizedResponse.data.length : 0}`);
    
    if (optimizedResponse.data && optimizedResponse.data.length > 0) {
      // 计算总佣金
      let totalCommission = 0;
      
      optimizedResponse.data.forEach(sale => {
        totalCommission += (sale.total_commission || 0);
      });
      
      console.log(`\n💰 优化API的总佣金: $${totalCommission.toFixed(2)}`);
    }
  } catch (error) {
    console.error('❌ getSalesOptimized失败:', error);
  }
  
  console.log('\n📊 步骤4: 直接查询Supabase');
  console.log('=' .repeat(60));
  
  // 导入Supabase服务
  import('/src/services/supabase.js').then(async (supabaseModule) => {
    const SupabaseService = supabaseModule.default;
    const supabase = SupabaseService.supabase;
    
    // 直接查询sales_optimized表
    const { data: sales, error } = await supabase
      .from('sales_optimized')
      .select('sales_code, wechat_name, total_amount, total_commission, paid_commission')
      .order('total_commission', { ascending: false })
      .limit(5);
    
    if (error) {
      console.error('❌ Supabase查询失败:', error);
    } else {
      console.log('✅ 直接从Supabase查询的数据:');
      let totalCommission = 0;
      
      sales.forEach((sale, index) => {
        console.log(`${index + 1}. ${sale.wechat_name}: 佣金=$${sale.total_commission || 0}`);
        totalCommission += (sale.total_commission || 0);
      });
      
      // 查询所有销售的总佣金
      const { data: allSales } = await supabase
        .from('sales_optimized')
        .select('total_commission');
      
      if (allSales) {
        let allTotal = 0;
        allSales.forEach(s => {
          allTotal += (s.total_commission || 0);
        });
        console.log(`\n💰 数据库中的总佣金: $${allTotal.toFixed(2)}`);
      }
    }
    
    console.log('\n\n🔍 诊断结果:');
    console.log('=' .repeat(60));
    console.log('请检查以上各个步骤的输出，找出哪一步的数据有问题。');
  });
}).catch(error => {
  console.error('模块导入失败:', error);
  console.log('\n尝试使用全局对象...');
  
  // 如果模块导入失败，尝试使用Redux
  if (window.store) {
    const state = window.store.getState();
    console.log('Redux中的stats:', state.admin?.stats);
  }
});