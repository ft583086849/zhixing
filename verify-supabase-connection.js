#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');

// 正确的Supabase配置
const supabaseUrl = 'https://itvmeamoqthfqtkpubdv.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0dm1lYW1vcXRoZnF0a3B1YmR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0ODEyMzUsImV4cCI6MjA3MDA1NzIzNX0.ypBF3lJJTJtSPLEu1zWXqPorS-FDSZzRUy_0ge_Y-r0';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testConnection() {
  console.log('📡 测试Supabase连接...');
  console.log('URL:', supabaseUrl);
  console.log('项目ID:', 'itvmeamoqthfqtkpubdv');
  console.log('');

  try {
    // 测试订单表
    console.log('📊 测试订单表查询...');
    const { data: orders, error: ordersError } = await supabase
      .from('orders_optimized')
      .select('*')
      .limit(5);

    if (ordersError) {
      console.error('❌ 订单查询失败:', ordersError);
    } else {
      console.log('✅ 订单查询成功，获取到', orders.length, '条记录');
    }

    // 测试销售表
    console.log('');
    console.log('👥 测试销售表查询...');
    const { data: sales, error: salesError } = await supabase
      .from('sales_optimized')
      .select('*')
      .limit(5);

    if (salesError) {
      console.error('❌ 销售查询失败:', salesError);
    } else {
      console.log('✅ 销售查询成功，获取到', sales.length, '条记录');
    }

    // 测试客户表
    console.log('');
    console.log('🎯 测试客户表查询...');
    const { data: customers, error: customersError } = await supabase
      .from('customers_optimized')
      .select('*')
      .limit(5);

    if (customersError) {
      console.error('❌ 客户查询失败:', customersError);
    } else {
      console.log('✅ 客户查询成功，获取到', customers.length, '条记录');
    }

    console.log('');
    console.log('🎉 所有连接测试完成！');

  } catch (error) {
    console.error('❌ 测试过程中出错:', error);
  }
}

testConnection();