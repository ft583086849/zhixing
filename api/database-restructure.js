// Vercel Serverless Function - 数据库重构API
const mysql = require('mysql2/promise');

// 数据库连接配置
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

  // 处理OPTIONS预检请求
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      message: '只支持POST方法'
    });
  }

  let connection;
  const results = [];

  try {
    // 连接数据库
    connection = await mysql.createConnection(dbConfig);
    results.push('✅ 数据库连接成功');

    // 1. 添加缺失的销售关联字段
    try {
      await connection.execute(`
        ALTER TABLE orders 
        ADD COLUMN IF NOT EXISTS sales_code VARCHAR(100) COMMENT '标准化销售代码'
      `);
      results.push('✅ 添加sales_code字段');
    } catch (error) {
      results.push(`⚠️ sales_code字段可能已存在: ${error.message}`);
    }

    try {
      await connection.execute(`
        ALTER TABLE orders 
        ADD COLUMN IF NOT EXISTS sales_type ENUM('primary', 'secondary', 'legacy') DEFAULT 'legacy' COMMENT '销售类型：一级/二级/遗留'
      `);
      results.push('✅ 添加sales_type字段');
    } catch (error) {
      results.push(`⚠️ sales_type字段可能已存在: ${error.message}`);
    }

    try {
      await connection.execute(`
        ALTER TABLE orders 
        ADD COLUMN IF NOT EXISTS primary_sales_id INT DEFAULT NULL COMMENT '一级销售ID'
      `);
      results.push('✅ 添加primary_sales_id字段');
    } catch (error) {
      results.push(`⚠️ primary_sales_id字段可能已存在: ${error.message}`);
    }

    try {
      await connection.execute(`
        ALTER TABLE orders 
        ADD COLUMN IF NOT EXISTS secondary_sales_id INT DEFAULT NULL COMMENT '二级销售ID'
      `);
      results.push('✅ 添加secondary_sales_id字段');
    } catch (error) {
      results.push(`⚠️ secondary_sales_id字段可能已存在: ${error.message}`);
    }

    try {
      await connection.execute(`
        ALTER TABLE orders 
        ADD COLUMN IF NOT EXISTS config_confirmed BOOLEAN DEFAULT FALSE COMMENT '配置确认状态'
      `);
      results.push('✅ 添加config_confirmed字段');
    } catch (error) {
      results.push(`⚠️ config_confirmed字段可能已存在: ${error.message}`);
    }

    // 2. 修改现有字段
    try {
      await connection.execute(`
        ALTER TABLE orders 
        MODIFY COLUMN status ENUM('pending_payment', 'pending_config', 'confirmed_payment', 'confirmed_configuration', 'active', 'expired', 'cancelled', 'rejected') DEFAULT 'pending_payment' COMMENT '订单状态'
      `);
      results.push('✅ 更新status字段枚举值');
    } catch (error) {
      results.push(`⚠️ status字段更新失败: ${error.message}`);
    }

    try {
      await connection.execute(`
        ALTER TABLE orders 
        MODIFY COLUMN screenshot_path LONGTEXT COMMENT '付款截图数据（Base64格式）'
      `);
      results.push('✅ 更新screenshot_path字段为LONGTEXT');
    } catch (error) {
      results.push(`⚠️ screenshot_path字段更新失败: ${error.message}`);
    }

    // 3. 添加索引
    const indexes = [
      'ADD INDEX IF NOT EXISTS idx_sales_code (sales_code)',
      'ADD INDEX IF NOT EXISTS idx_sales_type (sales_type)',
      'ADD INDEX IF NOT EXISTS idx_primary_sales_id (primary_sales_id)',
      'ADD INDEX IF NOT EXISTS idx_secondary_sales_id (secondary_sales_id)',
      'ADD INDEX IF NOT EXISTS idx_config_confirmed (config_confirmed)'
    ];

    for (const indexSQL of indexes) {
      try {
        await connection.execute(`ALTER TABLE orders ${indexSQL}`);
        results.push(`✅ 添加索引: ${indexSQL.split('(')[0].split(' ').pop()}`);
      } catch (error) {
        results.push(`⚠️ 索引可能已存在: ${indexSQL.split('(')[0].split(' ').pop()}`);
      }
    }

    // 4. 数据迁移
    try {
      const [migrationResult] = await connection.execute(`
        UPDATE orders 
        SET sales_code = link_code 
        WHERE sales_code IS NULL OR sales_code = ''
      `);
      results.push(`✅ 迁移销售代码: 影响 ${migrationResult.affectedRows} 行`);
    } catch (error) {
      results.push(`⚠️ 销售代码迁移失败: ${error.message}`);
    }

    // 5. 根据销售代码确定销售类型 - 一级销售
    try {
      const [primaryResult] = await connection.execute(`
        UPDATE orders o
        JOIN primary_sales ps ON o.sales_code = ps.sales_code
        SET 
          o.sales_type = 'primary',
          o.primary_sales_id = ps.id,
          o.secondary_sales_id = NULL
        WHERE o.sales_type = 'legacy' OR o.sales_type IS NULL
      `);
      results.push(`✅ 标记一级销售订单: 影响 ${primaryResult.affectedRows} 行`);
    } catch (error) {
      results.push(`⚠️ 一级销售标记失败: ${error.message}`);
    }

    // 6. 根据销售代码确定销售类型 - 二级销售
    try {
      const [secondaryResult] = await connection.execute(`
        UPDATE orders o
        JOIN secondary_sales ss ON o.sales_code = ss.sales_code
        SET 
          o.sales_type = 'secondary',
          o.primary_sales_id = ss.primary_sales_id,
          o.secondary_sales_id = ss.id
        WHERE o.sales_type = 'legacy' OR o.sales_type IS NULL
      `);
      results.push(`✅ 标记二级销售订单: 影响 ${secondaryResult.affectedRows} 行`);
    } catch (error) {
      results.push(`⚠️ 二级销售标记失败: ${error.message}`);
    }

    // 7. 更新订单状态映射
    try {
      const [statusResult] = await connection.execute(`
        UPDATE orders 
        SET status = CASE 
          WHEN status = 'pending_review' THEN 'pending_payment'
          WHEN status = 'active' THEN 'confirmed_configuration'
          ELSE status
        END
      `);
      results.push(`✅ 更新订单状态: 影响 ${statusResult.affectedRows} 行`);
    } catch (error) {
      results.push(`⚠️ 订单状态更新失败: ${error.message}`);
    }

    // 8. 设置配置确认状态
    try {
      const [configResult] = await connection.execute(`
        UPDATE orders 
        SET config_confirmed = TRUE 
        WHERE status IN ('confirmed_configuration', 'active')
      `);
      results.push(`✅ 设置配置确认状态: 影响 ${configResult.affectedRows} 行`);
    } catch (error) {
      results.push(`⚠️ 配置确认状态设置失败: ${error.message}`);
    }

    // 9. 验证结果
    const [typeStats] = await connection.execute(`
      SELECT 
        sales_type,
        COUNT(*) as order_count,
        COUNT(CASE WHEN primary_sales_id IS NOT NULL THEN 1 END) as has_primary_id,
        COUNT(CASE WHEN secondary_sales_id IS NOT NULL THEN 1 END) as has_secondary_id
      FROM orders 
      GROUP BY sales_type
    `);

    const [statusStats] = await connection.execute(`
      SELECT status, COUNT(*) as count FROM orders GROUP BY status
    `);

    const [fieldCheck] = await connection.execute(`
      SELECT 
        COUNT(CASE WHEN sales_code IS NULL THEN 1 END) as null_sales_code,
        COUNT(*) as total_orders
      FROM orders
    `);

    res.status(200).json({
      success: true,
      message: '数据库重构完成',
      results: results,
      statistics: {
        salesTypeDistribution: typeStats,
        statusDistribution: statusStats,
        fieldValidation: fieldCheck[0]
      }
    });

  } catch (error) {
    console.error('数据库重构错误:', error);
    res.status(500).json({
      success: false,
      message: '数据库重构失败',
      error: error.message,
      results: results
    });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}