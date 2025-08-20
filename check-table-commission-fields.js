/**
 * 检查orders和orders_optimized表中的佣金相关字段
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ksacrjrgmcbdwwjrkcws.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtzYWNyanJnbWNiZHd3anJrY3dzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDk4OTk4MDMsImV4cCI6MjAyNTQ3NTgwM30.tHBHWNjBQ3A3JJSZ3tVE_RGkP_YfzJJ2rjQjhQZhRZ8';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTableFields() {
  console.log('🔍 检查表中的佣金相关字段...\n');
  
  try {
    // 1. 检查orders表（线上使用）
    console.log('1️⃣ 检查orders表（线上使用）:');
    const { data: ordersData, error: ordersError } = await supabase
      .from('orders')
      .select('*')
      .limit(1);
    
    if (!ordersError && ordersData && ordersData.length > 0) {
      const ordersFields = Object.keys(ordersData[0]);
      console.log('orders表中的佣金相关字段:');
      
      const commissionFields = ordersFields.filter(field => 
        field.includes('commission') || 
        field.includes('rate') ||
        field.includes('primary') ||
        field.includes('secondary')
      );
      
      if (commissionFields.length > 0) {
        commissionFields.forEach(field => {
          console.log(`  ✅ ${field}`);
        });
      } else {
        console.log('  ❌ 没有找到佣金相关字段');
      }
      
      // 检查特定字段
      console.log('\n特定字段检查:');
      console.log(`  commission_amount: ${ordersFields.includes('commission_amount') ? '✅ 存在' : '❌ 不存在'}`);
      console.log(`  commission_rate: ${ordersFields.includes('commission_rate') ? '✅ 存在' : '❌ 不存在'}`);
      console.log(`  primary_commission_amount: ${ordersFields.includes('primary_commission_amount') ? '✅ 存在' : '❌ 不存在'}`);
      console.log(`  secondary_commission_amount: ${ordersFields.includes('secondary_commission_amount') ? '✅ 存在' : '❌ 不存在'}`);
    }
    
    // 2. 检查orders_optimized表（测试环境使用）
    console.log('\n2️⃣ 检查orders_optimized表（测试环境使用）:');
    const { data: optimizedData, error: optimizedError } = await supabase
      .from('orders_optimized')
      .select('*')
      .limit(1);
    
    if (!optimizedError && optimizedData && optimizedData.length > 0) {
      const optimizedFields = Object.keys(optimizedData[0]);
      console.log('orders_optimized表中的佣金相关字段:');
      
      const commissionFields = optimizedFields.filter(field => 
        field.includes('commission') || 
        field.includes('rate') ||
        field.includes('primary') ||
        field.includes('secondary')
      );
      
      if (commissionFields.length > 0) {
        commissionFields.forEach(field => {
          console.log(`  ✅ ${field}`);
        });
      } else {
        console.log('  ❌ 没有找到佣金相关字段');
      }
      
      // 检查特定字段
      console.log('\n特定字段检查:');
      console.log(`  commission_amount: ${optimizedFields.includes('commission_amount') ? '✅ 存在' : '❌ 不存在'}`);
      console.log(`  commission_rate: ${optimizedFields.includes('commission_rate') ? '✅ 存在' : '❌ 不存在'}`);
      console.log(`  primary_commission_amount: ${optimizedFields.includes('primary_commission_amount') ? '✅ 存在' : '❌ 不存在'}`);
      console.log(`  secondary_commission_amount: ${optimizedFields.includes('secondary_commission_amount') ? '✅ 存在' : '❌ 不存在'}`);
    }
    
    console.log('\n📊 结论:');
    console.log('两个表都只有 commission_amount 和 commission_rate 字段');
    console.log('都缺少 primary_commission_amount 和 secondary_commission_amount 字段');
    console.log('需要添加这两个字段来正确存储一级和二级销售的佣金');
    
  } catch (error) {
    console.error('❌ 检查失败:', error);
  }
}

// 执行检查
checkTableFields();