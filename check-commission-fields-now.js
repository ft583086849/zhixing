#!/usr/bin/env node

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

async function checkCommissionFields() {
  try {
    const { SupabaseService } = await import('./client/src/services/supabase.js');
    const supabase = SupabaseService.supabase;
    
    console.log('🔍 检查订单表的佣金字段...');
    
    // 获取几个订单看看有哪些字段
    const { data, error } = await supabase
      .from('orders_optimized')
      .select('*')
      .in('status', ['confirmed_config', 'confirmed_configuration', 'active'])
      .limit(5);
    
    if (error) {
      console.error('❌ 查询失败:', error);
      return;
    }
    
    if (data && data.length > 0) {
      console.log(`\n✅ 找到 ${data.length} 个订单，佣金字段如下：`);
      
      data.forEach((order, index) => {
        console.log(`\n📋 订单 ${index + 1} (ID: ${order.id}):`);
        console.log(`  - sales_code: ${order.sales_code}`);
        console.log(`  - amount: ${order.amount}`);
        console.log(`  - commission_amount: ${order.commission_amount || '❌ 字段不存在'}`);
        console.log(`  - primary_commission_amount: ${order.primary_commission_amount || '❌ 字段不存在'}`);
        console.log(`  - secondary_commission_amount: ${order.secondary_commission_amount || '❌ 字段不存在'}`);
        
        // 列出所有包含commission的字段
        const commissionFields = Object.keys(order).filter(key => key.includes('commission'));
        if (commissionFields.length > 0) {
          console.log(`  - 所有佣金相关字段:`, commissionFields);
        }
      });
    } else {
      console.log('⚠️ 没有找到符合条件的订单');
    }
    
  } catch (err) {
    console.error('❌ 执行出错:', err.message);
  }
}

checkCommissionFields();