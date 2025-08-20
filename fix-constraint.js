const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://itvmeamoqthfqtkpubdv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0dm1lYW1vcXRoZnF0a3B1YmR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0ODEyMzUsImV4cCI6MjA3MDA1NzIzNX0.ypBF3lJJTJtSPLEu1zWXqPorS-FDSZzRUy_0ge_Y-r0'
);

async function fixConstraint() {
  console.log('🔧 修复overview_stats表的约束问题...\n');
  
  try {
    // 1. 删除现有数据
    console.log('1️⃣ 删除现有数据...');
    const { error: deleteError } = await supabase
      .from('overview_stats')
      .delete()
      .eq('stat_type', 'realtime');
    
    if (deleteError) {
      console.log('⚠️ 删除失败（可能没有数据）:', deleteError.message);
    } else {
      console.log('✅ 现有数据已清除');
    }
    
    // 2. 使用insert而不是upsert来插入数据
    console.log('\n2️⃣ 插入初始数据...');
    
    const periods = ['all', 'today', 'week', 'month', 'year'];
    
    for (const period of periods) {
      const statsData = {
        stat_type: 'realtime',
        stat_period: period,
        total_orders: 0,
        today_orders: 0,
        pending_payment_orders: 0,
        confirmed_payment_orders: 0,
        pending_config_orders: 0,
        confirmed_config_orders: 0,
        rejected_orders: 0,
        active_orders: 0,
        total_amount: 0,
        today_amount: 0,
        confirmed_amount: 0,
        total_commission: 0,
        paid_commission: 0,
        pending_commission: 0,
        primary_sales_count: 0,
        secondary_sales_count: 0,
        independent_sales_count: 0,
        active_sales_count: 0,
        free_trial_orders: 0,
        one_month_orders: 0,
        three_month_orders: 0,
        six_month_orders: 0,
        yearly_orders: 0,
        free_trial_percentage: 0,
        one_month_percentage: 0,
        three_month_percentage: 0,
        six_month_percentage: 0,
        yearly_percentage: 0,
        last_calculated_at: new Date().toISOString(),
        calculation_duration_ms: 0,
        data_version: 1
      };
      
      // 先尝试删除
      await supabase
        .from('overview_stats')
        .delete()
        .eq('stat_type', 'realtime')
        .eq('stat_period', period);
      
      // 然后插入
      const { error: insertError } = await supabase
        .from('overview_stats')
        .insert(statsData);
      
      if (insertError) {
        console.log(`❌ ${period} 插入失败:`, insertError.message);
      } else {
        console.log(`✅ ${period} 数据已插入`);
      }
    }
    
    // 3. 验证数据
    console.log('\n3️⃣ 验证数据...');
    const { data: verifyData, error: verifyError } = await supabase
      .from('overview_stats')
      .select('stat_period, last_calculated_at')
      .eq('stat_type', 'realtime');
    
    if (!verifyError && verifyData) {
      console.log('✅ 数据验证成功，当前记录:');
      verifyData.forEach(record => {
        console.log(`   - ${record.stat_period}: ${record.last_calculated_at}`);
      });
    }
    
    console.log('\n✨ 修复完成！');
    
  } catch (error) {
    console.error('❌ 修复失败:', error);
  }
}

fixConstraint();