#!/usr/bin/env node

/**
 * Supabase后端配置
 * 2025-01-06 开始配置
 */

const SUPABASE_CONFIG = {
  url: 'https://itvmeamoqthfqtkpubdv.supabase.co',
  anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0dm1lYW1vcXRoZnF0a3B1YmR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0ODEyMzUsImV4cCI6MjA3MDA1NzIzNX0.ypBF3lJJTJtSPLEu1zWXqPorS-FDSZzRUy_0ge_Y-r0',
  projectId: 'itvmeamoqthfqtkpubdv'
};

console.log('🎯 Supabase配置信息确认：');
console.log('URL:', SUPABASE_CONFIG.url);
console.log('API Key:', SUPABASE_CONFIG.anonKey.substring(0, 20) + '...');
console.log('Project ID:', SUPABASE_CONFIG.projectId);

console.log('\n🚀 开始创建数据库schema...');

// 数据库表结构 - 根据现有系统设计
const DATABASE_SCHEMA = {
  // 管理员表
  admins: `
    CREATE TABLE IF NOT EXISTS admins (
      id SERIAL PRIMARY KEY,
      username VARCHAR(50) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `,
  
  // 一级销售表
  primary_sales: `
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
  secondary_sales: `
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
  orders: `
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
};

console.log('\n📋 准备创建以下表：');
Object.keys(DATABASE_SCHEMA).forEach(table => {
  console.log(`✅ ${table}`);
});

console.log('\n🔧 下一步：执行SQL创建命令...');

module.exports = { SUPABASE_CONFIG, DATABASE_SCHEMA };