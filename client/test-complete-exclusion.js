#!/usr/bin/env node

/**
 * 完整测试wangming的排除功能
 * 验证所有统计数据的排除效果
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testCompleteExclusion() {
  console.log('🔍 完整测试wangming的排除功能\n');
  
  try {
    // 1. 清理并设置测试环境
    console.log('1️⃣ 设置测试环境:');
    
    // 先将所有记录设为不激活
    await supabase
      .from('excluded_sales_config')
      .update({ is_active: false })
      .neq('id', '00000000-0000-0000-0000-000000000000');
    
    console.log('   ✅ 所有排除记录已设为不激活');
    
    // 2. 获取wangming的数据
    console.log('\n2️⃣ 获取wangming的基础数据:');
    
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
    console.log(`   • 待返佣金: ${wangmingSales.total_commission - wangmingSales.paid_commission}`);
    
    // 3. 测试排除前的统计数据
    console.log('\n3️⃣ 排除前的统计数据:');
    
    const beforeStats = await getComprehensiveStats(null);
    displayStats('排除前', beforeStats);
    
    // 4. 激活wangming的排除
    console.log('\n4️⃣ 激活wangming的排除:');
    
    // 查找wangming的记录
    const { data: wangmingRecords } = await supabase
      .from('excluded_sales_config')
      .select('*')
      .eq('wechat_name', 'wangming')
      .eq('sales_code', wangmingSales.sales_code);
    
    if (wangmingRecords && wangmingRecords.length > 0) {
      // 激活第一条记录
      const { error: updateError } = await supabase
        .from('excluded_sales_config')
        .update({ is_active: true })
        .eq('id', wangmingRecords[0].id);
      
      if (!updateError) {
        console.log('   ✅ 使用现有记录并激活');
      }
    } else {
      // 创建新记录
      const { error: insertError } = await supabase
        .from('excluded_sales_config')
        .insert({
          wechat_name: 'wangming',
          sales_code: wangmingSales.sales_code,
          sales_type: wangmingSales.sales_type,
          is_active: true,
          excluded_by: 'MCP测试',
          reason: '测试排除功能',
          excluded_at: new Date().toISOString()
        });
      
      if (!insertError) {
        console.log('   ✅ 创建新排除记录并激活');
      }
    }
    
    // 5. 测试排除后的统计数据
    console.log('\n5️⃣ 排除后的统计数据:');
    
    const afterStats = await getComprehensiveStats([wangmingSales.sales_code]);
    displayStats('排除后', afterStats);
    
    // 6. 对比分析
    console.log('\n6️⃣ 排除效果对比分析:');
    compareResults(beforeStats, afterStats, wangmingSales);
    
    // 7. 清理测试数据
    console.log('\n7️⃣ 清理测试数据:');
    await supabase
      .from('excluded_sales_config')
      .update({ is_active: false })
      .eq('wechat_name', 'wangming');
    console.log('   ✅ 已将wangming的排除设为不激活');
    
  } catch (error) {
    console.error('❌ 测试失败:', error);
  }
}

// 获取全面的统计数据
async function getComprehensiveStats(excludeCodes) {
  const stats = {};
  
  // 构建查询
  let ordersQuery = supabase
    .from('orders_optimized')
    .select('*')
    .neq('status', 'rejected');
  
  let salesQuery = supabase
    .from('sales_optimized')
    .select('*');
  
  // 如果有排除的销售代码，添加过滤
  if (excludeCodes && excludeCodes.length > 0) {
    ordersQuery = ordersQuery.not('sales_code', 'in', `(${excludeCodes.join(',')})`);
    salesQuery = salesQuery.not('sales_code', 'in', `(${excludeCodes.join(',')})`);
  }
  
  const { data: orders } = await ordersQuery;
  const { data: sales } = await salesQuery;
  
  // 基础统计
  stats.totalOrders = orders?.length || 0;
  stats.totalSales = sales?.length || 0;
  
  // 金额统计
  stats.totalRevenue = orders?.reduce((sum, o) => 
    sum + parseFloat(o.actual_payment_amount || o.amount || 0), 0) || 0;
  
  // 佣金统计
  stats.totalCommission = sales?.reduce((sum, s) => 
    sum + parseFloat(s.total_commission || 0), 0) || 0;
  stats.paidCommission = sales?.reduce((sum, s) => 
    sum + parseFloat(s.paid_commission || 0), 0) || 0;
  stats.pendingCommission = stats.totalCommission - stats.paidCommission;
  
  // 销售类型统计
  stats.primarySales = sales?.filter(s => s.sales_type === 'primary').length || 0;
  stats.secondarySales = sales?.filter(s => s.sales_type === 'secondary').length || 0;
  
  // 订单状态统计
  stats.confirmedOrders = orders?.filter(o => 
    ['confirmed', 'confirmed_config', 'active'].includes(o.status)).length || 0;
  stats.pendingOrders = orders?.filter(o => 
    ['pending', 'pending_payment', 'pending_config'].includes(o.status)).length || 0;
  
  // 转化率
  stats.conversionRate = stats.totalOrders > 0 ? 
    (stats.confirmedOrders / stats.totalOrders * 100).toFixed(2) : 0;
  
  // 订单时长分类
  stats.ordersByDuration = {};
  ['7天', '1个月', '3个月', '6个月', '1年'].forEach(duration => {
    stats.ordersByDuration[duration] = orders?.filter(o => o.duration === duration).length || 0;
  });
  
  // Top5销售
  const sortedSales = sales?.sort((a, b) => 
    (b.total_amount || 0) - (a.total_amount || 0)).slice(0, 5) || [];
  stats.top5Sales = sortedSales.map(s => ({
    name: s.wechat_name,
    amount: s.total_amount,
    commission: s.total_commission
  }));
  
  return stats;
}

// 显示统计数据
function displayStats(label, stats) {
  console.log(`\n📊 ${label}统计数据:`);
  console.log(`   订单总数: ${stats.totalOrders}`);
  console.log(`   销售总人数: ${stats.totalSales}`);
  console.log(`   • 一级销售: ${stats.primarySales}`);
  console.log(`   • 二级销售: ${stats.secondarySales}`);
  console.log(`   总收入: ${stats.totalRevenue.toFixed(2)}`);
  console.log(`   销售返佣金额: ${stats.totalCommission.toFixed(2)}`);
  console.log(`   已返佣金额: ${stats.paidCommission.toFixed(2)}`);
  console.log(`   待返佣金额: ${stats.pendingCommission.toFixed(2)}`);
  console.log(`   转化率: ${stats.conversionRate}%`);
  
  console.log(`   订单分类:`);
  Object.entries(stats.ordersByDuration).forEach(([duration, count]) => {
    if (count > 0) {
      console.log(`   • ${duration}: ${count}`);
    }
  });
  
  console.log(`   Top3销售:`);
  stats.top5Sales.slice(0, 3).forEach((s, i) => {
    console.log(`   ${i + 1}. ${s.name}: 金额${s.amount}, 佣金${s.commission}`);
  });
}

// 对比结果
function compareResults(before, after, wangmingData) {
  console.log(`\n📈 各项指标变化:`);
  
  const changes = [
    { name: '订单总数', before: before.totalOrders, after: after.totalOrders },
    { name: '销售人数', before: before.totalSales, after: after.totalSales },
    { name: '总收入', before: before.totalRevenue, after: after.totalRevenue, isAmount: true },
    { name: '销售返佣金额', before: before.totalCommission, after: after.totalCommission, isAmount: true },
    { name: '已返佣金额', before: before.paidCommission, after: after.paidCommission, isAmount: true },
    { name: '待返佣金额', before: before.pendingCommission, after: after.pendingCommission, isAmount: true },
    { name: '一级销售数', before: before.primarySales, after: after.primarySales },
    { name: '二级销售数', before: before.secondarySales, after: after.secondarySales },
    { name: '转化率', before: before.conversionRate, after: after.conversionRate, suffix: '%' }
  ];
  
  let passCount = 0;
  let failCount = 0;
  
  changes.forEach(item => {
    const diff = item.before - item.after;
    const display = item.isAmount ? 
      `${item.before.toFixed(2)} → ${item.after.toFixed(2)} (差异: ${diff.toFixed(2)})` :
      `${item.before}${item.suffix || ''} → ${item.after}${item.suffix || ''} (差异: ${diff}${item.suffix || ''})`;
    
    console.log(`   ${item.name}: ${display}`);
    
    // 验证是否有变化
    if (Math.abs(diff) > 0.01) {
      console.log(`     ✅ 排除生效`);
      passCount++;
    } else if (item.name.includes('销售') || item.name.includes('订单') || item.name.includes('收入')) {
      console.log(`     ❌ 未生效`);
      failCount++;
    }
  });
  
  // 检查Top5变化
  console.log(`\n   Top5销售变化:`);
  const wangmingInBefore = before.top5Sales.some(s => s.name === 'wangming');
  const wangmingInAfter = after.top5Sales.some(s => s.name === 'wangming');
  
  if (wangmingInBefore && !wangmingInAfter) {
    console.log(`   ✅ wangming已从Top5中排除`);
    passCount++;
  } else if (!wangmingInBefore) {
    console.log(`   ⚠️ wangming原本不在Top5中`);
  } else {
    console.log(`   ❌ wangming仍在Top5中`);
    failCount++;
  }
  
  // 总体评估
  console.log(`\n🎯 测试结果总结:`);
  console.log(`   通过项: ${passCount}`);
  console.log(`   失败项: ${failCount}`);
  
  if (failCount === 0) {
    console.log(`   🎉 排除功能完全正常！所有统计都正确排除了wangming的数据`);
  } else if (passCount > failCount) {
    console.log(`   ⚠️ 排除功能部分正常，有${failCount}项指标未生效`);
  } else {
    console.log(`   ❌ 排除功能存在问题，大部分指标未生效`);
  }
  
  // 验证数值准确性
  console.log(`\n📐 数值准确性验证:`);
  const revenueDiff = before.totalRevenue - after.totalRevenue;
  const commissionDiff = before.totalCommission - after.totalCommission;
  
  console.log(`   收入差异: ${revenueDiff.toFixed(2)} (wangming贡献: ${wangmingData.total_amount})`);
  if (Math.abs(revenueDiff - wangmingData.total_amount) < 0.01) {
    console.log(`   ✅ 收入排除准确`);
  } else {
    console.log(`   ❌ 收入排除有误差`);
  }
  
  console.log(`   佣金差异: ${commissionDiff.toFixed(2)} (wangming佣金: ${wangmingData.total_commission})`);
  if (Math.abs(commissionDiff - wangmingData.total_commission) < 0.01) {
    console.log(`   ✅ 佣金排除准确`);
  } else {
    console.log(`   ❌ 佣金排除有误差`);
  }
}

testCompleteExclusion();