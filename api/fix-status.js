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

    // 1. 查询当前所有的status值
    const [statusValues] = await connection.execute(`
      SELECT DISTINCT status, COUNT(*) as count 
      FROM orders 
      GROUP BY status
    `);
    
    results.push(`📊 当前状态分布: ${JSON.stringify(statusValues)}`);

    // 2. 首先将不支持的状态值迁移到支持的状态
    const statusMigrationMap = {
      'pending_review': 'pending_payment',
      'reviewing': 'pending_payment', 
      'approved': 'confirmed_payment',
      'rejected': 'rejected',
      'completed': 'active',
      'processing': 'pending_config'
    };

    for (const [oldStatus, newStatus] of Object.entries(statusMigrationMap)) {
      const [updateResult] = await connection.execute(`
        UPDATE orders 
        SET status = ? 
        WHERE status = ?
      `, [newStatus, oldStatus]);
      
      if (updateResult.affectedRows > 0) {
        results.push(`✅ 迁移状态 ${oldStatus} -> ${newStatus}: ${updateResult.affectedRows} 条记录`);
      }
    }

    // 3. 更新status字段定义为新的ENUM
    try {
      await connection.execute(`
        ALTER TABLE orders 
        MODIFY COLUMN status ENUM(
          'pending_payment', 
          'pending_config', 
          'confirmed_payment', 
          'confirmed_configuration', 
          'active', 
          'expired', 
          'cancelled', 
          'rejected'
        ) DEFAULT 'pending_payment' COMMENT '订单状态'
      `);
      results.push('✅ status字段ENUM定义更新成功');
    } catch (error) {
      results.push(`⚠️ status字段ENUM更新失败: ${error.message}`);
    }

    // 4. 验证修复结果
    const [newStatusValues] = await connection.execute(`
      SELECT DISTINCT status, COUNT(*) as count 
      FROM orders 
      GROUP BY status
    `);
    
    results.push(`📊 修复后状态分布: ${JSON.stringify(newStatusValues)}`);

    res.json({
      success: true,
      message: 'status字段修复完成',
      results
    });

  } catch (error) {
    console.error('status字段修复失败:', error);
    res.status(500).json({
      success: false,
      message: 'status字段修复失败',
      error: error.message,
      results
    });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}