#!/usr/bin/env node
/**
 * 🧪 测试新增的 getSalesHierarchyStats API 函数
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://itvmeamoqthfqtkpubdv.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0dm1lYW1vcXRoZnF0a3B1YmR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0ODEyMzUsImV4cCI6MjA3MDA1NzIzNX0.ypBF3lJJTJtSPLEu1zWXqPorS-FDSZzRUy_0ge_Y-r0';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

console.log('🧪 测试 getSalesHierarchyStats API...\n');

// 模拟 AdminAPI.getSalesHierarchyStats 函数
async function testGetSalesHierarchyStats() {
  try {
    console.log('🔍 获取销售层级统计数据...');
    
    // 从 sales_optimized 表获取统计数据
    const { data: salesData, error } = await supabase
      .from('sales_optimized')
      .select('id, sales_type, total_orders, total_amount, total_commission, pending_commission, wechat_name');
    
    if (error) {
      console.error('获取销售层级统计失败:', error);
      throw error;
    }
    
    console.log(`✅ 获取到 ${salesData.length} 个销售数据`);
    
    // 按销售类型分类统计
    const stats = {
      // 一级销售统计
      primary_sales_count: 0,
      primary_sales_amount: 0,
      primary_sales_commission: 0,
      primary_sales_pending: 0,
      
      // 二级销售统计（有上级的）
      linked_secondary_sales_count: 0,
      linked_secondary_sales_amount: 0,
      linked_secondary_sales_commission: 0,
      linked_secondary_sales_pending: 0,
      
      // 独立销售统计（无上级的二级销售）
      independent_sales_count: 0,
      independent_sales_amount: 0,
      independent_sales_commission: 0,
      independent_sales_pending: 0
    };
    
    // 遍历销售数据进行统计
    salesData.forEach(sale => {
      const amount = parseFloat(sale.total_amount || 0);
      const commission = parseFloat(sale.total_commission || 0);
      const pending = parseFloat(sale.pending_commission || 0);
      
      console.log(`销售 ${sale.wechat_name}(${sale.sales_type}): amount=$${amount}, commission=$${commission}, pending=$${pending}`);
      
      if (sale.sales_type === 'primary') {
        // 一级销售
        stats.primary_sales_count++;
        stats.primary_sales_amount += amount;
        stats.primary_sales_commission += commission;
        stats.primary_sales_pending += pending;
      } else if (sale.sales_type === 'secondary') {
        // 二级销售（有上级）
        stats.linked_secondary_sales_count++;
        stats.linked_secondary_sales_amount += amount;
        stats.linked_secondary_sales_commission += commission;
        stats.linked_secondary_sales_pending += pending;
      } else if (sale.sales_type === 'independent') {
        // 独立销售
        stats.independent_sales_count++;
        stats.independent_sales_amount += amount;
        stats.independent_sales_commission += commission;
        stats.independent_sales_pending += pending;
      }
    });
    
    // 四舍五入到2位小数
    Object.keys(stats).forEach(key => {
      if (key.includes('amount') || key.includes('commission') || key.includes('pending')) {
        stats[key] = Math.round(stats[key] * 100) / 100;
      }
    });
    
    console.log('\n📊 销售层级统计结果:');
    console.log('一级销售:', {
      count: stats.primary_sales_count,
      amount: `$${stats.primary_sales_amount}`,
      commission: `$${stats.primary_sales_commission}`,
      pending: `$${stats.primary_sales_pending}`
    });
    
    console.log('二级销售:', {
      count: stats.linked_secondary_sales_count,
      amount: `$${stats.linked_secondary_sales_amount}`,
      commission: `$${stats.linked_secondary_sales_commission}`,
      pending: `$${stats.linked_secondary_sales_pending}`
    });
    
    console.log('独立销售:', {
      count: stats.independent_sales_count,
      amount: `$${stats.independent_sales_amount}`,
      commission: `$${stats.independent_sales_commission}`,
      pending: `$${stats.independent_sales_pending}`
    });
    
    // 检查是否还是0的问题
    const hasNonZeroData = stats.primary_sales_amount > 0 || 
                           stats.linked_secondary_sales_amount > 0 || 
                           stats.independent_sales_amount > 0;
    
    if (hasNonZeroData) {
      console.log('✅ 数据正常，不再是0！');
    } else {
      console.log('❌ 数据仍然都是0，需要检查原因');
    }
    
    return stats;
  } catch (error) {
    console.error('测试失败:', error);
  }
}

// 执行测试
testGetSalesHierarchyStats()
  .then(() => {
    console.log('\n✅ 测试完成');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ 测试失败:', error);
    process.exit(1);
  });