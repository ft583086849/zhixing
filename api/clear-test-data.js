// 清空测试数据的API
const mysql = require('mysql2/promise');

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

export default async function handler(req, res) {
  // 设置CORS头部
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      message: '只支持POST请求'
    });
  }

  let connection;
  const results = [];

  try {
    connection = await mysql.createConnection(dbConfig);
    results.push('✅ 数据库连接成功');

    // 先查看当前数据情况
    const [orderCount] = await connection.execute('SELECT COUNT(*) as count FROM orders');
    const [primaryCount] = await connection.execute('SELECT COUNT(*) as count FROM primary_sales');
    const [secondaryCount] = await connection.execute('SELECT COUNT(*) as count FROM secondary_sales');
    
    results.push(`📊 清空前数据统计: 订单${orderCount[0].count}条, 一级销售${primaryCount[0].count}个, 二级销售${secondaryCount[0].count}个`);

    // 清空订单表（有外键约束，先清理订单）
    await connection.execute('DELETE FROM orders');
    results.push('✅ 清空orders表');

    // 清空二级销售表
    await connection.execute('DELETE FROM secondary_sales');
    results.push('✅ 清空secondary_sales表');

    // 清空一级销售表
    await connection.execute('DELETE FROM primary_sales');
    results.push('✅ 清空primary_sales表');

    // 重置自增ID
    await connection.execute('ALTER TABLE orders AUTO_INCREMENT = 1');
    await connection.execute('ALTER TABLE primary_sales AUTO_INCREMENT = 1');
    await connection.execute('ALTER TABLE secondary_sales AUTO_INCREMENT = 1');
    results.push('✅ 重置自增ID');

    // 现在可以安全地修改status字段ENUM定义
    try {
      await connection.execute(`
        ALTER TABLE orders 
        MODIFY COLUMN status ENUM(
          'pending_payment', 'pending_config', 'confirmed_payment', 
          'confirmed_configuration', 'active', 'expired', 'cancelled', 'rejected'
        ) DEFAULT 'pending_payment' COMMENT '订单状态'
      `);
      results.push('✅ 更新status字段ENUM定义');
    } catch (error) {
      results.push(`⚠️ ENUM更新失败: ${error.message}`);
    }

    // 验证清空结果
    const [finalOrderCount] = await connection.execute('SELECT COUNT(*) as count FROM orders');
    const [finalPrimaryCount] = await connection.execute('SELECT COUNT(*) as count FROM primary_sales');
    const [finalSecondaryCount] = await connection.execute('SELECT COUNT(*) as count FROM secondary_sales');
    
    await connection.end();

    res.status(200).json({
      success: true,
      message: '测试数据清空完成，系统重置为干净状态',
      results: results,
      finalCounts: {
        orders: finalOrderCount[0].count,
        primary_sales: finalPrimaryCount[0].count,
        secondary_sales: finalSecondaryCount[0].count
      }
    });

  } catch (error) {
    if (connection) {
      await connection.end();
    }
    
    console.error('清空数据错误:', error);
    res.status(500).json({
      success: false,
      message: '清空数据失败',
      error: error.message,
      results: results
    });
  }
}