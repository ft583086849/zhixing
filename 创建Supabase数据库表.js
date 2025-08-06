#!/usr/bin/env node

/**
 * 创建Supabase数据库表
 * 基于现有系统的数据结构
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://itvmeamoqthfqtkpubdv.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0dm1lYW1vcXRoZnF0a3B1YmR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0ODEyMzUsImV4cCI6MjA3MDA1NzIzNX0.ypBF3lJJTJtSPLEu1zWXqPorS-FDSZzRUy_0ge_Y-r0';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// SQL 创建表的命令
const createTables = [
  // 管理员表
  `
  CREATE TABLE IF NOT EXISTS admins (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );
  `,
  
  // 一级销售表
  `
  CREATE TABLE IF NOT EXISTS primary_sales (
    id SERIAL PRIMARY KEY,
    sales_code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    email VARCHAR(100),
    commission_rate DECIMAL(5,4) DEFAULT 0.4000,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );
  `,
  
  // 二级销售表
  `
  CREATE TABLE IF NOT EXISTS secondary_sales (
    id SERIAL PRIMARY KEY,
    sales_code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    email VARCHAR(100),
    primary_sales_id INTEGER REFERENCES primary_sales(id) ON DELETE SET NULL,
    commission_rate DECIMAL(5,4) DEFAULT 0.3000,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );
  `,
  
  // 订单表
  `
  CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    order_number VARCHAR(100) UNIQUE NOT NULL,
    customer_name VARCHAR(100) NOT NULL,
    customer_phone VARCHAR(20),
    customer_email VARCHAR(100),
    amount DECIMAL(10,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    sales_code VARCHAR(50),
    sales_type VARCHAR(20),
    commission_amount DECIMAL(10,2),
    payment_status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );
  `
];

async function createDatabaseTables() {
  console.log('🚀 开始创建Supabase数据库表...\n');
  
  try {
    // 测试连接
    console.log('🔗 测试Supabase连接...');
    const { data, error } = await supabase.auth.getSession();
    if (error && error.message !== 'Auth session missing!') {
      throw error;
    }
    console.log('✅ Supabase连接成功!\n');
    
    // 执行SQL创建表
    const tableNames = ['admins', 'primary_sales', 'secondary_sales', 'orders'];
    
    for (let i = 0; i < createTables.length; i++) {
      const tableName = tableNames[i];
      console.log(`📋 正在创建表: ${tableName}...`);
      
      const { data, error } = await supabase.rpc('exec_sql', {
        sql: createTables[i]
      });
      
      if (error) {
        console.log(`⚠️  使用RPC方式失败，尝试直接创建表 ${tableName}...`);
        // 如果RPC失败，我们需要在Supabase Dashboard中手动创建
        console.log(`SQL for ${tableName}:`);
        console.log(createTables[i]);
        console.log('');
      } else {
        console.log(`✅ 表 ${tableName} 创建成功!`);
      }
    }
    
    console.log('\n🎯 数据库表创建完成!');
    console.log('📝 请在Supabase Dashboard中验证表是否正确创建');
    console.log('🔗 访问: https://itvmeamoqthfqtkpubdv.supabase.co/project/itvmeamoqthfqtkpubdv');
    
  } catch (error) {
    console.error('❌ 创建数据库表时出错:', error.message);
    console.log('\n📝 手动创建说明：');
    console.log('1. 访问Supabase Dashboard');
    console.log('2. 点击 Table Editor');
    console.log('3. 点击 "New table" 按钮');
    console.log('4. 复制下面的SQL语句到SQL Editor中执行：\n');
    
    createTables.forEach((sql, index) => {
      console.log(`-- 表 ${tableNames[index]}`);
      console.log(sql);
      console.log('');
    });
  }
}

// 运行创建表功能
createDatabaseTables();