#!/usr/bin/env node
/**
 * 🔍 调试订单管理页面销售信息显示为空的问题
 * 
 * 问题现象：
 * 1. 订单管理list里的销售信息（微信号和销售类型）显示为空
 * 2. 一级销售佣金和二级分销佣金额也是空的
 */

const { createClient } = require('@supabase/supabase-js');

// 直接使用生产环境的Supabase配置
const supabaseUrl = 'https://itvmeamoqthfqtkpubdv.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0dm1lYW1vcXRoZnF0a3B1YmR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0ODEyMzUsImV4cCI6MjA3MDA1NzIzNX0.ypBF3lJJTJtSPLEu1zWXqPorS-FDSZzRUy_0ge_Y-r0';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

console.log('🔍 开始调试订单管理页面销售信息显示问题...\n');

async function debugOrdersDisplayIssue() {
  try {
    console.log('📊 1. 检查 orders_optimized 表的数据结构...');
    
    // 检查 orders_optimized 表的结构和数据
    const { data: sampleOrder, error: orderError } = await supabase
      .from('orders_optimized')
      .select('*')
      .limit(1);
    
    if (orderError) {
      console.error('❌ 查询 orders_optimized 表失败:', orderError);
      return;
    }
    
    if (sampleOrder && sampleOrder.length > 0) {
      console.log('✅ orders_optimized 表样例数据结构:');
      console.log('字段列表:', Object.keys(sampleOrder[0]));
      
      // 检查关键字段
      const order = sampleOrder[0];
      console.log('\n🔍 关键字段检查:');
      console.log('- id:', order.id);
      console.log('- sales_code:', order.sales_code);
      console.log('- sales_wechat_name:', order.sales_wechat_name || '❌ 未找到');
      console.log('- primary_commission_amount:', order.primary_commission_amount || '❌ 未找到');
      console.log('- secondary_commission_amount:', order.secondary_commission_amount || '❌ 未找到');
    } else {
      console.log('❌ orders_optimized 表没有数据');
      return;
    }

    console.log('\n📊 2. 检查 sales_optimized 表的数据结构...');
    
    // 检查 sales_optimized 表的结构和数据
    const { data: sampleSales, error: salesError } = await supabase
      .from('sales_optimized')
      .select('*')
      .limit(3);
    
    if (salesError) {
      console.error('❌ 查询 sales_optimized 表失败:', salesError);
      return;
    }
    
    if (sampleSales && sampleSales.length > 0) {
      console.log('✅ sales_optimized 表样例数据结构:');
      console.log('字段列表:', Object.keys(sampleSales[0]));
      
      // 显示几条销售数据
      console.log('\n🔍 销售数据样例:');
      sampleSales.forEach((sale, index) => {
        console.log(`销售 ${index + 1}:`, {
          id: sale.id,
          sales_code: sale.sales_code,
          wechat_name: sale.wechat_name,
          sales_type: sale.sales_type,
          commission_rate: sale.commission_rate
        });
      });
    } else {
      console.log('❌ sales_optimized 表没有数据');
      return;
    }

    console.log('\n📊 3. 检查订单和销售数据的关联关系...');
    
    // 检查有销售代码的订单
    const { data: ordersWithSales, error: ordersError } = await supabase
      .from('orders_optimized')
      .select('id, sales_code, customer_wechat, amount, status')
      .not('sales_code', 'is', null)
      .limit(5);
    
    if (ordersError) {
      console.error('❌ 查询有销售代码的订单失败:', ordersError);
      return;
    }
    
    console.log(`✅ 找到 ${ordersWithSales?.length || 0} 个有销售代码的订单`);
    
    if (ordersWithSales && ordersWithSales.length > 0) {
      for (const order of ordersWithSales) {
        console.log(`\n🔍 订单 #${order.id}:`);
        console.log('- sales_code:', order.sales_code);
        console.log('- customer_wechat:', order.customer_wechat);
        console.log('- amount:', order.amount);
        console.log('- status:', order.status);
        
        // 查找对应的销售信息
        const { data: salesInfo } = await supabase
          .from('sales_optimized')
          .select('*')
          .eq('sales_code', order.sales_code);
        
        if (salesInfo && salesInfo.length > 0) {
          const sale = salesInfo[0];
          console.log('- 对应销售信息:');
          console.log('  * wechat_name:', sale.wechat_name);
          console.log('  * sales_type:', sale.sales_type);
          console.log('  * commission_rate:', sale.commission_rate);
          console.log('  * pending_commission:', sale.pending_commission);
        } else {
          console.log('- ❌ 未找到对应的销售信息!');
        }
      }
    }

    console.log('\n📊 4. 分析问题原因...');
    console.log('🔍 根据分析发现的问题：');
    console.log('1. orders_optimized 表中可能缺少 sales_wechat_name 字段');
    console.log('2. orders_optimized 表中可能缺少 primary_commission_amount 和 secondary_commission_amount 字段');
    console.log('3. 前端代码期望这些字段直接存在于订单记录中，而不是通过 JOIN 查询获取');

    console.log('\n📊 5. 检查 orders_optimized 表是否有预计算的销售信息字段...');
    
    // 检查表结构中是否有这些字段
    const { data: tableColumns, error: schemaError } = await supabase
      .rpc('get_table_columns', { table_name: 'orders_optimized' });
    
    if (!schemaError && tableColumns) {
      console.log('✅ orders_optimized 表的所有字段:');
      tableColumns.forEach(col => {
        console.log(`- ${col.column_name}: ${col.data_type}`);
      });
    } else {
      console.log('⚠️ 无法获取表结构信息');
    }

    console.log('\n📊 6. 测试修复方案...');
    console.log('建议的修复方案：');
    console.log('1. 在 getOrdersWithFilters 函数中添加 JOIN 查询销售信息');
    console.log('2. 或者在 orders_optimized 表中添加冗余字段存储销售信息');
    console.log('3. 更新 processOrders 函数正确处理销售信息关联');

  } catch (error) {
    console.error('❌ 调试过程中出现错误:', error);
  }
}

// 执行调试
debugOrdersDisplayIssue()
  .then(() => {
    console.log('\n✅ 调试完成');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ 调试失败:', error);
    process.exit(1);
  });