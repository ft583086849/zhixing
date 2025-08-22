/**
 * 详细检查数据库订单和销售信息关联问题
 */

const { createClient } = require('@supabase/supabase-js');

// Supabase配置
const supabaseUrl = 'https://itvmeamoqthfqtkpubdv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0dm1lYW1vcXRoZnF0a3B1YmR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0ODEyMzUsImV4cCI6MjA3MDA1NzIzNX0.ypBF3lJJTJtSPLEu1zWXqPorS-FDSZzRUy_0ge_Y-r0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkOrderSalesRelation() {
  console.log('🔍 详细检查订单和销售信息关联问题...\n');
  
  try {
    // 1. 检查订单记录示例（修正字段名）
    console.log('=== 1. 检查订单记录示例 ===');
    const { data: orders, error: ordersError } = await supabase
      .from('orders_optimized')
      .select('id, order_number, sales_code, amount, commission_amount, primary_commission_amount, secondary_commission_amount, status, created_at')
      .limit(5);
      
    if (ordersError) {
      console.error('❌ 查询订单记录失败:', ordersError.message);
    } else {
      console.log('✅ 订单记录示例：');
      orders.forEach((order, index) => {
        console.log(`\n📋 订单 ${index + 1}:`);
        console.log(`  - id: ${order.id}`);
        console.log(`  - order_number: ${order.order_number}`);
        console.log(`  - sales_code: ${order.sales_code}`);
        console.log(`  - amount: ${order.amount}`);
        console.log(`  - commission_amount: ${order.commission_amount}`);
        console.log(`  - primary_commission_amount: ${order.primary_commission_amount}`);
        console.log(`  - secondary_commission_amount: ${order.secondary_commission_amount}`);
        console.log(`  - status: ${order.status}`);
      });
    }
    
    // 2. 检查销售信息关联
    console.log('\n=== 2. 检查销售信息关联 ===');
    const { data: ordersWithSales, error: relationError } = await supabase
      .from('orders_optimized')
      .select('id, order_number, sales_code, status, amount')
      .neq('status', 'rejected')  // 排除被拒绝的订单
      .limit(5);
      
    if (relationError) {
      console.error('❌ 查询订单销售关联失败:', relationError.message);
    } else {
      console.log('✅ 订单销售关联检查：');
      for (const order of ordersWithSales) {
        console.log(`\n📦 订单 ${order.order_number} (ID: ${order.id}):`);
        console.log(`  - sales_code: ${order.sales_code}`);
        console.log(`  - status: ${order.status}`);
        console.log(`  - amount: ${order.amount}`);
        
        if (order.sales_code) {
          // 查找对应的销售信息
          const { data: salesInfo, error: salesInfoError } = await supabase
            .from('sales_optimized')
            .select('wechat_name, sales_type, commission_rate, name')
            .eq('sales_code', order.sales_code)
            .single();
            
          if (salesInfoError) {
            console.log(`  ❌ 找不到销售信息: ${salesInfoError.message}`);
            
            // 检查是否在其他销售表中
            const { data: primarySales, error: primaryError } = await supabase
              .from('primary_sales')
              .select('wechat_name, name')
              .eq('sales_code', order.sales_code)
              .single();
              
            if (primarySales) {
              console.log(`  ⚠️ 在 primary_sales 表中找到: ${primarySales.wechat_name || primarySales.name}`);
            }
          } else {
            console.log(`  ✅ 销售信息: ${salesInfo.wechat_name || salesInfo.name} (${salesInfo.sales_type}, 佣金率: ${salesInfo.commission_rate})`);
          }
        } else {
          console.log(`  ❌ 订单缺少 sales_code`);
        }
      }
    }
    
    // 3. 检查佣金字段是否有值的情况
    console.log('\n=== 3. 检查佣金字段数据情况 ===');
    
    // 查找有佣金的订单
    const { data: ordersWithCommission, error: commissionError } = await supabase
      .from('orders_optimized')
      .select('id, order_number, sales_code, amount, commission_amount, primary_commission_amount, secondary_commission_amount, status')
      .or('commission_amount.gt.0,primary_commission_amount.gt.0,secondary_commission_amount.gt.0')
      .limit(10);
      
    if (commissionError) {
      console.error('❌ 查询有佣金的订单失败:', commissionError.message);
    } else if (ordersWithCommission.length === 0) {
      console.log('❌ 没有找到有佣金的订单记录');
      
      // 统计各种状态的订单数量
      const { data: statusStats } = await supabase
        .from('orders_optimized')
        .select('status, count(*)')
        .group('status');
        
      console.log('\n📊 订单状态统计:');
      if (statusStats) {
        statusStats.forEach(stat => {
          console.log(`  - ${stat.status}: ${stat.count} 个订单`);
        });
      }
      
    } else {
      console.log(`✅ 找到 ${ordersWithCommission.length} 个有佣金的订单：`);
      ordersWithCommission.forEach((order, index) => {
        console.log(`\n💰 订单 ${index + 1}: ${order.order_number}`);
        console.log(`  - commission_amount: ${order.commission_amount}`);
        console.log(`  - primary_commission_amount: ${order.primary_commission_amount}`);
        console.log(`  - secondary_commission_amount: ${order.secondary_commission_amount}`);
        console.log(`  - status: ${order.status}`);
      });
    }
    
    // 4. 检查销售代码不匹配的问题
    console.log('\n=== 4. 检查销售代码匹配问题 ===');
    
    // 获取所有不同的销售代码
    const { data: orderSalesCodes } = await supabase
      .from('orders_optimized')
      .select('sales_code')
      .not('sales_code', 'is', null)
      .limit(50);
      
    const { data: salesCodes } = await supabase
      .from('sales_optimized')
      .select('sales_code');
      
    if (orderSalesCodes && salesCodes) {
      const orderCodesSet = new Set(orderSalesCodes.map(o => o.sales_code));
      const salesCodesSet = new Set(salesCodes.map(s => s.sales_code));
      
      const unmatchedOrderCodes = [...orderCodesSet].filter(code => !salesCodesSet.has(code));
      const unmatchedSalesCodes = [...salesCodesSet].filter(code => !orderCodesSet.has(code));
      
      console.log(`📊 销售代码匹配情况:`);
      console.log(`  - 订单中的销售代码数量: ${orderCodesSet.size}`);
      console.log(`  - 销售表中的销售代码数量: ${salesCodesSet.size}`);
      console.log(`  - 订单中无匹配销售的代码数量: ${unmatchedOrderCodes.length}`);
      console.log(`  - 销售表中无匹配订单的代码数量: ${unmatchedSalesCodes.length}`);
      
      if (unmatchedOrderCodes.length > 0) {
        console.log('\n❌ 订单中找不到匹配销售的代码（前5个）:');
        unmatchedOrderCodes.slice(0, 5).forEach(code => {
          console.log(`  - ${code}`);
        });
      }
    }
    
    // 5. 检查是否存在 commission_amount_primary 字段（题目中提到的）
    console.log('\n=== 5. 检查特定佣金字段 ===');
    const { data: sampleOrder, error: sampleError } = await supabase
      .from('orders_optimized')
      .select('*')
      .limit(1)
      .single();
      
    if (sampleOrder) {
      const allFields = Object.keys(sampleOrder);
      const commissionFields = allFields.filter(field => 
        field.toLowerCase().includes('commission')
      );
      
      console.log('💰 所有佣金相关字段:');
      commissionFields.forEach(field => {
        console.log(`  - ${field}: 存在`);
      });
      
      // 检查是否存在 commission_amount_primary
      if (allFields.includes('commission_amount_primary')) {
        console.log('✅ commission_amount_primary 字段存在');
      } else {
        console.log('❌ commission_amount_primary 字段不存在');
      }
      
      // 检查是否存在 secondary_commission_amount
      if (allFields.includes('secondary_commission_amount')) {
        console.log('✅ secondary_commission_amount 字段存在');
      } else {
        console.log('❌ secondary_commission_amount 字段不存在');
      }
    }
    
  } catch (error) {
    console.error('❌ 检查过程出错:', error.message);
  }
}

// 执行检查
checkOrderSalesRelation().then(() => {
  console.log('\n✅ 详细检查完成！');
  process.exit(0);
}).catch(error => {
  console.error('\n❌ 详细检查失败:', error.message);
  process.exit(1);
});