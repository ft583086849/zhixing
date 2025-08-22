#!/usr/bin/env node
/**
 * 🔍 检查数据概览页面统计为0的问题
 * 用户反馈：一级/二级/独立销售业绩都是0
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://itvmeamoqthfqtkpubdv.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0dm1lYW1vcXRoZnF0a3B1YmR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0ODEyMzUsImV4cCI6MjA3MDA1NzIzNX0.ypBF3lJJTJtSPLEu1zWXqPorS-FDSZzRUy_0ge_Y-r0';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

console.log('🔍 检查数据概览统计问题...\n');

async function checkOverviewStats() {
  try {
    // 1. 检查 sales_optimized 表的统计数据
    console.log('📊 1. 检查 sales_optimized 表数据...');
    
    const { data: salesStats, error } = await supabase
      .from('sales_optimized')
      .select('sales_type, total_orders, total_amount, total_commission, pending_commission')
      .order('total_amount', { ascending: false })
      .limit(10);
    
    if (error) {
      console.error('❌ 查询销售统计失败:', error);
      return;
    }
    
    console.log(`✅ 获取到 ${salesStats.length} 个销售数据`);
    
    // 按销售类型分类统计
    const statsByType = {
      primary: { count: 0, totalAmount: 0, totalCommission: 0, pendingCommission: 0 },
      secondary: { count: 0, totalAmount: 0, totalCommission: 0, pendingCommission: 0 },
      independent: { count: 0, totalAmount: 0, totalCommission: 0, pendingCommission: 0 }
    };
    
    salesStats.forEach(sale => {
      const type = sale.sales_type;
      if (statsByType[type]) {
        statsByType[type].count++;
        statsByType[type].totalAmount += parseFloat(sale.total_amount || 0);
        statsByType[type].totalCommission += parseFloat(sale.total_commission || 0);
        statsByType[type].pendingCommission += parseFloat(sale.pending_commission || 0);
      }
    });
    
    console.log('\n销售类型统计:');
    Object.entries(statsByType).forEach(([type, stats]) => {
      console.log(`${type}销售:`);
      console.log(`  - 人数: ${stats.count}`);
      console.log(`  - 总金额: $${stats.totalAmount.toFixed(2)}`);
      console.log(`  - 总佣金: $${stats.totalCommission.toFixed(2)}`);
      console.log(`  - 待返佣金: $${stats.pendingCommission.toFixed(2)}`);
    });
    
    // 2. 检查 Top5 销售排行
    console.log('\n📊 2. 检查 Top5 销售排行...');
    
    const topSales = salesStats.slice(0, 5);
    console.log('Top5 销售业绩:');
    topSales.forEach((sale, index) => {
      console.log(`${index + 1}. ${sale.sales_type}销售:`);
      console.log(`   - 总金额: $${sale.total_amount || 0}`);
      console.log(`   - 总佣金: $${sale.total_commission || 0}`);
      console.log(`   - 待返佣金: $${sale.pending_commission || 0}`);
    });
    
    // 3. 检查资金统计中的待返佣金
    console.log('\n📊 3. 检查资金统计...');
    
    // 计算系统总的待返佣金
    const totalPendingCommission = salesStats.reduce((sum, sale) => 
      sum + parseFloat(sale.pending_commission || 0), 0
    );
    
    console.log(`系统总待返佣金: $${totalPendingCommission.toFixed(2)}`);
    
    // 4. 对比订单数据验证
    console.log('\n📊 4. 对比订单数据验证...');
    
    const { data: orderStats } = await supabase
      .from('orders_optimized')
      .select('sales_code, amount, status, primary_commission_amount, secondary_commission_amount')
      .in('status', ['confirmed_config', 'active']);
    
    if (orderStats) {
      const orderTotalAmount = orderStats.reduce((sum, order) => 
        sum + parseFloat(order.amount || 0), 0
      );
      
      const orderTotalCommission = orderStats.reduce((sum, order) => {
        const primary = parseFloat(order.primary_commission_amount || 0);
        const secondary = parseFloat(order.secondary_commission_amount || 0);
        return sum + primary + secondary;
      }, 0);
      
      console.log(`✅ 已确认订单统计:`);
      console.log(`   - 订单数: ${orderStats.length}`);
      console.log(`   - 总金额: $${orderTotalAmount.toFixed(2)}`);
      console.log(`   - 总佣金: $${orderTotalCommission.toFixed(2)}`);
      
      // 对比分析
      const salesTotalAmount = statsByType.primary.totalAmount + 
                              statsByType.secondary.totalAmount + 
                              statsByType.independent.totalAmount;
      
      const salesTotalCommission = statsByType.primary.totalCommission + 
                                  statsByType.secondary.totalCommission + 
                                  statsByType.independent.totalCommission;
      
      console.log(`\n🔍 数据一致性检查:`);
      console.log(`   销售表总金额: $${salesTotalAmount.toFixed(2)}`);
      console.log(`   订单表总金额: $${orderTotalAmount.toFixed(2)}`);
      console.log(`   销售表总佣金: $${salesTotalCommission.toFixed(2)}`);
      console.log(`   订单表总佣金: $${orderTotalCommission.toFixed(2)}`);
      
      if (Math.abs(salesTotalAmount - orderTotalAmount) > 1) {
        console.log('❌ 金额数据不一致！');
      } else {
        console.log('✅ 金额数据一致');
      }
    }
    
    // 5. 检查数据为0的原因
    console.log('\n📊 5. 分析数据为0的可能原因...');
    
    const zeroDataCount = salesStats.filter(sale => 
      parseFloat(sale.total_amount || 0) === 0 && 
      parseFloat(sale.total_commission || 0) === 0
    ).length;
    
    console.log(`有 ${zeroDataCount}/${salesStats.length} 个销售的统计数据为0`);
    
    if (statsByType.primary.totalAmount === 0 && 
        statsByType.secondary.totalAmount === 0 && 
        statsByType.independent.totalAmount === 0) {
      console.log('❌ 所有销售类型的业绩都为0');
      console.log('🔧 可能原因:');
      console.log('   1. sales_optimized 表的统计字段没有更新');
      console.log('   2. 触发器或定时任务没有执行');
      console.log('   3. 数据同步出现问题');
      console.log('   4. 查询条件或字段名不正确');
    } else {
      console.log('✅ 至少部分销售类型有业绩数据');
    }

  } catch (error) {
    console.error('❌ 检查过程中出现错误:', error);
  }
}

// 执行检查
checkOverviewStats()
  .then(() => {
    console.log('\n✅ 检查完成');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ 检查失败:', error);
    process.exit(1);
  });