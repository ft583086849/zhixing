#!/usr/bin/env node

/**
 * 全面分析系统中的佣金字段和计算逻辑
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function analyzeCommissionSystem() {
  console.log('🔍 全面分析佣金系统\n');
  
  try {
    // 1. 检查orders_optimized表的佣金字段
    console.log('1️⃣ orders_optimized表的佣金字段:');
    const { data: orderSample } = await supabase
      .from('orders_optimized')
      .select('*')
      .limit(1);
    
    if (orderSample && orderSample.length > 0) {
      const order = orderSample[0];
      console.log('   佣金相关字段:');
      Object.keys(order).forEach(key => {
        if (key.includes('commission') || key.includes('佣金')) {
          console.log(`   - ${key}: ${typeof order[key]} (值: ${order[key]})`);
        }
      });
    }
    
    // 2. 检查sales_optimized表的佣金字段
    console.log('\n2️⃣ sales_optimized表的佣金字段:');
    const { data: salesSample } = await supabase
      .from('sales_optimized')
      .select('*')
      .limit(1);
    
    if (salesSample && salesSample.length > 0) {
      const sale = salesSample[0];
      console.log('   佣金相关字段:');
      Object.keys(sale).forEach(key => {
        if (key.includes('commission') || key.includes('paid') || key.includes('佣金')) {
          console.log(`   - ${key}: ${typeof sale[key]} (值: ${sale[key]})`);
        }
      });
    }
    
    // 3. 统计orders_optimized表的佣金数据
    console.log('\n3️⃣ 订单表佣金统计:');
    const { data: orders } = await supabase
      .from('orders_optimized')
      .select('commission_amount, primary_commission_amount, secondary_commission_amount, status')
      .neq('status', 'rejected');
    
    if (orders) {
      let commission_sum = 0;
      let primary_sum = 0;
      let secondary_sum = 0;
      
      orders.forEach(o => {
        commission_sum += parseFloat(o.commission_amount || 0);
        primary_sum += parseFloat(o.primary_commission_amount || 0);
        secondary_sum += parseFloat(o.secondary_commission_amount || 0);
      });
      
      console.log(`   commission_amount总和: ${commission_sum}`);
      console.log(`   primary_commission_amount总和: ${primary_sum}`);
      console.log(`   secondary_commission_amount总和: ${secondary_sum}`);
    }
    
    // 4. 统计sales_optimized表的佣金数据
    console.log('\n4️⃣ 销售表佣金统计:');
    const { data: sales } = await supabase
      .from('sales_optimized')
      .select('wechat_name, total_commission, paid_commission');
    
    if (sales) {
      let total_commission_sum = 0;
      let paid_commission_sum = 0;
      let pending_commission_sum = 0;
      
      sales.forEach(s => {
        const total = parseFloat(s.total_commission || 0);
        const paid = parseFloat(s.paid_commission || 0);
        const pending = total - paid;
        
        total_commission_sum += total;
        paid_commission_sum += paid;
        pending_commission_sum += pending;
        
        if (total > 0) {
          console.log(`   ${s.wechat_name}: 应返=${total}, 已返=${paid}, 待返=${pending}`);
        }
      });
      
      console.log(`\n   汇总:`);
      console.log(`   total_commission总和: ${total_commission_sum}`);
      console.log(`   paid_commission总和: ${paid_commission_sum}`);
      console.log(`   待返佣金(total-paid): ${pending_commission_sum}`);
    }
    
    // 5. 检查是否有其他相关表
    console.log('\n5️⃣ 其他可能的佣金相关表:');
    const tables = ['commission_history', 'payment_records', 'commission_records'];
    
    for (const table of tables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(1);
        
        if (!error && data) {
          console.log(`   ✅ ${table}表存在`);
          if (data.length > 0) {
            console.log(`      字段:`, Object.keys(data[0]).filter(k => 
              k.includes('commission') || k.includes('amount') || k.includes('paid')
            ));
          }
        } else {
          console.log(`   ❌ ${table}表不存在或无权限`);
        }
      } catch (e) {
        // 表不存在
      }
    }
    
    console.log('\n📊 字段关系分析:');
    console.log('orders_optimized表:');
    console.log('  - commission_amount: 订单的总佣金（一级+二级）');
    console.log('  - primary_commission_amount: 一级销售佣金');
    console.log('  - secondary_commission_amount: 二级销售佣金');
    console.log('  - commission_rate: 佣金率');
    console.log('  - secondary_commission_rate: 二级佣金率');
    
    console.log('\nsales_optimized表:');
    console.log('  - total_commission: 应返佣金总额');
    console.log('  - paid_commission: 已返佣金总额');
    console.log('  - 待返佣金 = total_commission - paid_commission（计算得出）');
    
    console.log('\n⚠️ 关键发现:');
    console.log('• 订单表存储的是每个订单的佣金明细');
    console.log('• 销售表存储的是每个销售的佣金汇总');
    console.log('• 待返佣金应该从销售表计算，不是订单表');
    
  } catch (error) {
    console.error('分析失败:', error);
  }
}

analyzeCommissionSystem();