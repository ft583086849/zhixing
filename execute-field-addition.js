const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

// 从环境变量或默认值获取数据库配置
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root', 
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'zhixing',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
};

async function addMissingFields() {
  let connection;
  
  try {
    console.log('连接数据库...');
    connection = await mysql.createConnection(dbConfig);
    
    console.log('读取SQL脚本...');
    const sqlScript = fs.readFileSync(path.join(__dirname, 'add-missing-fields.sql'), 'utf8');
    
    // 分割SQL语句（按分号分割）
    const statements = sqlScript
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`准备执行 ${statements.length} 条SQL语句...`);
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        try {
          console.log(`执行语句 ${i + 1}/${statements.length}:`, 
            statement.substring(0, 50) + (statement.length > 50 ? '...' : ''));
          
          const [results] = await connection.execute(statement);
          console.log(`✅ 语句 ${i + 1} 执行成功`);
          
          // 如果是查询语句，显示结果
          if (statement.toLowerCase().trim().startsWith('select')) {
            console.log('结果:', results);
          }
        } catch (error) {
          if (error.code === 'ER_DUP_FIELDNAME') {
            console.log(`⚠️ 字段已存在，跳过: ${error.message}`);
          } else if (error.code === 'ER_DUP_KEYNAME') {
            console.log(`⚠️ 索引已存在，跳过: ${error.message}`);
          } else {
            console.error(`❌ 语句 ${i + 1} 执行失败:`, error.message);
            // 对于字段添加，我们继续执行其他语句
          }
        }
      }
    }
    
    console.log('🎉 字段添加完成！');
    
    // 验证字段是否添加成功
    console.log('\n验证字段结构...');
    const [columns] = await connection.execute(`
      SELECT COLUMN_NAME, COLUMN_TYPE, IS_NULLABLE, COLUMN_DEFAULT, COLUMN_COMMENT
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'orders' 
      AND TABLE_SCHEMA = ?
      ORDER BY ORDINAL_POSITION
    `, [dbConfig.database]);
    
    console.log('orders表当前字段结构:');
    columns.forEach(col => {
      console.log(`- ${col.COLUMN_NAME}: ${col.COLUMN_TYPE} ${col.IS_NULLABLE === 'YES' ? 'NULL' : 'NOT NULL'} ${col.COLUMN_DEFAULT ? `DEFAULT ${col.COLUMN_DEFAULT}` : ''} ${col.COLUMN_COMMENT ? `-- ${col.COLUMN_COMMENT}` : ''}`);
    });
    
  } catch (error) {
    console.error('❌ 执行失败:', error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('数据库连接已关闭');
    }
  }
}

// 如果直接运行此文件
if (require.main === module) {
  addMissingFields();
}

module.exports = { addMissingFields };