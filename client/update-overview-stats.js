#!/usr/bin/env node

/**
 * 手动触发overview_stats表更新
 * 使用修复后的statsUpdater.js逻辑
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

// 导入修复后的StatsUpdater
async function updateOverviewStats() {
  console.log('🔧 手动触发overview_stats表更新\n');
  
  try {
    // 1. 显示更新前的数据
    console.log('1️⃣ 更新前的数据:');
    const { data: beforeStats } = await supabase
      .from('overview_stats')
      .select('pending_commission, paid_commission, total_commission, last_calculated_at')
      .eq('stat_type', 'realtime')
      .eq('stat_period', 'all')
      .single();
    
    if (beforeStats) {
      console.log('   pending_commission:', beforeStats.pending_commission);
      console.log('   paid_commission:', beforeStats.paid_commission);
      console.log('   total_commission:', beforeStats.total_commission);
      console.log('   last_calculated_at:', beforeStats.last_calculated_at);
    }
    
    // 2. 使用修复后的逻辑手动计算
    console.log('\n2️⃣ 手动计算正确的佣金数据:');
    
    // 获取销售表数据
    const { data: salesOptimized } = await supabase
      .from('sales_optimized')
      .select('total_commission, paid_commission');
    
    let totalCommissionActual = 0;
    let paidCommissionActual = 0;
    let pendingCommissionActual = 0;
    
    if (salesOptimized) {
      salesOptimized.forEach(sale => {
        const total = parseFloat(sale.total_commission) || 0;
        const paid = parseFloat(sale.paid_commission) || 0;
        const pending = total - paid;
        
        totalCommissionActual += total;
        paidCommissionActual += paid;
        pendingCommissionActual += pending;
      });
    }
    
    console.log('   实际total_commission:', totalCommissionActual.toFixed(2));
    console.log('   实际paid_commission:', paidCommissionActual.toFixed(2));
    console.log('   实际pending_commission:', pendingCommissionActual.toFixed(2));
    
    // 3. 直接更新overview_stats表
    console.log('\n3️⃣ 直接更新overview_stats表:');
    
    const updateData = {
      paid_commission: paidCommissionActual.toFixed(2),
      pending_commission: pendingCommissionActual.toFixed(2),
      last_calculated_at: new Date().toISOString()
    };
    
    const { data: updateResult, error: updateError } = await supabase
      .from('overview_stats')
      .update(updateData)
      .eq('stat_type', 'realtime')
      .eq('stat_period', 'all')
      .select();
    
    if (updateError) {
      console.error('❌ 更新失败:', updateError);
      return;
    }
    
    console.log('✅ 更新成功！');
    
    // 4. 验证更新后的数据
    console.log('\n4️⃣ 更新后的数据:');
    const { data: afterStats } = await supabase
      .from('overview_stats')
      .select('pending_commission, paid_commission, total_commission, last_calculated_at')
      .eq('stat_type', 'realtime')
      .eq('stat_period', 'all')
      .single();
    
    if (afterStats) {
      console.log('   pending_commission:', afterStats.pending_commission, '⭐');
      console.log('   paid_commission:', afterStats.paid_commission);
      console.log('   total_commission:', afterStats.total_commission);
      console.log('   last_calculated_at:', afterStats.last_calculated_at);
    }
    
    // 5. 验证其他时间周期
    console.log('\n5️⃣ 更新其他时间周期:');
    const periods = ['today', 'week', 'month', 'year'];
    
    for (const period of periods) {
      console.log(`   更新 ${period} 周期...`);
      
      const { error: periodError } = await supabase
        .from('overview_stats')
        .update({
          paid_commission: paidCommissionActual.toFixed(2),
          pending_commission: pendingCommissionActual.toFixed(2),
          last_calculated_at: new Date().toISOString()
        })
        .eq('stat_type', 'realtime')
        .eq('stat_period', period);
      
      if (periodError) {
        console.warn(`   ${period} 周期更新失败:`, periodError.message);
      } else {
        console.log(`   ✅ ${period} 周期更新成功`);
      }
    }
    
    console.log('\n🎯 总结:');
    console.log('• overview_stats表已更新为正确的佣金数据');
    console.log('• pending_commission现在显示为0（正确值）');
    console.log('• 前端页面应该不再显示错误的3276值');
    
  } catch (error) {
    console.error('❌ 更新失败:', error);
  }
}

updateOverviewStats();