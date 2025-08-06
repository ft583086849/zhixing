#!/usr/bin/env node

/**
 * 测试新架构的所有功能
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://itvmeamoqthfqtkpubdv.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0dm1lYW1vcXRoZnF0a3B1YmR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0ODEyMzUsImV4cCI6MjA3MDA1NzIzNX0.ypBF3lJJTJtSPLEu1zWXqPorS-FDSZzRUy_0ge_Y-r0';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testArchitecture() {
  console.log('🧪 开始测试新架构...\n');
  
  let testsPassed = 0;
  let testsFailed = 0;
  
  // 测试1: 数据库连接
  console.log('1️⃣ 测试数据库连接...');
  try {
    const { data, error } = await supabase.from('admins').select('count', { count: 'exact' });
    if (error) throw error;
    console.log('✅ 数据库连接成功');
    testsPassed++;
  } catch (error) {
    console.log('❌ 数据库连接失败:', error.message);
    testsFailed++;
  }
  
  // 测试2: 创建测试管理员
  console.log('\n2️⃣ 创建测试管理员...');
  try {
    // 先检查是否已存在
    const { data: existingAdmin } = await supabase
      .from('admins')
      .select('*')
      .eq('username', 'admin')
      .single();
    
    if (existingAdmin) {
      console.log('✅ 管理员已存在');
    } else {
      const { data, error } = await supabase
        .from('admins')
        .insert([{
          username: 'admin',
          password_hash: 'admin123', // 简单密码用于测试
          created_at: new Date().toISOString()
        }])
        .select()
        .single();
      
      if (error) throw error;
      console.log('✅ 管理员创建成功:', data.username);
    }
    testsPassed++;
  } catch (error) {
    console.log('❌ 创建管理员失败:', error.message);
    testsFailed++;
  }
  
  // 测试3: 创建测试一级销售
  console.log('\n3️⃣ 创建测试一级销售...');
  try {
    const salesCode = `PRIMARY${Date.now()}`;
    const { data, error } = await supabase
      .from('primary_sales')
      .insert([{
        sales_code: salesCode,
        name: '测试一级销售',
        phone: '13800138000',
        email: 'primary@test.com',
        commission_rate: 0.4,
        created_at: new Date().toISOString()
      }])
      .select()
      .single();
    
    if (error) throw error;
    console.log('✅ 一级销售创建成功:', data.sales_code);
    
    // 保存销售代码供后续测试使用
    global.testPrimarySalesCode = salesCode;
    testsPassed++;
  } catch (error) {
    console.log('❌ 创建一级销售失败:', error.message);
    testsFailed++;
  }
  
  // 测试4: 创建测试二级销售
  console.log('\n4️⃣ 创建测试二级销售...');
  try {
    const salesCode = `SECONDARY${Date.now()}`;
    const { data, error } = await supabase
      .from('secondary_sales')
      .insert([{
        sales_code: salesCode,
        name: '测试二级销售',
        phone: '13900139000',
        email: 'secondary@test.com',
        commission_rate: 0.3,
        created_at: new Date().toISOString()
      }])
      .select()
      .single();
    
    if (error) throw error;
    console.log('✅ 二级销售创建成功:', data.sales_code);
    
    global.testSecondarySalesCode = salesCode;
    testsPassed++;
  } catch (error) {
    console.log('❌ 创建二级销售失败:', error.message);
    testsFailed++;
  }
  
  // 测试5: 创建测试订单
  console.log('\n5️⃣ 创建测试订单...');
  try {
    const orderNumber = `TEST${Date.now()}`;
    const { data, error } = await supabase
      .from('orders')
      .insert([{
        order_number: orderNumber,
        customer_name: '测试客户',
        customer_phone: '13700137000',
        customer_email: 'customer@test.com',
        amount: 100.00,
        status: 'pending',
        sales_code: global.testPrimarySalesCode,
        sales_type: 'primary',
        commission_amount: 40.00,
        payment_status: 'pending',
        created_at: new Date().toISOString()
      }])
      .select()
      .single();
    
    if (error) throw error;
    console.log('✅ 测试订单创建成功:', data.order_number);
    testsPassed++;
  } catch (error) {
    console.log('❌ 创建测试订单失败:', error.message);
    testsFailed++;
  }
  
  // 测试6: 查询统计数据
  console.log('\n6️⃣ 测试统计查询...');
  try {
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('amount, created_at');
    
    if (ordersError) throw ordersError;
    
    const { data: primarySales, error: primaryError } = await supabase
      .from('primary_sales')
      .select('id');
    
    if (primaryError) throw primaryError;
    
    const { data: secondarySales, error: secondaryError } = await supabase
      .from('secondary_sales')
      .select('id');
    
    if (secondaryError) throw secondaryError;
    
    console.log('✅ 统计数据:');
    console.log(`   - 订单总数: ${orders.length}`);
    console.log(`   - 一级销售: ${primarySales.length}`);
    console.log(`   - 二级销售: ${secondarySales.length}`);
    console.log(`   - 订单总额: $${orders.reduce((sum, order) => sum + parseFloat(order.amount || 0), 0)}`);
    
    testsPassed++;
  } catch (error) {
    console.log('❌ 统计查询失败:', error.message);
    testsFailed++;
  }
  
  // 测试结果汇总
  console.log('\n📊 测试结果汇总:');
  console.log(`✅ 通过: ${testsPassed}`);
  console.log(`❌ 失败: ${testsFailed}`);
  console.log(`📈 成功率: ${Math.round((testsPassed / (testsPassed + testsFailed)) * 100)}%`);
  
  if (testsFailed === 0) {
    console.log('\n🎉 所有测试通过！新架构运行正常！');
    console.log('\n🔑 测试账户信息:');
    console.log('管理员账户: admin / admin123');
    console.log('可用销售代码:', global.testPrimarySalesCode, global.testSecondarySalesCode);
  } else {
    console.log('\n⚠️  部分测试失败，请检查错误信息');
  }
  
  return testsFailed === 0;
}

// 运行测试
testArchitecture().then(success => {
  console.log('\n✨ 架构测试完成!');
  if (success) {
    console.log('🚀 可以开始使用新架构了！');
  }
});