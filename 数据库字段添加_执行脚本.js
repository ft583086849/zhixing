// 数据库字段添加脚本 - 添加 sales_code 相关字段
const mysql = require('mysql2/promise');

const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'zhixing',
  port: process.env.DB_PORT || 3306,
  ssl: {
    rejectUnauthorized: false
  }
};

async function addSalesCodeFields() {
  let connection;
  
  try {
    console.log('🔗 连接数据库...');
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ 数据库连接成功');

    // 第1步：添加 sales_code 字段
    console.log('\n📝 执行第1条SQL: 添加 sales_code 字段...');
    try {
      await connection.execute(`
        ALTER TABLE primary_sales 
        ADD COLUMN sales_code VARCHAR(16) UNIQUE 
        COMMENT '用户购买时使用的销售代码'
      `);
      console.log('✅ sales_code 字段添加成功');
    } catch (error) {
      if (error.code === 'ER_DUP_FIELDNAME') {
        console.log('ℹ️  sales_code 字段已存在，跳过');
      } else {
        throw error;
      }
    }

    // 第2步：添加 secondary_registration_code 字段
    console.log('\n📝 执行第2条SQL: 添加 secondary_registration_code 字段...');
    try {
      await connection.execute(`
        ALTER TABLE primary_sales 
        ADD COLUMN secondary_registration_code VARCHAR(16) UNIQUE 
        COMMENT '二级销售注册时使用的代码'
      `);
      console.log('✅ secondary_registration_code 字段添加成功');
    } catch (error) {
      if (error.code === 'ER_DUP_FIELDNAME') {
        console.log('ℹ️  secondary_registration_code 字段已存在，跳过');
      } else {
        throw error;
      }
    }

    // 第3步：验证字段添加结果
    console.log('\n🔍 验证字段添加结果...');
    const [columns] = await connection.execute(`
      SELECT COLUMN_NAME, COLUMN_TYPE, IS_NULLABLE, COLUMN_DEFAULT, COLUMN_COMMENT
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'primary_sales' 
      AND COLUMN_NAME IN ('sales_code', 'secondary_registration_code')
      ORDER BY COLUMN_NAME
    `, [process.env.DB_NAME || 'zhixing']);

    if (columns.length === 2) {
      console.log('✅ 字段验证成功:');
      columns.forEach(col => {
        console.log(`   - ${col.COLUMN_NAME}: ${col.COLUMN_TYPE} (${col.COLUMN_COMMENT})`);
      });
    } else {
      console.log('⚠️  字段验证异常，只找到', columns.length, '个字段');
    }

    // 第4步：检查现有数据影响
    console.log('\n📊 检查现有数据...');
    const [count] = await connection.execute('SELECT COUNT(*) as total FROM primary_sales');
    console.log(`ℹ️  现有 primary_sales 记录数: ${count[0].total}`);

    console.log('\n🎉 数据库字段添加完成！');
    console.log('✅ 一级销售创建功能现在可以正常工作了！');

  } catch (error) {
    console.error('❌ 数据库字段添加失败:', error.message);
    console.error('📋 错误详情:', error);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔐 数据库连接已关闭');
    }
  }
}

// 执行脚本
console.log('🚀 开始添加 sales_code 相关字段到 primary_sales 表...\n');
addSalesCodeFields()
  .then(() => {
    console.log('\n✨ 脚本执行完成！');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 脚本执行失败:', error.message);
    process.exit(1);
  });