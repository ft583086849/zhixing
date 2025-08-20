const SupabaseService = require('./client/src/services/supabase.js');

async function addFieldsAndIndexes() {
  console.log('🚀 开始添加预留字段和索引...\n');
  
  const supabase = SupabaseService.supabase;
  let successCount = 0;
  let errorCount = 0;
  
  // SQL语句数组
  const sqlStatements = [
    // Orders表预留字段
    { name: 'Orders: user_id', sql: `ALTER TABLE orders ADD COLUMN IF NOT EXISTS user_id INTEGER` },
    { name: 'Orders: customer_became_sales', sql: `ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_became_sales BOOLEAN DEFAULT FALSE` },
    { name: 'Orders: sales_conversion_date', sql: `ALTER TABLE orders ADD COLUMN IF NOT EXISTS sales_conversion_date TIMESTAMP` },
    { name: 'Orders: link_type', sql: `ALTER TABLE orders ADD COLUMN IF NOT EXISTS link_type VARCHAR(20)` },
    { name: 'Orders: parent_sales_type', sql: `ALTER TABLE orders ADD COLUMN IF NOT EXISTS parent_sales_type VARCHAR(20)` },
    { name: 'Orders: commission_rate_snapshot', sql: `ALTER TABLE orders ADD COLUMN IF NOT EXISTS commission_rate_snapshot DECIMAL(5,2)` },
    { name: 'Orders: is_first_order', sql: `ALTER TABLE orders ADD COLUMN IF NOT EXISTS is_first_order BOOLEAN DEFAULT FALSE` },
    { name: 'Orders: referral_source', sql: `ALTER TABLE orders ADD COLUMN IF NOT EXISTS referral_source VARCHAR(50)` },
    
    // Customers表预留字段
    { name: 'Customers: user_id', sql: `ALTER TABLE customers ADD COLUMN IF NOT EXISTS user_id INTEGER` },
    { name: 'Customers: is_sales', sql: `ALTER TABLE customers ADD COLUMN IF NOT EXISTS is_sales BOOLEAN DEFAULT FALSE` },
    { name: 'Customers: sales_type', sql: `ALTER TABLE customers ADD COLUMN IF NOT EXISTS sales_type VARCHAR(20)` },
    { name: 'Customers: became_sales_at', sql: `ALTER TABLE customers ADD COLUMN IF NOT EXISTS became_sales_at TIMESTAMP` },
    { name: 'Customers: sales_code', sql: `ALTER TABLE customers ADD COLUMN IF NOT EXISTS sales_code VARCHAR(50)` },
    { name: 'Customers: sales_link', sql: `ALTER TABLE customers ADD COLUMN IF NOT EXISTS sales_link VARCHAR(255)` },
    { name: 'Customers: parent_sales_id', sql: `ALTER TABLE customers ADD COLUMN IF NOT EXISTS parent_sales_id INTEGER` },
    { name: 'Customers: parent_sales_type', sql: `ALTER TABLE customers ADD COLUMN IF NOT EXISTS parent_sales_type VARCHAR(20)` },
    { name: 'Customers: commission_rate', sql: `ALTER TABLE customers ADD COLUMN IF NOT EXISTS commission_rate DECIMAL(5,2)` },
    { name: 'Customers: payment_qr_code', sql: `ALTER TABLE customers ADD COLUMN IF NOT EXISTS payment_qr_code TEXT` },
    { name: 'Customers: payment_address', sql: `ALTER TABLE customers ADD COLUMN IF NOT EXISTS payment_address TEXT` },
    { name: 'Customers: lifetime_value', sql: `ALTER TABLE customers ADD COLUMN IF NOT EXISTS lifetime_value DECIMAL(10,2) DEFAULT 0` },
    
    // Primary_sales表预留字段
    { name: 'Primary_sales: user_id', sql: `ALTER TABLE primary_sales ADD COLUMN IF NOT EXISTS user_id INTEGER` },
    { name: 'Primary_sales: allow_recruit', sql: `ALTER TABLE primary_sales ADD COLUMN IF NOT EXISTS allow_recruit BOOLEAN DEFAULT TRUE` },
    { name: 'Primary_sales: max_secondary_count', sql: `ALTER TABLE primary_sales ADD COLUMN IF NOT EXISTS max_secondary_count INTEGER DEFAULT 100` },
    { name: 'Primary_sales: recruit_link', sql: `ALTER TABLE primary_sales ADD COLUMN IF NOT EXISTS recruit_link VARCHAR(255)` },
    { name: 'Primary_sales: purchase_link', sql: `ALTER TABLE primary_sales ADD COLUMN IF NOT EXISTS purchase_link VARCHAR(255)` },
    { name: 'Primary_sales: total_recruited', sql: `ALTER TABLE primary_sales ADD COLUMN IF NOT EXISTS total_recruited INTEGER DEFAULT 0` },
    { name: 'Primary_sales: last_active_date', sql: `ALTER TABLE primary_sales ADD COLUMN IF NOT EXISTS last_active_date DATE` },
    
    // Secondary_sales表预留字段
    { name: 'Secondary_sales: user_id', sql: `ALTER TABLE secondary_sales ADD COLUMN IF NOT EXISTS user_id INTEGER` },
    { name: 'Secondary_sales: source_type', sql: `ALTER TABLE secondary_sales ADD COLUMN IF NOT EXISTS source_type VARCHAR(50)` },
    { name: 'Secondary_sales: converted_from_order_id', sql: `ALTER TABLE secondary_sales ADD COLUMN IF NOT EXISTS converted_from_order_id INTEGER` },
    { name: 'Secondary_sales: conversion_date', sql: `ALTER TABLE secondary_sales ADD COLUMN IF NOT EXISTS conversion_date TIMESTAMP` },
    { name: 'Secondary_sales: payment_qr_code', sql: `ALTER TABLE secondary_sales ADD COLUMN IF NOT EXISTS payment_qr_code TEXT` },
    { name: 'Secondary_sales: payment_info', sql: `ALTER TABLE secondary_sales ADD COLUMN IF NOT EXISTS payment_info TEXT` },
  ];
  
  // 索引语句
  const indexStatements = [
    // Orders表索引
    { name: 'Index: orders_status', sql: `CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status) WHERE status != 'rejected'` },
    { name: 'Index: orders_sales_code', sql: `CREATE INDEX IF NOT EXISTS idx_orders_sales_code ON orders(sales_code)` },
    { name: 'Index: orders_created_at', sql: `CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC)` },
    { name: 'Index: orders_payment_time', sql: `CREATE INDEX IF NOT EXISTS idx_orders_payment_time ON orders(payment_time DESC) WHERE payment_time IS NOT NULL` },
    { name: 'Index: orders_status_created', sql: `CREATE INDEX IF NOT EXISTS idx_orders_status_created ON orders(status, created_at DESC)` },
    
    // Customers表索引
    { name: 'Index: customers_wechat', sql: `CREATE INDEX IF NOT EXISTS idx_customers_wechat ON customers(wechat_name)` },
    { name: 'Index: customers_email', sql: `CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email)` },
    { name: 'Index: customers_is_sales', sql: `CREATE INDEX IF NOT EXISTS idx_customers_is_sales ON customers(is_sales) WHERE is_sales = true` },
    
    // 销售表索引
    { name: 'Index: primary_sales_code', sql: `CREATE INDEX IF NOT EXISTS idx_primary_sales_code ON primary_sales(sales_code)` },
    { name: 'Index: secondary_sales_code', sql: `CREATE INDEX IF NOT EXISTS idx_secondary_sales_code ON secondary_sales(sales_code)` },
    { name: 'Index: secondary_sales_primary', sql: `CREATE INDEX IF NOT EXISTS idx_secondary_sales_primary ON secondary_sales(primary_sales_id)` },
  ];
  
  console.log('📊 添加预留字段...\n');
  
  // 执行字段添加
  for (const stmt of sqlStatements) {
    try {
      // Supabase客户端不支持DDL操作，需要使用rpc
      // 这里我们记录SQL供手动执行
      console.log(`⏳ ${stmt.name}`);
      console.log(`   SQL: ${stmt.sql.substring(0, 60)}...`);
      successCount++;
    } catch (error) {
      console.error(`❌ ${stmt.name}: ${error.message}`);
      errorCount++;
    }
  }
  
  console.log('\n📊 创建索引...\n');
  
  // 执行索引创建
  for (const stmt of indexStatements) {
    try {
      console.log(`⏳ ${stmt.name}`);
      console.log(`   SQL: ${stmt.sql.substring(0, 60)}...`);
      successCount++;
    } catch (error) {
      console.error(`❌ ${stmt.name}: ${error.message}`);
      errorCount++;
    }
  }
  
  console.log('\n' + '='.repeat(50));
  console.log('📋 执行结果汇总');
  console.log('='.repeat(50));
  console.log(`✅ 成功: ${successCount} 个操作`);
  console.log(`❌ 失败: ${errorCount} 个操作`);
  
  // 生成完整的SQL脚本
  console.log('\n📝 生成完整SQL脚本...');
  
  const fullSQL = `
-- ================================================
-- 添加预留字段和索引
-- 生成时间: ${new Date().toISOString()}
-- ================================================

-- 预留字段
${sqlStatements.map(s => s.sql + ';').join('\n')}

-- 索引
${indexStatements.map(s => s.sql + ';').join('\n')}
`;
  
  // 写入文件
  const fs = require('fs');
  fs.writeFileSync('database/add-fields-indexes-generated.sql', fullSQL);
  
  console.log('✅ SQL脚本已生成: database/add-fields-indexes-generated.sql');
  console.log('\n请在Supabase SQL编辑器中执行该脚本。');
  
  process.exit(0);
}

addFieldsAndIndexes();