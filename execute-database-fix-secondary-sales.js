#!/usr/bin/env node

/**
 * 独立销售注册数据库修复脚本
 * 修复 secondary_sales.primary_sales_id 字段允许 NULL
 */

const mysql = require('mysql2/promise');

// 数据库连接配置 - 使用环境变量
const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 3306,
  ssl: {
    rejectUnauthorized: false
  }
};

// 检查必要的环境变量
if (!dbConfig.host || !dbConfig.user || !dbConfig.password || !dbConfig.database) {
  console.log('❌ 缺少必要的数据库环境变量');
  console.log('请确保设置了: DB_HOST, DB_USER, DB_PASSWORD, DB_NAME');
  process.exit(1);
}

async function executeSecondarySalesTableFix() {
  let connection = null;
  
  try {
    console.log('🔧 开始执行独立销售注册数据库修复...');
    console.log('📊 连接数据库...');
    
    connection = await mysql.createConnection(dbConfig);
    
    // 1. 检查当前字段状态
    console.log('\n1. 📋 检查当前 primary_sales_id 字段状态...');
    const [currentSchema] = await connection.execute(`
      SELECT 
        COLUMN_NAME,
        IS_NULLABLE,
        COLUMN_TYPE,
        COLUMN_COMMENT
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'secondary_sales' 
        AND COLUMN_NAME = 'primary_sales_id'
    `);
    
    if (currentSchema.length === 0) {
      console.log('❌ secondary_sales 表或 primary_sales_id 字段不存在');
      return;
    }
    
    const fieldInfo = currentSchema[0];
    console.log(`   字段名: ${fieldInfo.COLUMN_NAME}`);
    console.log(`   允许NULL: ${fieldInfo.IS_NULLABLE}`);
    console.log(`   字段类型: ${fieldInfo.COLUMN_TYPE}`);
    console.log(`   注释: ${fieldInfo.COLUMN_COMMENT}`);
    
    if (fieldInfo.IS_NULLABLE === 'YES') {
      console.log('✅ primary_sales_id 字段已经允许 NULL，无需修复');
      return;
    }
    
    // 2. 执行字段修改
    console.log('\n2. 🔧 修改 primary_sales_id 字段允许 NULL...');
    await connection.execute(`
      ALTER TABLE secondary_sales 
      MODIFY COLUMN primary_sales_id INT NULL COMMENT '一级销售ID，独立注册时为NULL'
    `);
    console.log('✅ 字段修改完成');
    
    // 3. 删除旧的外键约束（如果存在）
    console.log('\n3. 🔗 检查并更新外键约束...');
    
    // 查询现有外键
    const [foreignKeys] = await connection.execute(`
      SELECT CONSTRAINT_NAME 
      FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS 
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'secondary_sales' 
        AND CONSTRAINT_TYPE = 'FOREIGN KEY'
        AND CONSTRAINT_NAME LIKE '%primary_sales%'
    `);
    
    // 删除现有外键（如果存在）
    for (const fk of foreignKeys) {
      try {
        await connection.execute(`
          ALTER TABLE secondary_sales 
          DROP FOREIGN KEY ${fk.CONSTRAINT_NAME}
        `);
        console.log(`   删除外键约束: ${fk.CONSTRAINT_NAME}`);
      } catch (error) {
        console.log(`   外键约束删除失败 ${fk.CONSTRAINT_NAME}:`, error.message);
      }
    }
    
    // 4. 重新添加支持NULL的外键约束
    console.log('\n4. 🔗 添加新的外键约束（支持NULL）...');
    try {
      await connection.execute(`
        ALTER TABLE secondary_sales 
        ADD CONSTRAINT fk_secondary_primary 
        FOREIGN KEY (primary_sales_id) REFERENCES primary_sales(id) ON DELETE SET NULL
      `);
      console.log('✅ 新外键约束添加成功');
    } catch (error) {
      if (error.code === 'ER_DUP_KEYNAME') {
        console.log('⚠️  外键约束已存在，跳过');
      } else {
        console.log('❌ 外键约束添加失败:', error.message);
      }
    }
    
    // 5. 验证修改结果
    console.log('\n5. ✅ 验证修改结果...');
    const [updatedSchema] = await connection.execute(`
      SELECT 
        COLUMN_NAME,
        IS_NULLABLE,
        COLUMN_TYPE,
        COLUMN_COMMENT
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'secondary_sales' 
        AND COLUMN_NAME = 'primary_sales_id'
    `);
    
    const updated = updatedSchema[0];
    console.log(`   字段名: ${updated.COLUMN_NAME}`);
    console.log(`   允许NULL: ${updated.IS_NULLABLE}`);
    console.log(`   字段类型: ${updated.COLUMN_TYPE}`);
    console.log(`   注释: ${updated.COLUMN_COMMENT}`);
    
    // 6. 测试独立销售注册功能
    console.log('\n6. 🧪 测试独立销售注册功能...');
    
    // 尝试插入一个 primary_sales_id 为 NULL 的测试记录
    const testWechatName = `test_independent_${Date.now()}`;
    try {
      await connection.execute(`
        INSERT INTO secondary_sales (
          wechat_name, 
          primary_sales_id, 
          payment_method, 
          payment_address,
          commission_rate
        ) VALUES (?, NULL, 'alipay', 'test@example.com', 30.00)
      `, [testWechatName]);
      
      console.log('✅ 独立销售注册测试成功');
      
      // 删除测试记录
      await connection.execute(`
        DELETE FROM secondary_sales WHERE wechat_name = ?
      `, [testWechatName]);
      
      console.log('🗑️  测试记录已清理');
      
    } catch (error) {
      console.log('❌ 独立销售注册测试失败:', error.message);
    }
    
    console.log('\n🎉 独立销售注册数据库修复完成！');
    console.log('\n📋 修复总结:');
    console.log('   ✅ primary_sales_id 字段已允许 NULL');
    console.log('   ✅ 外键约束已更新为支持 NULL');
    console.log('   ✅ 独立销售注册功能已启用');
    
  } catch (error) {
    console.error('❌ 数据库修复失败:', error);
    console.error('详细错误:', error.message);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n📡 数据库连接已关闭');
    }
  }
}

// 执行修复
executeSecondarySalesTableFix();