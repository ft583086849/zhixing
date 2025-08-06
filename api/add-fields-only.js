const mysql = require('mysql2/promise');

// Vercel环境的数据库配置
const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'zhixing',
  ssl: { rejectUnauthorized: false }
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: '只支持POST请求' });
  }

  let connection;
  const results = [];

  try {
    // 连接数据库
    connection = await mysql.createConnection(dbConfig);
    results.push('✅ 数据库连接成功');

    // 检查现有字段
    const [columns] = await connection.execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'orders'
    `, [dbConfig.database]);
    
    const existingColumns = columns.map(col => col.COLUMN_NAME);
    results.push(`📋 现有字段: ${existingColumns.join(', ')}`);

    // 需要添加的字段
    const requiredFields = [
      { name: 'sales_code', sql: 'sales_code VARCHAR(100)' },
      { name: 'sales_type', sql: 'sales_type ENUM(\'primary\', \'secondary\', \'legacy\') DEFAULT \'legacy\'' },
      { name: 'primary_sales_id', sql: 'primary_sales_id INT DEFAULT NULL' },
      { name: 'secondary_sales_id', sql: 'secondary_sales_id INT DEFAULT NULL' },
      { name: 'config_confirmed', sql: 'config_confirmed BOOLEAN DEFAULT FALSE' }
    ];

    let addedCount = 0;
    
    for (const field of requiredFields) {
      if (!existingColumns.includes(field.name)) {
        try {
          await connection.execute(`ALTER TABLE orders ADD COLUMN ${field.sql}`);
          results.push(`✅ 成功添加字段: ${field.name}`);
          addedCount++;
        } catch (error) {
          results.push(`❌ 添加字段失败 ${field.name}: ${error.message}`);
        }
      } else {
        results.push(`⚠️ 字段已存在: ${field.name}`);
      }
    }

    // 更新screenshot_path字段
    try {
      await connection.execute(`ALTER TABLE orders MODIFY COLUMN screenshot_path LONGTEXT`);
      results.push('✅ 更新screenshot_path为LONGTEXT');
    } catch (error) {
      results.push(`⚠️ 更新screenshot_path失败: ${error.message}`);
    }

    // 数据迁移：将link_code复制到sales_code
    try {
      const [migrationResult] = await connection.execute(`
        UPDATE orders 
        SET sales_code = link_code 
        WHERE sales_code IS NULL AND link_code IS NOT NULL
      `);
      results.push(`✅ 数据迁移完成: 影响${migrationResult.affectedRows}行`);
    } catch (error) {
      results.push(`⚠️ 数据迁移失败: ${error.message}`);
    }

    res.json({
      success: true,
      message: `字段添加完成，新增${addedCount}个字段`,
      results
    });

  } catch (error) {
    console.error('字段添加失败:', error);
    res.status(500).json({
      success: false,
      message: '字段添加失败',
      error: error.message,
      results
    });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}