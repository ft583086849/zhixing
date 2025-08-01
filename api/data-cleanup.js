// Vercel Serverless Function - 数据库数据清理API
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

module.exports = async (req, res) => {
  // 设置CORS头部
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');

  // 处理OPTIONS预检请求
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // 只允许POST请求
  if (req.method !== 'POST') {
    res.status(405).json({
      success: false,
      message: '只支持POST请求'
    });
    return;
  }

  // 验证管理员权限
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      success: false,
      message: '需要管理员权限'
    });
    return;
  }

  const token = authHeader.substring(7);
  if (token !== 'admin123') {
    res.status(403).json({
      success: false,
      message: '管理员权限验证失败'
    });
    return;
  }

  let connection;
  
  try {
    console.log('🧹 开始清理数据库测试数据...');
    
    connection = await mysql.createConnection(dbConfig);
    
    const cleanupResults = {
      tables_cleaned: [],
      records_deleted: {},
      errors: []
    };
    
    // 1. 清理销售层级关系表
    try {
      const [hierarchyResult] = await connection.execute('DELETE FROM sales_hierarchy');
      cleanupResults.records_deleted.sales_hierarchy = hierarchyResult.affectedRows;
      cleanupResults.tables_cleaned.push('sales_hierarchy');
      console.log(`✅ 清理销售层级关系表: ${hierarchyResult.affectedRows} 条记录`);
    } catch (error) {
      cleanupResults.errors.push(`清理销售层级关系表失败: ${error.message}`);
    }
    
    // 2. 清理二级销售表
    try {
      const [secondaryResult] = await connection.execute('DELETE FROM secondary_sales');
      cleanupResults.records_deleted.secondary_sales = secondaryResult.affectedRows;
      cleanupResults.tables_cleaned.push('secondary_sales');
      console.log(`✅ 清理二级销售表: ${secondaryResult.affectedRows} 条记录`);
    } catch (error) {
      cleanupResults.errors.push(`清理二级销售表失败: ${error.message}`);
    }
    
    // 3. 清理一级销售表
    try {
      const [primaryResult] = await connection.execute('DELETE FROM primary_sales');
      cleanupResults.records_deleted.primary_sales = primaryResult.affectedRows;
      cleanupResults.tables_cleaned.push('primary_sales');
      console.log(`✅ 清理一级销售表: ${primaryResult.affectedRows} 条记录`);
    } catch (error) {
      cleanupResults.errors.push(`清理一级销售表失败: ${error.message}`);
    }
    
    // 4. 清理订单表
    try {
      const [ordersResult] = await connection.execute('DELETE FROM orders');
      cleanupResults.records_deleted.orders = ordersResult.affectedRows;
      cleanupResults.tables_cleaned.push('orders');
      console.log(`✅ 清理订单表: ${ordersResult.affectedRows} 条记录`);
    } catch (error) {
      cleanupResults.errors.push(`清理订单表失败: ${error.message}`);
    }
    
    // 5. 清理销售表（保留表结构，只删除数据）
    try {
      const [salesResult] = await connection.execute('DELETE FROM sales');
      cleanupResults.records_deleted.sales = salesResult.affectedRows;
      cleanupResults.tables_cleaned.push('sales');
      console.log(`✅ 清理销售表: ${salesResult.affectedRows} 条记录`);
    } catch (error) {
      cleanupResults.errors.push(`清理销售表失败: ${error.message}`);
    }
    
    // 6. 清理支付配置表
    try {
      const [paymentConfigResult] = await connection.execute('DELETE FROM payment_config');
      cleanupResults.records_deleted.payment_config = paymentConfigResult.affectedRows;
      cleanupResults.tables_cleaned.push('payment_config');
      console.log(`✅ 清理支付配置表: ${paymentConfigResult.affectedRows} 条记录`);
    } catch (error) {
      cleanupResults.errors.push(`清理支付配置表失败: ${error.message}`);
    }
    
    // 7. 重置自增ID
    try {
      await connection.execute('ALTER TABLE sales AUTO_INCREMENT = 1');
      await connection.execute('ALTER TABLE orders AUTO_INCREMENT = 1');
      await connection.execute('ALTER TABLE primary_sales AUTO_INCREMENT = 1');
      await connection.execute('ALTER TABLE secondary_sales AUTO_INCREMENT = 1');
      await connection.execute('ALTER TABLE sales_hierarchy AUTO_INCREMENT = 1');
      await connection.execute('ALTER TABLE payment_config AUTO_INCREMENT = 1');
      console.log('✅ 重置所有表的自增ID');
    } catch (error) {
      cleanupResults.errors.push(`重置自增ID失败: ${error.message}`);
    }
    
    // 8. 验证清理结果
    try {
      const [tables] = await connection.execute(`
        SELECT TABLE_NAME, TABLE_ROWS 
        FROM INFORMATION_SCHEMA.TABLES 
        WHERE TABLE_SCHEMA = ? AND TABLE_TYPE = 'BASE TABLE'
        ORDER BY TABLE_NAME
      `, [process.env.DB_NAME]);
      
      cleanupResults.verification = tables.map(table => ({
        table_name: table.TABLE_NAME,
        row_count: table.TABLE_ROWS
      }));
      
      console.log('✅ 验证清理结果完成');
    } catch (error) {
      cleanupResults.errors.push(`验证清理结果失败: ${error.message}`);
    }
    
    await connection.end();
    
    console.log('🎉 数据库测试数据清理完成');
    
    res.json({
      success: true,
      message: '数据库测试数据清理成功',
      data: cleanupResults
    });
    
  } catch (error) {
    console.error('❌ 数据库测试数据清理失败:', error);
    
    if (connection) {
      await connection.end();
    }
    
    res.status(500).json({
      success: false,
      message: '数据库测试数据清理失败',
      error: error.message
    });
  }
}; 