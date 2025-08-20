#!/usr/bin/env node

/**
 * 调试待返佣金计算问题
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugPendingCommission() {
  console.log('🔍 调试待返佣金计算问题\n');
  
  try {
    // 1. 从订单层面计算佣金
    console.log('1️⃣ 从订单层面计算佣金:');
    const { data: orders } = await supabase
      .from('orders_optimized')
      .select('*')
      .neq('status', 'rejected');
    
    let orderBasedCommission = 0;
    let orderBasedPending = 0;
    
    if (orders) {
      orders.forEach(order => {
        // 一级佣金
        const primaryCommission = parseFloat(order.primary_sales_commission || order.primary_commission || 0);
        const primaryPaid = parseFloat(order.primary_commission_paid || 0);
        
        // 二级佣金
        const secondaryCommission = parseFloat(order.secondary_sales_commission || order.secondary_commission || 0);
        const secondaryPaid = parseFloat(order.secondary_commission_paid || 0);
        
        const totalOrderCommission = primaryCommission + secondaryCommission;
        const totalOrderPaid = primaryPaid + secondaryPaid;
        const orderPending = totalOrderCommission - totalOrderPaid;
        
        orderBasedCommission += totalOrderCommission;
        orderBasedPending += orderPending;
        
        if (orderPending > 0) {
          console.log(`   订单 ${order.id.substring(0, 8)}: 应返=${totalOrderCommission}, 已返=${totalOrderPaid}, 待返=${orderPending}`);
        }
      });
    }
    
    console.log(`\n   订单层面统计:`);
    console.log(`   应返佣金: ${orderBasedCommission}`);
    console.log(`   待返佣金: ${orderBasedPending}`);
    
    // 2. 从销售层面计算佣金
    console.log('\n2️⃣ 从销售层面计算佣金:');
    const { data: sales } = await supabase
      .from('sales_optimized')
      .select('*');
    
    let salesBasedCommission = 0;
    let salesBasedPending = 0;
    
    if (sales) {
      sales.forEach(sale => {
        const commission = parseFloat(sale.total_commission || 0);
        const paid = parseFloat(sale.paid_commission || 0);
        const pending = commission - paid;
        
        salesBasedCommission += commission;
        salesBasedPending += pending;
        
        if (pending > 0) {
          console.log(`   ${sale.wechat_name}: 应返=${commission}, 已返=${paid}, 待返=${pending}`);
        }
      });
    }
    
    console.log(`\n   销售层面统计:`);
    console.log(`   应返佣金: ${salesBasedCommission}`);
    console.log(`   待返佣金: ${salesBasedPending}`);
    
    // 3. 检查是否有pending状态的订单佣金
    console.log('\n3️⃣ 检查未确认订单的佣金:');
    const { data: pendingOrders } = await supabase
      .from('orders_optimized')
      .select('*')
      .in('status', ['pending_payment', 'pending_config', 'confirmed_payment']);
    
    let pendingOrdersCommission = 0;
    
    if (pendingOrders) {
      pendingOrders.forEach(order => {
        const commission = parseFloat(order.primary_sales_commission || 0) + 
                          parseFloat(order.secondary_sales_commission || 0);
        if (commission > 0) {
          pendingOrdersCommission += commission;
          console.log(`   订单 ${order.id.substring(0, 8)} (${order.status}): 佣金=${commission}`);
        }
      });
    }
    
    console.log(`\n   未确认订单的佣金总额: ${pendingOrdersCommission}`);
    console.log('   注：这可能被算作"待返佣金"');
    
    // 4. 检查佣金字段
    console.log('\n4️⃣ 检查订单表的佣金字段:');
    if (orders && orders.length > 0) {
      const sampleOrder = orders[0];
      console.log('   示例订单字段:');
      Object.keys(sampleOrder).forEach(key => {
        if (key.includes('commission') || key.includes('佣金')) {
          console.log(`   - ${key}: ${sampleOrder[key]}`);
        }
      });
    }
    
    // 5. 分析差异
    console.log('\n5️⃣ 分析差异:');
    console.log(`   订单层面待返: ${orderBasedPending}`);
    console.log(`   销售层面待返: ${salesBasedPending}`);
    console.log(`   未确认订单佣金: ${pendingOrdersCommission}`);
    
    // 如果是3276美元，可能的计算
    const usdAmount = 3276;
    const possibleRMB = usdAmount * 7.15; // 假设汇率7.15
    console.log(`\n   如果显示${usdAmount}美元，对应人民币约: ${possibleRMB.toFixed(2)}`);
    
    // 可能是把所有应返佣金当成待返了？
    if (Math.abs(salesBasedCommission - possibleRMB) < 100) {
      console.log('   ⚠️ 可能把所有应返佣金都当成待返佣金了！');
    }
    
    if (Math.abs(pendingOrdersCommission - possibleRMB) < 100) {
      console.log('   ⚠️ 可能把未确认订单的佣金当成待返佣金了！');
    }
    
  } catch (error) {
    console.error('❌ 调试失败:', error);
  }
}

debugPendingCommission();