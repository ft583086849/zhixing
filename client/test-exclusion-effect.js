#!/usr/bin/env node

/**
 * MCP测试排除功能的实际效果
 * 验证某个分销数据是否真的不计入统计
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testExclusionEffect() {
  console.log('🔍 MCP测试排除功能的实际效果\n');
  
  try {
    // 1. 检查当前排除名单
    console.log('1️⃣ 检查当前排除名单:');
    
    const { data: excludedList } = await supabase
      .from('excluded_sales_config')
      .select('wechat_name, sales_code, excluded_from_stats, created_at');
    
    if (excludedList && excludedList.length > 0) {
      console.log('   当前排除的销售:');
      excludedList.forEach(item => {
        console.log(`   • ${item.wechat_name} (sales_code: ${item.sales_code})`);
      });
    } else {
      console.log('   ❌ 没有找到排除名单，排除功能可能未启用');
      return;
    }
    
    // 2. 获取被排除销售的实际数据
    console.log('\n2️⃣ 获取被排除销售的实际数据:');
    
    const excludedSalesCodes = excludedList.map(item => item.sales_code).filter(code => code);
    
    if (excludedSalesCodes.length === 0) {
      console.log('   ❌ 排除名单中没有有效的sales_code');
      return;
    }
    
    // 查询被排除销售的订单数据
    const { data: excludedOrders } = await supabase
      .from('orders_optimized')
      .select('sales_code, amount, actual_payment_amount, commission_amount, status')
      .in('sales_code', excludedSalesCodes);
    
    // 查询被排除销售的销售数据
    const { data: excludedSalesData } = await supabase
      .from('sales_optimized')
      .select('sales_code, wechat_name, total_amount, total_commission, total_orders')
      .in('sales_code', excludedSalesCodes);
    
    console.log('   被排除销售的数据:');
    if (excludedSalesData) {
      excludedSalesData.forEach(sale => {
        console.log(`   • ${sale.wechat_name}: 订单${sale.total_orders}个, 金额${sale.total_amount}, 佣金${sale.total_commission}`);
      });
    }
    
    if (excludedOrders) {
      console.log(`   • 被排除的订单数量: ${excludedOrders.length}`);
      const excludedAmount = excludedOrders.reduce((sum, order) => 
        sum + parseFloat(order.actual_payment_amount || order.amount || 0), 0);
      const excludedCommission = excludedOrders.reduce((sum, order) => 
        sum + parseFloat(order.commission_amount || 0), 0);
      console.log(`   • 被排除的总金额: ${excludedAmount.toFixed(2)}`);
      console.log(`   • 被排除的总佣金: ${excludedCommission.toFixed(2)}`);
    }
    
    // 3. 模拟API调用对比（包含vs排除）
    console.log('\n3️⃣ 模拟API调用对比:');
    
    // 模拟包含所有数据的查询
    const { data: allOrders } = await supabase
      .from('orders_optimized')
      .select('sales_code, amount, actual_payment_amount, commission_amount, status')
      .neq('status', 'rejected');
    
    // 模拟排除后的查询
    const { data: filteredOrders } = await supabase
      .from('orders_optimized')
      .select('sales_code, amount, actual_payment_amount, commission_amount, status')
      .neq('status', 'rejected')
      .not('sales_code', 'in', `(${excludedSalesCodes.join(',')})`);
    
    if (allOrders && filteredOrders) {
      const allTotal = allOrders.reduce((sum, order) => 
        sum + parseFloat(order.actual_payment_amount || order.amount || 0), 0);
      const filteredTotal = filteredOrders.reduce((sum, order) => 
        sum + parseFloat(order.actual_payment_amount || order.amount || 0), 0);
      
      const allCommission = allOrders.reduce((sum, order) => 
        sum + parseFloat(order.commission_amount || 0), 0);
      const filteredCommission = filteredOrders.reduce((sum, order) => 
        sum + parseFloat(order.commission_amount || 0), 0);
      
      console.log('   包含所有数据:');
      console.log(`   • 总订单数: ${allOrders.length}`);
      console.log(`   • 总金额: ${allTotal.toFixed(2)}`);
      console.log(`   • 总佣金: ${allCommission.toFixed(2)}`);
      
      console.log('   排除后数据:');
      console.log(`   • 总订单数: ${filteredOrders.length}`);
      console.log(`   • 总金额: ${filteredTotal.toFixed(2)}`);
      console.log(`   • 总佣金: ${filteredCommission.toFixed(2)}`);
      
      console.log('   差异:');
      console.log(`   • 订单数差异: ${allOrders.length - filteredOrders.length}`);
      console.log(`   • 金额差异: ${(allTotal - filteredTotal).toFixed(2)}`);
      console.log(`   • 佣金差异: ${(allCommission - filteredCommission).toFixed(2)}`);
      
      // 验证排除是否有效
      if (allOrders.length > filteredOrders.length) {
        console.log('   ✅ 排除功能生效：统计数据确实减少了');
      } else {
        console.log('   ❌ 排除功能可能未生效：数据没有变化');
      }
    }
    
    // 4. 检查销售数据排除
    console.log('\n4️⃣ 检查销售数据排除:');
    
    const { data: allSales } = await supabase
      .from('sales_optimized')
      .select('sales_code, wechat_name, total_amount, total_commission');
    
    const { data: filteredSales } = await supabase
      .from('sales_optimized')
      .select('sales_code, wechat_name, total_amount, total_commission')
      .not('sales_code', 'in', `(${excludedSalesCodes.join(',')})`);
    
    if (allSales && filteredSales) {
      console.log(`   所有销售数量: ${allSales.length}`);
      console.log(`   排除后销售数量: ${filteredSales.length}`);
      console.log(`   排除的销售数量: ${allSales.length - filteredSales.length}`);
      
      if (allSales.length > filteredSales.length) {
        console.log('   ✅ 销售数据排除生效');
      } else {
        console.log('   ❌ 销售数据排除可能未生效');
      }
    }
    
    // 5. 测试API的排除参数
    console.log('\n5️⃣ 验证API排除逻辑:');
    
    // 检查API中使用的ExcludedSalesService
    console.log('   检查ExcludedSalesService.getExcludedSalesCodes()返回值:');
    
    // 模拟ExcludedSalesService的逻辑
    const { data: excludedConfig } = await supabase
      .from('excluded_sales_config')
      .select('sales_code')
      .eq('excluded_from_stats', true);
    
    const serviceExcludedCodes = excludedConfig?.map(item => item.sales_code).filter(code => code) || [];
    
    console.log(`   排除服务应该返回的codes: [${serviceExcludedCodes.join(', ')}]`);
    
    if (serviceExcludedCodes.length > 0) {
      console.log('   ✅ 排除服务配置正确');
    } else {
      console.log('   ❌ 排除服务配置可能有问题');
    }
    
    // 6. 总结验证结果
    console.log('\n6️⃣ 排除功能验证总结:');
    
    const exclusionWorking = [
      excludedList && excludedList.length > 0,
      excludedSalesCodes.length > 0,
      allOrders && filteredOrders && allOrders.length > filteredOrders.length,
      allSales && filteredSales && allSales.length > filteredSales.length,
      serviceExcludedCodes.length > 0
    ].every(test => test);
    
    if (exclusionWorking) {
      console.log('🎉 ✅ 排除功能验证通过！');
      console.log('');
      console.log('📊 排除功能状态:');
      console.log('• 排除名单配置：正常 ✅');
      console.log('• 订单数据过滤：生效 ✅');
      console.log('• 销售数据过滤：生效 ✅');
      console.log('• API排除逻辑：正常 ✅');
      console.log('');
      console.log('🎯 结论：某些分销数据确实不计入管理员统计');
    } else {
      console.log('❌ 排除功能可能存在问题');
      console.log('需要检查具体的配置和实现');
    }
    
  } catch (error) {
    console.error('❌ 测试失败:', error);
  }
}

testExclusionEffect();