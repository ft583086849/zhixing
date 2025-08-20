const { createClient } = require('@supabase/supabase-js');

// 使用正确的Supabase配置
const supabaseUrl = 'https://tqukhzexeyyhsjevhtqp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxdWtoemV4ZXl5aHNqZXZodHFwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzEyNDAzMDEsImV4cCI6MjA0NjgxNjMwMX0.hE8NG3gvAx5kiI8xNh9WZJ7aYEU9JNDfJiCWBPJ7tBc';

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugCommissionStats() {
  console.log('🔍 开始调试销售返佣金额显示为0的问题...\n');
  
  try {
    // 1. 检查sales_optimized表中的佣金数据
    console.log('📊 步骤1: 检查sales_optimized表的佣金字段');
    console.log('=' .repeat(60));
    
    const { data: sales, error: salesError } = await supabase
      .from('sales_optimized')
      .select('sales_code, wechat_name, sales_type, total_amount, total_commission, primary_commission_amount, secondary_commission_amount, paid_commission')
      .order('total_commission', { ascending: false })
      .limit(5);
    
    if (salesError) {
      console.error('查询sales_optimized失败:', salesError);
    } else if (sales && sales.length > 0) {
      console.log('Top 5 销售的佣金数据:');
      sales.forEach((sale, index) => {
        console.log(`\n${index + 1}. ${sale.wechat_name} (${sale.sales_type})`);
        console.log(`   销售额: $${(sale.total_amount || 0).toFixed(2)}`);
        console.log(`   总佣金: $${(sale.total_commission || 0).toFixed(2)}`);
        console.log(`   - 直销佣金: $${(sale.primary_commission_amount || 0).toFixed(2)}`);
        console.log(`   - 分销佣金: $${(sale.secondary_commission_amount || 0).toFixed(2)}`);
        console.log(`   已付佣金: $${(sale.paid_commission || 0).toFixed(2)}`);
      });
      
      // 计算总佣金
      const { data: allSales } = await supabase
        .from('sales_optimized')
        .select('total_commission, paid_commission');
      
      let totalCommission = 0;
      let totalPaid = 0;
      
      if (allSales) {
        allSales.forEach(s => {
          totalCommission += (s.total_commission || 0);
          totalPaid += (s.paid_commission || 0);
        });
      }
      
      console.log('\n💰 sales_optimized表的佣金汇总:');
      console.log(`   应返佣金总额: $${totalCommission.toFixed(2)}`);
      console.log(`   已返佣金总额: $${totalPaid.toFixed(2)}`);
      console.log(`   待返佣金总额: $${(totalCommission - totalPaid).toFixed(2)}`);
    } else {
      console.log('❌ sales_optimized表中没有数据');
    }
    
    // 2. 检查API的getSales方法返回的数据
    console.log('\n\n📊 步骤2: 模拟API.getSales()方法的查询');
    console.log('=' .repeat(60));
    
    const { data: apiSales, error: apiError } = await supabase
      .from('sales_optimized')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (apiError) {
      console.error('查询失败:', apiError);
    } else if (apiSales && apiSales.length > 0) {
      // 模拟API中的佣金计算逻辑
      let apiTotalCommission = 0;
      let apiPaidCommission = 0;
      
      apiSales.forEach(sale => {
        // 注意：API可能使用commission_amount字段而不是total_commission
        const commissionAmount = sale.commission_amount || sale.total_commission || 0;
        const paidAmount = sale.paid_commission || 0;
        
        apiTotalCommission += commissionAmount;
        apiPaidCommission += paidAmount;
      });
      
      console.log('API方法计算的佣金:');
      console.log(`   应返佣金(使用commission_amount): $${apiTotalCommission.toFixed(2)}`);
      console.log(`   已返佣金: $${apiPaidCommission.toFixed(2)}`);
      console.log(`   待返佣金: $${(apiTotalCommission - apiPaidCommission).toFixed(2)}`);
      
      // 检查字段差异
      console.log('\n⚠️  字段检查:');
      const firstSale = apiSales[0];
      console.log(`   第一条记录的字段对比:`);
      console.log(`   - commission_amount: ${firstSale.commission_amount || 'undefined'}`);
      console.log(`   - total_commission: ${firstSale.total_commission || 'undefined'}`);
      
      if (firstSale.commission_amount === undefined && firstSale.total_commission !== undefined) {
        console.log('\n❗ 发现问题: sales_optimized表中没有commission_amount字段!');
        console.log('   API代码中使用的是sale.commission_amount，但表中字段是total_commission');
      }
    }
    
    // 3. 检查订单表中的佣金数据
    console.log('\n\n📊 步骤3: 检查orders_optimized表的佣金数据');
    console.log('=' .repeat(60));
    
    const { data: orders } = await supabase
      .from('orders_optimized')
      .select('status, commission_amount, primary_commission_amount, secondary_commission_amount')
      .in('status', ['confirmed_payment', 'pending_config', 'confirmed_config']);
    
    if (orders && orders.length > 0) {
      let orderCommissionTotal = 0;
      let primaryTotal = 0;
      let secondaryTotal = 0;
      
      orders.forEach(order => {
        orderCommissionTotal += (order.commission_amount || 0);
        primaryTotal += (order.primary_commission_amount || 0);
        secondaryTotal += (order.secondary_commission_amount || 0);
      });
      
      console.log('订单表中的佣金汇总:');
      console.log(`   总佣金(commission_amount): $${orderCommissionTotal.toFixed(2)}`);
      console.log(`   直销佣金总和: $${primaryTotal.toFixed(2)}`);
      console.log(`   分销佣金总和: $${secondaryTotal.toFixed(2)}`);
    }
    
    // 4. 诊断结果
    console.log('\n\n🔍 诊断结果:');
    console.log('=' .repeat(60));
    console.log('可能的问题:');
    console.log('1. API代码中使用的字段名(commission_amount)与数据库字段名(total_commission)不匹配');
    console.log('2. 需要检查/client/src/services/api.js中的getSales方法');
    console.log('3. 确保返回的数据包含正确的字段名');
    
  } catch (error) {
    console.error('调试过程出错:', error);
  }
}

debugCommissionStats();