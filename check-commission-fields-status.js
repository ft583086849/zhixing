#!/usr/bin/env node
/**
 * 🔍 检查佣金字段的数据状态
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://itvmeamoqthfqtkpubdv.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0dm1lYW1vcXRoZnF0a3B1YmR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0ODEyMzUsImV4cCI6MjA3MDA1NzIzNX0.ypBF3lJJTJtSPLEu1zWXqPorS-FDSZzRUy_0ge_Y-r0';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

console.log('🔍 检查佣金字段数据状态...\n');

async function checkCommissionFields() {
  try {
    // 1. 检查 orders_optimized 表中有佣金数据的订单
    console.log('📊 1. 检查有佣金数据的订单...');
    
    const { data: ordersWithCommission, error } = await supabase
      .from('orders_optimized')
      .select('id, sales_code, amount, status, primary_commission_amount, secondary_commission_amount, commission_amount')
      .or('primary_commission_amount.gt.0,secondary_commission_amount.gt.0')
      .limit(10);
    
    if (error) {
      console.error('❌ 查询失败:', error);
      return;
    }
    
    console.log(`✅ 找到 ${ordersWithCommission.length} 个有佣金的订单`);
    
    if (ordersWithCommission.length > 0) {
      console.log('\n佣金数据样例:');
      ordersWithCommission.forEach((order, index) => {
        console.log(`订单 ${index + 1}:`);
        console.log(`- ID: ${order.id}`);
        console.log(`- sales_code: ${order.sales_code}`);
        console.log(`- amount: $${order.amount}`);
        console.log(`- status: ${order.status}`);
        console.log(`- primary_commission_amount: ${order.primary_commission_amount || 'null'}`);
        console.log(`- secondary_commission_amount: ${order.secondary_commission_amount || 'null'}`);
        console.log(`- commission_amount (旧字段): ${order.commission_amount || 'null'}`);
        console.log('---');
      });
    }
    
    // 2. 检查所有订单的佣金字段分布情况
    console.log('\n📊 2. 检查佣金字段分布...');
    
    const { data: allOrders, error: allError } = await supabase
      .from('orders_optimized')
      .select('id, primary_commission_amount, secondary_commission_amount, commission_amount, status, amount')
      .not('sales_code', 'is', null);
    
    if (allError) {
      console.error('❌ 查询失败:', allError);
      return;
    }
    
    console.log(`✅ 总计查询 ${allOrders.length} 个有销售代码的订单`);
    
    // 统计佣金字段情况
    const stats = {
      total: allOrders.length,
      hasPrimaryCommission: 0,
      hasSecondaryCommission: 0,
      hasOldCommission: 0,
      noCommission: 0
    };
    
    allOrders.forEach(order => {
      if (order.primary_commission_amount && order.primary_commission_amount > 0) {
        stats.hasPrimaryCommission++;
      }
      if (order.secondary_commission_amount && order.secondary_commission_amount > 0) {
        stats.hasSecondaryCommission++;
      }
      if (order.commission_amount && order.commission_amount > 0) {
        stats.hasOldCommission++;
      }
      if ((!order.primary_commission_amount || order.primary_commission_amount === 0) &&
          (!order.secondary_commission_amount || order.secondary_commission_amount === 0) &&
          (!order.commission_amount || order.commission_amount === 0)) {
        stats.noCommission++;
      }
    });
    
    console.log('\n佣金字段分布统计:');
    console.log(`- 有一级销售佣金: ${stats.hasPrimaryCommission} 个`);
    console.log(`- 有二级销售佣金: ${stats.hasSecondaryCommission} 个`);
    console.log(`- 有旧佣金字段: ${stats.hasOldCommission} 个`);
    console.log(`- 无佣金数据: ${stats.noCommission} 个`);
    
    // 3. 检查具体的订单状态和佣金关系
    console.log('\n📊 3. 检查已确认订单的佣金情况...');
    
    const { data: confirmedOrders } = await supabase
      .from('orders_optimized')
      .select('id, sales_code, amount, status, primary_commission_amount, secondary_commission_amount')
      .eq('status', 'confirmed_config')
      .limit(5);
    
    if (confirmedOrders && confirmedOrders.length > 0) {
      console.log(`✅ 找到 ${confirmedOrders.length} 个已确认的订单`);
      confirmedOrders.forEach(order => {
        console.log(`订单 #${order.id}: amount=$${order.amount}, primary_commission=${order.primary_commission_amount || '0'}, secondary_commission=${order.secondary_commission_amount || '0'}`);
      });
    } else {
      console.log('⚠️ 没有找到已确认的订单');
    }
    
    // 4. 分析问题并给出建议
    console.log('\n📊 4. 问题分析和建议...');
    
    if (stats.noCommission > stats.hasPrimaryCommission + stats.hasSecondaryCommission) {
      console.log('❌ 问题：大部分订单缺少佣金数据');
      console.log('🔧 建议：需要运行佣金计算脚本来填充佣金字段');
      
      // 检查是否有佣金计算触发器
      console.log('\n检查是否需要触发佣金计算...');
      
      const sampleOrder = confirmedOrders && confirmedOrders.length > 0 ? confirmedOrders[0] : null;
      if (sampleOrder && (!sampleOrder.primary_commission_amount && !sampleOrder.secondary_commission_amount)) {
        console.log('❌ 已确认订单也没有佣金，需要修复佣金计算逻辑');
      }
    } else {
      console.log('✅ 佣金数据看起来正常');
    }

  } catch (error) {
    console.error('❌ 检查过程中出现错误:', error);
  }
}

// 执行检查
checkCommissionFields()
  .then(() => {
    console.log('\n✅ 检查完成');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ 检查失败:', error);
    process.exit(1);
  });