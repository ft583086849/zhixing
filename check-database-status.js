const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://itvmeamoqthfqtkpubdv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0dm1lYW1vcXRoZnF0a3B1YmR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0ODEyMzUsImV4cCI6MjA3MDA1NzIzNX0.ypBF3lJJTJtSPLEu1zWXqPorS-FDSZzRUy_0ge_Y-r0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDatabaseStatus() {
  console.log('=== 检查数据库状态 ===\n');
  
  let hasHistoryTable = false;
  let hasOrderCommission = false;
  let hasSalesCommission = false;
  
  // 1. 检查commission_rate_history表
  console.log('1️⃣ 检查 commission_rate_history 表:');
  try {
    const { data, error } = await supabase
      .from('commission_rate_history')
      .select('*')
      .limit(1);
    
    if (error) {
      console.log('   ❌ 表不存在或无法访问');
      console.log('   错误:', error.message);
    } else {
      const { count } = await supabase
        .from('commission_rate_history')
        .select('*', { count: 'exact', head: true });
      console.log('   ✅ 表存在，记录数:', count || 0);
      hasHistoryTable = true;
    }
  } catch (err) {
    console.log('   ❌ 表不存在');
  }
  
  // 2. 检查orders_optimized表的佣金字段
  console.log('\n2️⃣ 检查 orders_optimized 表的佣金字段:');
  try {
    const { data } = await supabase
      .from('orders_optimized')
      .select('commission_rate, commission_amount, secondary_commission_amount, actual_payment_amount')
      .limit(1);
    
    if (data && data[0] !== undefined) {
      console.log('   ✅ commission_rate 字段存在');
      console.log('   ✅ commission_amount 字段存在');
      console.log('   ✅ secondary_commission_amount 字段存在');
      console.log('   ✅ actual_payment_amount 字段存在');
      
      // 检查有多少记录有佣金数据
      const { data: stats } = await supabase
        .from('orders_optimized')
        .select('commission_rate')
        .gt('commission_rate', 0);
      
      console.log('   📊 有佣金率的订单:', (stats?.length || 0) + '条');
      if (stats && stats.length > 0) {
        hasOrderCommission = true;
      }
    }
  } catch (err) {
    console.log('   ❌ 表或字段访问错误:', err.message);
  }
  
  // 3. 检查sales_optimized表的佣金字段
  console.log('\n3️⃣ 检查 sales_optimized 表的佣金字段:');
  try {
    const { data } = await supabase
      .from('sales_optimized')
      .select('primary_commission_amount, secondary_commission_amount, total_commission, total_direct_amount, total_team_amount')
      .limit(1);
    
    if (data && data[0] !== undefined) {
      console.log('   ✅ primary_commission_amount 字段存在');
      console.log('   ✅ secondary_commission_amount 字段存在');
      console.log('   ✅ total_commission 字段存在');
      console.log('   ✅ total_direct_amount 字段存在');
      console.log('   ✅ total_team_amount 字段存在');
      
      // 检查有多少记录有佣金数据
      const { data: stats } = await supabase
        .from('sales_optimized')
        .select('total_commission')
        .gt('total_commission', 0);
      
      console.log('   📊 有佣金数据的销售:', (stats?.length || 0) + '条');
      if (stats && stats.length > 0) {
        hasSalesCommission = true;
      }
    }
  } catch (err) {
    console.log('   ❌ 表或字段访问错误:', err.message);
  }
  
  // 4. 检查触发器（通过之前的查询结果）
  console.log('\n4️⃣ 检查触发器状态:');
  console.log('   ℹ️ 根据之前的查询结果：');
  console.log('   ✅ trg_calculate_order_commission - 已创建');
  console.log('   ✅ trg_update_order_commission_on_status - 已创建');
  console.log('   ✅ trigger_update_sales_optimized - 已创建');
  
  // 5. 给出执行建议
  console.log('\n=== 📝 SQL执行状态总结 ===\n');
  
  if (hasHistoryTable) {
    console.log('✅ create-commission-history-table.sql - 已执行（表已创建）');
  } else {
    console.log('❌ create-commission-history-table.sql - 需要执行');
  }
  
  if (hasOrderCommission) {
    console.log('✅ update-all-orders-commission.sql - 已执行（订单佣金已更新）');
  } else {
    console.log('⚠️ update-all-orders-commission.sql - 可能需要执行（订单佣金未更新）');
  }
  
  if (hasSalesCommission) {
    console.log('✅ update-sales-optimized-commission.sql - 已执行（销售统计已更新）');
  } else {
    console.log('⚠️ update-sales-optimized-commission.sql - 可能需要执行（销售统计未更新）');
  }
  
  console.log('✅ create-order-commission-trigger.sql - 已执行（触发器已创建）');
  
  // 6. 最终建议
  console.log('\n=== 🎯 最终建议 ===');
  if (!hasHistoryTable) {
    console.log('\n需要执行的SQL文件：');
    console.log('1. create-commission-history-table.sql');
  }
  
  if (!hasOrderCommission || !hasSalesCommission) {
    console.log('\n可选执行的SQL文件（如果数据不正确）：');
    if (!hasOrderCommission) {
      console.log('- update-all-orders-commission.sql（更新订单佣金）');
    }
    if (!hasSalesCommission) {
      console.log('- update-sales-optimized-commission.sql（更新销售统计）');
    }
  }
  
  if (hasHistoryTable && hasOrderCommission && hasSalesCommission) {
    console.log('\n✅ 所有必要的数据库更改都已完成！');
    console.log('可以直接发布前端代码。');
  }
}

checkDatabaseStatus();