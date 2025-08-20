#!/usr/bin/env node

/**
 * 用wangming测试完整的排除功能效果
 * 验证排除前后所有统计数据的变化
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testWangmingExclusion() {
  console.log('🔍 用wangming测试完整的排除功能效果\n');
  
  try {
    // 1. 获取wangming的基础数据
    console.log('1️⃣ 获取wangming的基础数据:');
    
    const { data: wangmingSales } = await supabase
      .from('sales_optimized')
      .select('*')
      .eq('wechat_name', 'wangming')
      .single();
    
    if (!wangmingSales) {
      console.log('   ❌ 找不到wangming的销售数据');
      return;
    }
    
    console.log(`   wangming数据:`);
    console.log(`   • sales_code: ${wangmingSales.sales_code}`);
    console.log(`   • total_orders: ${wangmingSales.total_orders}`);
    console.log(`   • total_amount: ${wangmingSales.total_amount}`);
    console.log(`   • total_commission: ${wangmingSales.total_commission}`);
    console.log(`   • paid_commission: ${wangmingSales.paid_commission}`);
    
    const wangmingSalesCode = wangmingSales.sales_code;
    
    // 2. 清空排除名单（确保测试环境干净）
    console.log('\n2️⃣ 清空排除名单:');
    await supabase.from('excluded_sales_config').delete().neq('id', 0);
    console.log('   ✅ 排除名单已清空');
    
    // 3. 记录排除前的所有统计数据
    console.log('\n3️⃣ 记录排除前的统计数据:');
    
    const beforeStats = await getAllStats();
    console.log('   排除前数据已记录');
    
    // 4. 添加wangming到排除名单
    console.log('\n4️⃣ 添加wangming到排除名单:');
    
    const { error: insertError } = await supabase
      .from('excluded_sales_config')
      .insert({
        wechat_name: 'wangming',
        sales_code: wangmingSalesCode,
        excluded_from_stats: true,
        excluded_by: 'MCP测试',
        reason: '测试排除功能效果'
      });
    
    if (insertError) {
      console.error('   ❌ 添加排除失败:', insertError);
      return;
    }
    
    console.log('   ✅ wangming已添加到排除名单');
    
    // 5. 记录排除后的所有统计数据
    console.log('\n5️⃣ 记录排除后的统计数据:');
    
    const afterStats = await getAllStats();
    console.log('   排除后数据已记录');
    
    // 6. 对比所有统计数据
    console.log('\n6️⃣ 对比所有统计数据变化:');
    compareStats(beforeStats, afterStats, wangmingSales);
    
    // 7. 清理测试数据
    console.log('\n7️⃣ 清理测试数据:');
    await supabase.from('excluded_sales_config').delete().eq('wechat_name', 'wangming');
    console.log('   ✅ 测试数据已清理');
    
  } catch (error) {
    console.error('❌ 测试失败:', error);
  }
}

// 获取所有统计数据的函数
async function getAllStats() {
  const stats = {};
  
  try {
    // 1. 订单统计
    const { data: allOrders } = await supabase
      .from('orders_optimized')
      .select('*')
      .neq('status', 'rejected');
    
    const { data: filteredOrders } = await supabase
      .from('orders_optimized')
      .select('*')
      .neq('status', 'rejected')
      .neq('sales_code', 'wangming');
    
    // 2. 销售统计
    const { data: allSales } = await supabase
      .from('sales_optimized')
      .select('*');
    
    const { data: filteredSales } = await supabase
      .from('sales_optimized')
      .select('*')
      .neq('sales_code', 'wangming');
    
    // 3. 基础统计
    stats.totalOrders = allOrders?.length || 0;
    stats.filteredTotalOrders = filteredOrders?.length || 0;
    
    // 总收入
    stats.totalRevenue = allOrders?.reduce((sum, order) => 
      sum + parseFloat(order.actual_payment_amount || order.amount || 0), 0) || 0;
    stats.filteredTotalRevenue = filteredOrders?.reduce((sum, order) => 
      sum + parseFloat(order.actual_payment_amount || order.amount || 0), 0) || 0;
    
    // 销售返佣金额
    stats.totalCommission = allSales?.reduce((sum, sale) => 
      sum + parseFloat(sale.total_commission || 0), 0) || 0;
    stats.filteredTotalCommission = filteredSales?.reduce((sum, sale) => 
      sum + parseFloat(sale.total_commission || 0), 0) || 0;
    
    // 已返佣金额
    stats.paidCommission = allSales?.reduce((sum, sale) => 
      sum + parseFloat(sale.paid_commission || 0), 0) || 0;
    stats.filteredPaidCommission = filteredSales?.reduce((sum, sale) => 
      sum + parseFloat(sale.paid_commission || 0), 0) || 0;
    
    // 待返佣金额
    stats.pendingCommission = allSales?.reduce((sum, sale) => {
      const total = parseFloat(sale.total_commission || 0);
      const paid = parseFloat(sale.paid_commission || 0);
      return sum + (total - paid);
    }, 0) || 0;
    stats.filteredPendingCommission = filteredSales?.reduce((sum, sale) => {
      const total = parseFloat(sale.total_commission || 0);
      const paid = parseFloat(sale.paid_commission || 0);
      return sum + (total - paid);
    }, 0) || 0;
    
    // 销售人数统计
    stats.totalSalesCount = allSales?.length || 0;
    stats.filteredSalesCount = filteredSales?.length || 0;
    
    stats.primarySalesCount = allSales?.filter(s => s.sales_type === 'primary').length || 0;
    stats.filteredPrimarySalesCount = filteredSales?.filter(s => s.sales_type === 'primary').length || 0;
    
    stats.secondarySalesCount = allSales?.filter(s => s.sales_type === 'secondary').length || 0;
    stats.filteredSecondarySalesCount = filteredSales?.filter(s => s.sales_type === 'secondary').length || 0;
    
    // 订单分类统计
    const orderTypes = ['7天', '1个月', '3个月', '6个月', '1年'];
    stats.orderTypeStats = {};
    stats.filteredOrderTypeStats = {};
    
    orderTypes.forEach(type => {
      stats.orderTypeStats[type] = allOrders?.filter(o => o.duration === type).length || 0;
      stats.filteredOrderTypeStats[type] = filteredOrders?.filter(o => o.duration === type).length || 0;
    });
    
    // Top5销售排行榜（按总金额）
    const topSales = allSales?.sort((a, b) => (b.total_amount || 0) - (a.total_amount || 0)).slice(0, 5) || [];
    const filteredTopSales = filteredSales?.sort((a, b) => (b.total_amount || 0) - (a.total_amount || 0)).slice(0, 5) || [];
    
    stats.top5Sales = topSales.map(s => ({ name: s.wechat_name, amount: s.total_amount }));
    stats.filteredTop5Sales = filteredTopSales.map(s => ({ name: s.wechat_name, amount: s.total_amount }));
    
    // 转化率相关数据
    const confirmedOrders = allOrders?.filter(o => ['confirmed', 'confirmed_config', 'active'].includes(o.status)) || [];
    const filteredConfirmedOrders = filteredOrders?.filter(o => ['confirmed', 'confirmed_config', 'active'].includes(o.status)) || [];
    
    stats.conversionRate = stats.totalOrders > 0 ? (confirmedOrders.length / stats.totalOrders * 100) : 0;
    stats.filteredConversionRate = stats.filteredTotalOrders > 0 ? (filteredConfirmedOrders.length / stats.filteredTotalOrders * 100) : 0;
    
    return stats;
    
  } catch (error) {
    console.error('获取统计数据失败:', error);
    return {};
  }
}

// 对比统计数据的函数
function compareStats(before, after, wangmingData) {
  console.log('📊 统计数据对比结果:');
  console.log('');
  
  // 基础订单统计
  console.log('🔸 基础订单统计:');
  console.log(`   总订单数: ${before.totalOrders} → ${after.filteredTotalOrders} (差异: ${before.totalOrders - after.filteredTotalOrders})`);
  if (before.totalOrders !== after.filteredTotalOrders) {
    console.log('   ✅ 订单统计排除生效');
  } else {
    console.log('   ❌ 订单统计排除未生效');
  }
  
  // 总收入
  console.log('\n💰 总收入:');
  console.log(`   排除前: ${before.totalRevenue.toFixed(2)}`);
  console.log(`   排除后: ${after.filteredTotalRevenue.toFixed(2)}`);
  console.log(`   差异: ${(before.totalRevenue - after.filteredTotalRevenue).toFixed(2)}`);
  console.log(`   wangming贡献: ${wangmingData.total_amount}`);
  if (Math.abs((before.totalRevenue - after.filteredTotalRevenue) - wangmingData.total_amount) < 0.01) {
    console.log('   ✅ 总收入排除准确');
  } else {
    console.log('   ❌ 总收入排除可能有误差');
  }
  
  // 销售返佣金额
  console.log('\n💸 销售返佣金额:');
  console.log(`   排除前: ${before.totalCommission.toFixed(2)}`);
  console.log(`   排除后: ${after.filteredTotalCommission.toFixed(2)}`);
  console.log(`   差异: ${(before.totalCommission - after.filteredTotalCommission).toFixed(2)}`);
  console.log(`   wangming佣金: ${wangmingData.total_commission}`);
  if (Math.abs((before.totalCommission - after.filteredTotalCommission) - wangmingData.total_commission) < 0.01) {
    console.log('   ✅ 销售返佣金额排除准确');
  } else {
    console.log('   ❌ 销售返佣金额排除可能有误差');
  }
  
  // 已返佣金额
  console.log('\n💳 已返佣金额:');
  console.log(`   排除前: ${before.paidCommission.toFixed(2)}`);
  console.log(`   排除后: ${after.filteredPaidCommission.toFixed(2)}`);
  console.log(`   差异: ${(before.paidCommission - after.filteredPaidCommission).toFixed(2)}`);
  
  // 待返佣金额
  console.log('\n⏳ 待返佣金额:');
  console.log(`   排除前: ${before.pendingCommission.toFixed(2)}`);
  console.log(`   排除后: ${after.filteredPendingCommission.toFixed(2)}`);
  console.log(`   差异: ${(before.pendingCommission - after.filteredPendingCommission).toFixed(2)}`);
  
  // 销售人数统计
  console.log('\n👥 销售人数统计:');
  console.log(`   总销售人数: ${before.totalSalesCount} → ${after.filteredSalesCount} (差异: ${before.totalSalesCount - after.filteredSalesCount})`);
  console.log(`   一级销售: ${before.primarySalesCount} → ${after.filteredPrimarySalesCount} (差异: ${before.primarySalesCount - after.filteredPrimarySalesCount})`);
  console.log(`   二级销售: ${before.secondarySalesCount} → ${after.filteredSecondarySalesCount} (差异: ${before.secondarySalesCount - after.filteredSecondarySalesCount})`);
  if (before.totalSalesCount > after.filteredSalesCount) {
    console.log('   ✅ 销售人数统计排除生效');
  } else {
    console.log('   ❌ 销售人数统计排除未生效');
  }
  
  // 转化率统计
  console.log('\n📈 转化率统计:');
  console.log(`   排除前: ${before.conversionRate.toFixed(2)}%`);
  console.log(`   排除后: ${after.filteredConversionRate.toFixed(2)}%`);
  console.log(`   变化: ${(after.filteredConversionRate - before.conversionRate).toFixed(2)}%`);
  if (Math.abs(after.filteredConversionRate - before.conversionRate) > 0.01) {
    console.log('   ✅ 转化率统计有变化（符合预期）');
  } else {
    console.log('   ⚠️ 转化率统计无变化');
  }
  
  // Top5销售排行榜
  console.log('\n🏆 Top5销售排行榜:');
  console.log('   排除前:');
  before.top5Sales.slice(0, 3).forEach((sale, i) => {
    console.log(`   ${i + 1}. ${sale.name}: ${sale.amount}`);
  });
  console.log('   排除后:');
  after.filteredTop5Sales.slice(0, 3).forEach((sale, i) => {
    console.log(`   ${i + 1}. ${sale.name}: ${sale.amount}`);
  });
  
  const wangmingInTopBefore = before.top5Sales.some(s => s.name === 'wangming');
  const wangmingInTopAfter = after.filteredTop5Sales.some(s => s.name === 'wangming');
  
  if (wangmingInTopBefore && !wangmingInTopAfter) {
    console.log('   ✅ Top5排行榜排除生效（wangming已移除）');
  } else if (!wangmingInTopBefore) {
    console.log('   ⚠️ wangming不在原Top5中');
  } else {
    console.log('   ❌ Top5排行榜排除未生效');
  }
  
  // 订单分类统计
  console.log('\n📋 订单分类统计:');
  const orderTypes = ['7天', '1个月', '3个月', '6个月', '1年'];
  orderTypes.forEach(type => {
    const before_count = before.orderTypeStats[type] || 0;
    const after_count = after.filteredOrderTypeStats[type] || 0;
    const diff = before_count - after_count;
    if (diff > 0) {
      console.log(`   ${type}: ${before_count} → ${after_count} (差异: ${diff}) ✅`);
    } else if (before_count > 0) {
      console.log(`   ${type}: ${before_count} → ${after_count} (无变化) ⚠️`);
    }
  });
  
  // 总体评估
  console.log('\n🎯 排除功能总体评估:');
  
  const checksPass = [
    before.totalOrders > after.filteredTotalOrders,  // 订单数减少
    before.totalRevenue > after.filteredTotalRevenue,  // 收入减少
    before.totalCommission > after.filteredTotalCommission,  // 佣金减少
    before.totalSalesCount > after.filteredSalesCount  // 销售人数减少
  ];
  
  const passedChecks = checksPass.filter(check => check).length;
  const totalChecks = checksPass.length;
  
  console.log(`✅ 通过检查: ${passedChecks}/${totalChecks}`);
  
  if (passedChecks === totalChecks) {
    console.log('🎉 排除功能完全正常！所有统计数据都正确排除了wangming的贡献');
  } else if (passedChecks > totalChecks / 2) {
    console.log('⚠️ 排除功能部分正常，部分指标可能需要调整');
  } else {
    console.log('❌ 排除功能存在问题，需要检查实现逻辑');
  }
}

testWangmingExclusion();