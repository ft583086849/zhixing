const mysql = require('mysql2/promise');

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // 数据库连接配置
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      ssl: {
        rejectUnauthorized: false
      }
    });

    console.log('开始修复缺失的表结构...');

    // 1. 创建links表（如果不存在）
    console.log('1. 创建links表...');
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS links (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        link_type ENUM('sales', 'secondary_sales', 'user') NOT NULL,
        link_code VARCHAR(255) UNIQUE NOT NULL,
        target_id INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_user_id (user_id),
        INDEX idx_link_code (link_code),
        INDEX idx_link_type (link_type)
      )
    `);

    // 2. 更新links表结构（添加销售相关字段）
    console.log('2. 更新links表结构...');
    try {
      await connection.execute(`
        ALTER TABLE links 
        ADD COLUMN IF NOT EXISTS sales_id INT NULL,
        ADD COLUMN IF NOT EXISTS primary_sales_id INT NULL,
        ADD COLUMN IF NOT EXISTS secondary_sales_id INT NULL,
        ADD INDEX idx_sales_id (sales_id),
        ADD INDEX idx_primary_sales_id (primary_sales_id),
        ADD INDEX idx_secondary_sales_id (secondary_sales_id)
      `);
    } catch (error) {
      console.log('links表字段已存在，跳过更新');
    }

    // 3. 创建销售业绩视图
    console.log('3. 创建销售业绩视图...');
    await connection.execute(`
      DROP VIEW IF EXISTS sales_performance_view
    `);
    
    await connection.execute(`
      CREATE VIEW sales_performance_view AS
      SELECT 
        ps.id as primary_sales_id,
        ps.wechat_name as primary_wechat_name,
        ps.payment_method as primary_payment_method,
        ps.alipay_address as primary_alipay_address,
        ps.online_address as primary_online_address,
        ps.created_at as primary_created_at,
        COUNT(DISTINCT ss.id) as secondary_sales_count,
        COUNT(DISTINCT o.id) as total_orders,
        SUM(CASE WHEN o.status = 'completed' THEN o.amount ELSE 0 END) as total_completed_amount,
        SUM(CASE WHEN o.status = 'completed' THEN o.primary_commission ELSE 0 END) as total_primary_commission,
        SUM(CASE WHEN o.status = 'completed' THEN o.secondary_commission ELSE 0 END) as total_secondary_commission
      FROM primary_sales ps
      LEFT JOIN sales_hierarchy sh ON ps.id = sh.primary_sales_id
      LEFT JOIN secondary_sales ss ON sh.secondary_sales_id = ss.id
      LEFT JOIN orders o ON (o.primary_sales_id = ps.id OR o.secondary_sales_id = ss.id)
      GROUP BY ps.id, ps.wechat_name, ps.payment_method, ps.alipay_address, ps.online_address, ps.created_at
    `);

    // 4. 创建链接管理视图
    console.log('4. 创建链接管理视图...');
    await connection.execute(`
      DROP VIEW IF EXISTS link_management_view
    `);
    
    await connection.execute(`
      CREATE VIEW link_management_view AS
      SELECT 
        l.id as link_id,
        l.user_id,
        l.link_type,
        l.link_code,
        l.target_id,
        l.sales_id,
        l.primary_sales_id,
        l.secondary_sales_id,
        l.created_at,
        l.updated_at,
        ps.wechat_name as primary_sales_name,
        ss.wechat_name as secondary_sales_name,
        u.username as user_name
      FROM links l
      LEFT JOIN primary_sales ps ON l.primary_sales_id = ps.id
      LEFT JOIN secondary_sales ss ON l.secondary_sales_id = ss.id
      LEFT JOIN users u ON l.user_id = u.id
      ORDER BY l.created_at DESC
    `);

    // 5. 验证表结构
    console.log('5. 验证表结构...');
    const tables = [
      'primary_sales',
      'secondary_sales', 
      'sales_hierarchy',
      'links',
      'sales',
      'orders'
    ];

    const tableStatus = {};
    for (const table of tables) {
      try {
        const [rows] = await connection.execute(`DESCRIBE ${table}`);
        tableStatus[table] = {
          exists: true,
          columns: rows.length
        };
      } catch (error) {
        tableStatus[table] = {
          exists: false,
          error: error.message
        };
      }
    }

    // 6. 验证视图
    console.log('6. 验证视图...');
    const views = [
      'sales_hierarchy_view',
      'sales_performance_view',
      'link_management_view'
    ];

    const viewStatus = {};
    for (const view of views) {
      try {
        const [rows] = await connection.execute(`SELECT COUNT(*) as count FROM ${view}`);
        viewStatus[view] = {
          exists: true,
          record_count: rows[0].count
        };
      } catch (error) {
        viewStatus[view] = {
          exists: false,
          error: error.message
        };
      }
    }

    await connection.end();

    console.log('数据库结构调整完成！');

    return res.status(200).json({
      success: true,
      message: '数据库结构调整完成',
      tableStatus,
      viewStatus,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('数据库结构调整失败:', error);
    return res.status(500).json({
      error: '数据库结构调整失败',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
} 