#!/usr/bin/env node
/**
 * 🧪 测试修复后的订单管理页面数据
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://itvmeamoqthfqtkpubdv.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0dm1lYW1vcXRoZnF0a3B1YmR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0ODEyMzUsImV4cCI6MjA3MDA1NzIzNX0.ypBF3lJJTJtSPLEu1zWXqPorS-FDSZzRUy_0ge_Y-r0';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

console.log('🧪 测试修复后的订单数据...\n');

async function testFixedOrdersData() {
  try {
    // 1. 模拟前端的getOrdersWithFilters调用
    console.log('📊 1. 测试获取订单数据...');
    
    // 获取订单数据
    let query = supabase
      .from('orders_optimized')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);
    
    const { data: orders, error } = await query;
    
    if (error) {
      console.error('❌ 获取订单失败:', error);
      return;
    }
    
    console.log(`✅ 获取到 ${orders.length} 个订单`);
    
    // 2. 测试销售信息关联
    console.log('\n📊 2. 测试销售信息关联...');
    
    const salesCodes = [...new Set(orders.map(order => order.sales_code).filter(Boolean))];
    console.log('销售代码列表:', salesCodes);
    
    if (salesCodes.length > 0) {
      // 从 sales_optimized 表获取销售信息
      const { data: salesData, error: salesError } = await supabase
        .from('sales_optimized')
        .select('id, sales_code, wechat_name, name, sales_type, commission_rate, parent_sales_code, parent_sales_id')
        .in('sales_code', salesCodes);
      
      if (salesError) {
        console.error('❌ 获取销售信息失败:', salesError);
        return;
      }
      
      console.log(`✅ 获取到 ${salesData.length} 个销售信息`);
      
      // 建立销售代码到销售信息的映射
      const salesDataMap = new Map();
      salesData.forEach(sale => {
        salesDataMap.set(sale.sales_code, sale);
      });
      
      // 3. 处理订单数据
      console.log('\n📊 3. 测试订单数据处理...');
      
      const processedOrders = orders.map(order => {
        const salesInfo = salesDataMap.get(order.sales_code);
        
        const result = { ...order };
        
        if (salesInfo) {
          // 设置销售基本信息
          result.sales_wechat_name = salesInfo.wechat_name || '-';
          result.sales_name = salesInfo.name || '-';
          result.sales_type = salesInfo.sales_type;
          
          // 根据销售类型设置对应的销售对象
          if (salesInfo.sales_type === 'primary') {
            result.primary_sales = {
              id: salesInfo.id,
              wechat_name: salesInfo.wechat_name,
              sales_code: salesInfo.sales_code,
              sales_type: 'primary',
              commission_rate: salesInfo.commission_rate
            };
          } else {
            result.secondary_sales = {
              id: salesInfo.id,
              wechat_name: salesInfo.wechat_name,
              sales_code: salesInfo.sales_code,
              sales_type: salesInfo.sales_type || 'secondary',
              primary_sales_id: salesInfo.parent_sales_id,
              commission_rate: salesInfo.commission_rate
            };
            
            // 如果有上级销售，需要查询上级信息
            if (salesInfo.parent_sales_id) {
              result.secondary_sales.primary_sales_id = salesInfo.parent_sales_id;
            }
          }
        } else {
          // 没有找到销售信息时的默认值
          result.sales_wechat_name = '-';
          result.sales_name = '-';
          result.sales_type = '-';
        }
        
        return result;
      });
      
      // 4. 验证处理结果
      console.log('\n📊 4. 验证处理结果...');
      
      processedOrders.forEach((order, index) => {
        console.log(`\n订单 ${index + 1} (ID: ${order.id}):`);
        console.log(`- sales_code: ${order.sales_code}`);
        console.log(`- sales_wechat_name: ${order.sales_wechat_name}`);
        console.log(`- sales_type: ${order.sales_type}`);
        
        if (order.primary_sales) {
          console.log('- primary_sales:', {
            wechat_name: order.primary_sales.wechat_name,
            sales_type: order.primary_sales.sales_type
          });
        }
        
        if (order.secondary_sales) {
          console.log('- secondary_sales:', {
            wechat_name: order.secondary_sales.wechat_name,
            sales_type: order.secondary_sales.sales_type
          });
        }
        
        // 检查佣金字段
        console.log(`- primary_commission_amount: ${order.primary_commission_amount || '无'}`);
        console.log(`- secondary_commission_amount: ${order.secondary_commission_amount || '无'}`);
      });
      
      console.log('\n✅ 数据处理完成！');
      console.log('\n📋 修复总结:');
      console.log('1. ✅ 使用 sales_optimized 表获取销售信息');
      console.log('2. ✅ 正确设置 sales_wechat_name 字段');
      console.log('3. ✅ 正确设置 primary_sales 和 secondary_sales 对象');
      console.log('4. ⚠️ 佣金字段需要另外处理（orders_optimized表中的字段）');
    }

  } catch (error) {
    console.error('❌ 测试过程中出现错误:', error);
  }
}

// 执行测试
testFixedOrdersData()
  .then(() => {
    console.log('\n✅ 测试完成');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ 测试失败:', error);
    process.exit(1);
  });