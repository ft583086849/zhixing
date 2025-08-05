#!/usr/bin/env node

/**
 * 修复数据库表结构，添加缺失字段
 */

const mysql = require('mysql2/promise');

// 使用用户提供的数据库配置
const dbConfig = {
  host: 'aws.connect.psdb.cloud',
  user: 'pmi6zditk1nyr20npifx',
  password: process.env.DB_PASSWORD || 'pscale_pw_...', // 需要完整密码
  database: 'zhixing',
  port: 3306,
  ssl: {
    rejectUnauthorized: false
  }
};

async function fixDatabaseSchema() {
  let connection;
  
  try {
    console.log('🔗 连接数据库...');
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ 数据库连接成功');

    // 1. 检查当前表结构
    console.log('\n📋 检查当前表结构...');
    
    const tables = ['orders', 'secondary_sales', 'primary_sales'];
    const currentStructure = {};
    
    for (const table of tables) {
      try {
        const [columns] = await connection.execute(`DESCRIBE ${table}`);
        currentStructure[table] = columns.map(col => col.Field);
        console.log(`   ${table}: ${currentStructure[table].length} 个字段`);
      } catch (error) {
        console.log(`   ❌ 表 ${table} 不存在或无法访问: ${error.message}`);
        currentStructure[table] = [];
      }
    }

    // 2. 定义需要的字段
    console.log('\n🛠️  准备添加缺失字段...');
    
    const requiredFields = {
      orders: [
        'sales_code VARCHAR(50) COMMENT "销售代码"',
        'sales_type ENUM("primary", "secondary") COMMENT "销售类型"',
        'customer_wechat VARCHAR(100) COMMENT "客户微信号"',
        'purchase_type ENUM("immediate", "advance") DEFAULT "immediate" COMMENT "购买方式"',
        'effective_time DATETIME COMMENT "生效时间"',
        'expiry_time DATETIME COMMENT "到期时间"',
        'alipay_amount DECIMAL(10,2) COMMENT "支付宝付款金额"',
        'crypto_amount DECIMAL(10,2) COMMENT "加密货币付款金额"',
        'commission_rate DECIMAL(5,4) DEFAULT 0.3000 COMMENT "佣金比率"',
        'commission_amount DECIMAL(10,2) DEFAULT 0.00 COMMENT "佣金金额"',
        'primary_sales_id INT COMMENT "一级销售ID"',
        'secondary_sales_id INT COMMENT "二级销售ID"',
        'config_confirmed BOOLEAN DEFAULT FALSE COMMENT "配置确认状态"',
        'is_reminded BOOLEAN DEFAULT FALSE COMMENT "是否已催单"',
        'reminder_date DATETIME COMMENT "催单时间"'
      ],
      secondary_sales: [
        'sales_code VARCHAR(50) UNIQUE COMMENT "销售代码"',
        'primary_sales_id INT COMMENT "关联的一级销售ID"',
        'primary_registration_code VARCHAR(50) COMMENT "注册时使用的一级销售代码"',
        'commission_rate DECIMAL(5,2) DEFAULT 30.00 COMMENT "佣金比率"',
        'status ENUM("active", "removed") DEFAULT "active" COMMENT "状态"',
        'sales_type ENUM("primary", "secondary") DEFAULT "secondary" COMMENT "销售类型"'
      ],
      primary_sales: [
        'sales_code VARCHAR(50) UNIQUE COMMENT "用户购买销售代码"',
        'secondary_registration_code VARCHAR(50) UNIQUE COMMENT "二级销售注册代码"',
        'commission_rate DECIMAL(5,2) DEFAULT 40.00 COMMENT "佣金比率"',
        'sales_type ENUM("primary", "secondary") DEFAULT "primary" COMMENT "销售类型"'
      ]
    };

    // 3. 检查并添加缺失字段
    for (const [tableName, fields] of Object.entries(requiredFields)) {
      if (currentStructure[tableName].length === 0) {
        console.log(`   ❌ 跳过表 ${tableName}（不存在）`);
        continue;
      }

      console.log(`\n   🔧 处理表 ${tableName}:`);
      
      for (const fieldDef of fields) {
        const fieldName = fieldDef.split(' ')[0];
        
        if (!currentStructure[tableName].includes(fieldName)) {
          try {
            const alterSQL = `ALTER TABLE ${tableName} ADD COLUMN ${fieldDef}`;
            console.log(`     添加字段: ${fieldName}`);
            await connection.execute(alterSQL);
            console.log(`     ✅ 字段 ${fieldName} 添加成功`);
          } catch (error) {
            console.log(`     ❌ 字段 ${fieldName} 添加失败: ${error.message}`);
          }
        } else {
          console.log(`     ⏭️  字段 ${fieldName} 已存在`);
        }
      }
    }

    // 4. 创建索引
    console.log('\n📊 创建索引...');
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_orders_sales_code ON orders(sales_code)',
      'CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status)',
      'CREATE INDEX IF NOT EXISTS idx_orders_config_confirmed ON orders(config_confirmed)',
      'CREATE INDEX IF NOT EXISTS idx_secondary_sales_code ON secondary_sales(sales_code)',
      'CREATE INDEX IF NOT EXISTS idx_primary_sales_code ON primary_sales(sales_code)'
    ];

    for (const indexSQL of indexes) {
      try {
        await connection.execute(indexSQL);
        console.log(`   ✅ 索引创建成功`);
      } catch (error) {
        console.log(`   ⚠️  索引创建跳过: ${error.message}`);
      }
    }

    // 5. 验证修复结果
    console.log('\n🔍 验证修复结果...');
    
    for (const table of tables) {
      try {
        const [columns] = await connection.execute(`DESCRIBE ${table}`);
        console.log(`   ${table}: ${columns.length} 个字段`);
        
        // 检查关键字段
        const fieldNames = columns.map(col => col.Field);
        if (table === 'orders') {
          const keyFields = ['sales_code', 'is_reminded', 'config_confirmed'];
          const missing = keyFields.filter(field => !fieldNames.includes(field));
          if (missing.length === 0) {
            console.log(`     ✅ 关键字段完整`);
          } else {
            console.log(`     ❌ 仍缺少字段: ${missing.join(', ')}`);
          }
        }
      } catch (error) {
        console.log(`   ❌ 验证表 ${table} 失败: ${error.message}`);
      }
    }

    console.log('\n🎉 数据库表结构修复完成！');

  } catch (error) {
    console.error('❌ 修复过程中发生错误:', error);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// 运行修复
if (require.main === module) {
  fixDatabaseSchema().catch(console.error);
}

module.exports = { fixDatabaseSchema };