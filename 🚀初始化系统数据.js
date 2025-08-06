#!/usr/bin/env node

/**
 * 🚀 初始化系统数据
 * 创建管理员账户和测试销售数据
 */

const { createClient } = require('@supabase/supabase-js');

// Supabase配置
const supabaseUrl = 'https://itvmeamoqthfqtkpubdv.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0dm1lYW1vcXRoZnF0a3B1YmR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0ODEyMzUsImV4cCI6MjA3MDA1NzIzNX0.ypBF3lJJTJtSPLEu1zWXqPorS-FDSZzRUy_0ge_Y-r0';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function initializeSystem() {
  console.log('🚀 开始初始化系统数据...');
  
  try {
    // 1. 创建管理员账户
    console.log('\n👤 1. 创建管理员账户');
    await createAdmin();
    
    // 2. 创建测试销售数据
    console.log('\n🏪 2. 创建测试销售数据');
    await createTestSalesData();
    
    // 3. 验证创建结果
    console.log('\n✅ 3. 验证创建结果');
    await verifyData();
    
    console.log('\n🎉 系统初始化完成！');
    console.log('\n📋 可用账户信息：');
    console.log('管理员登录: admin / admin123');
    console.log('测试销售代码: TEST001, TEST002');
    
  } catch (error) {
    console.error('❌ 初始化失败:', error.message);
  }
}

// 创建管理员账户
async function createAdmin() {
  try {
    // 检查是否已存在
    const { data: existingAdmin } = await supabase
      .from('admins')
      .select('*')
      .eq('username', 'admin')
      .single();
    
    if (existingAdmin) {
      console.log('   ✅ 管理员账户已存在');
      return;
    }
    
    // 创建新管理员
    const { data, error } = await supabase
      .from('admins')
      .insert([{
        username: 'admin',
        password_hash: 'admin123', // 简化密码，实际项目中应该加密
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select()
      .single();
    
    if (error) throw error;
    
    console.log('   ✅ 管理员账户创建成功:', data.username);
  } catch (error) {
    console.error('   ❌ 创建管理员失败:', error.message);
    throw error;
  }
}

// 创建测试销售数据
async function createTestSalesData() {
  try {
    // 创建一级销售
    const primarySalesData = [
      {
        sales_code: 'TEST001',
        name: '测试一级销售A',
        phone: '13800138000',
        email: 'test1@example.com',
        commission_rate: 0.4000,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        sales_code: 'TEST002',
        name: '测试一级销售B',
        phone: '13800138001',
        email: 'test2@example.com',
        commission_rate: 0.4000,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];
    
    for (const sales of primarySalesData) {
      // 检查是否已存在
      const { data: existing } = await supabase
        .from('primary_sales')
        .select('*')
        .eq('sales_code', sales.sales_code)
        .single();
      
      if (existing) {
        console.log(`   ✅ 一级销售 ${sales.sales_code} 已存在`);
        continue;
      }
      
      const { data, error } = await supabase
        .from('primary_sales')
        .insert([sales])
        .select()
        .single();
      
      if (error) throw error;
      console.log(`   ✅ 一级销售创建成功: ${data.sales_code} - ${data.name}`);
    }
    
    // 创建二级销售
    const { data: primarySales } = await supabase
      .from('primary_sales')
      .select('*')
      .eq('sales_code', 'TEST001')
      .single();
    
    if (primarySales) {
      const secondarySalesData = {
        sales_code: 'SEC001',
        name: '测试二级销售A',
        phone: '13800138002',
        email: 'sec1@example.com',
        primary_sales_id: primarySales.id,
        commission_rate: 0.3000,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      const { data: existingSec } = await supabase
        .from('secondary_sales')
        .select('*')
        .eq('sales_code', 'SEC001')
        .single();
      
      if (!existingSec) {
        const { data, error } = await supabase
          .from('secondary_sales')
          .insert([secondarySalesData])
          .select()
          .single();
        
        if (error) throw error;
        console.log(`   ✅ 二级销售创建成功: ${data.sales_code} - ${data.name}`);
      } else {
        console.log('   ✅ 二级销售 SEC001 已存在');
      }
    }
    
  } catch (error) {
    console.error('   ❌ 创建销售数据失败:', error.message);
    throw error;
  }
}

// 验证数据
async function verifyData() {
  try {
    // 验证管理员
    const { data: admin, error: adminError } = await supabase
      .from('admins')
      .select('*')
      .eq('username', 'admin')
      .single();
    
    if (adminError || !admin) {
      throw new Error('管理员账户验证失败');
    }
    console.log('   ✅ 管理员账户验证成功');
    
    // 验证一级销售
    const { data: primarySales, error: primaryError } = await supabase
      .from('primary_sales')
      .select('*');
    
    if (primaryError) throw primaryError;
    console.log(`   ✅ 一级销售数据验证成功 (${primarySales?.length || 0} 条)`);
    
    // 验证二级销售
    const { data: secondarySales, error: secondaryError } = await supabase
      .from('secondary_sales')
      .select('*');
    
    if (secondaryError) throw secondaryError;
    console.log(`   ✅ 二级销售数据验证成功 (${secondarySales?.length || 0} 条)`);
    
  } catch (error) {
    console.error('   ❌ 数据验证失败:', error.message);
    throw error;
  }
}

// 运行初始化
initializeSystem().catch(console.error);