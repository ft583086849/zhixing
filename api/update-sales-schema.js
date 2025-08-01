const mysql = require('mysql2/promise');

// 数据库配置
const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: {
    rejectUnauthorized: false
  }
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      message: '只支持POST请求' 
    });
  }

  // 简单的认证检查
  const authHeader = req.headers.authorization;
  if (!authHeader || authHeader !== `Bearer ${process.env.ADMIN_TOKEN || 'admin123'}`) {
    return res.status(401).json({ 
      success: false, 
      message: '未授权访问' 
    });
  }

  let connection;
  
  try {
    console.log('🔍 开始执行销售分佣系统数据库结构调整...');
    
    // 连接数据库
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ 数据库连接成功');
    
    const results = {
      tables_created: [],
      tables_updated: [],
      views_created: [],
      errors: []
    };

    // 1. 创建一级销售表
    try {
      await connection.execute(`
        CREATE TABLE IF NOT EXISTS primary_sales (
          id INT PRIMARY KEY AUTO_INCREMENT,
          wechat_name VARCHAR(100) NOT NULL UNIQUE,
          payment_method ENUM('alipay', 'crypto') NOT NULL,
          payment_address TEXT NOT NULL,
          alipay_surname VARCHAR(50),
          chain_name VARCHAR(50),
          commission_rate DECIMAL(5,2) DEFAULT 40.00 COMMENT '默认佣金比率40%',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX idx_wechat_name (wechat_name),
          INDEX idx_created_at (created_at)
        )
      `);
      results.tables_created.push('primary_sales');
      console.log('✅ 一级销售表创建成功');
    } catch (error) {
      results.errors.push(`创建primary_sales表失败: ${error.message}`);
    }

    // 2. 创建二级销售表
    try {
      await connection.execute(`
        CREATE TABLE IF NOT EXISTS secondary_sales (
          id INT PRIMARY KEY AUTO_INCREMENT,
          wechat_name VARCHAR(100) NOT NULL UNIQUE,
          primary_sales_id INT NOT NULL,
          payment_method ENUM('alipay', 'crypto') NOT NULL,
          payment_address TEXT NOT NULL,
          alipay_surname VARCHAR(50),
          chain_name VARCHAR(50),
          commission_rate DECIMAL(5,2) DEFAULT 30.00 COMMENT '佣金比率，由一级销售设定',
          status ENUM('active', 'removed') DEFAULT 'active' COMMENT '状态：活跃/已移除',
          removed_by INT NULL COMMENT '被哪个一级销售移除',
          removed_at TIMESTAMP NULL COMMENT '移除时间',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX idx_wechat_name (wechat_name),
          INDEX idx_primary_sales_id (primary_sales_id),
          INDEX idx_status (status),
          INDEX idx_created_at (created_at)
        )
      `);
      results.tables_created.push('secondary_sales');
      console.log('✅ 二级销售表创建成功');
    } catch (error) {
      results.errors.push(`创建secondary_sales表失败: ${error.message}`);
    }

    // 3. 创建销售层级关系表
    try {
      await connection.execute(`
        CREATE TABLE IF NOT EXISTS sales_hierarchy (
          id INT PRIMARY KEY AUTO_INCREMENT,
          primary_sales_id INT NOT NULL,
          secondary_sales_id INT NOT NULL,
          commission_rate DECIMAL(5,2) NOT NULL COMMENT '二级销售佣金比率',
          status ENUM('active', 'removed') DEFAULT 'active' COMMENT '关系状态',
          removed_at TIMESTAMP NULL COMMENT '移除时间',
          removed_reason VARCHAR(500) COMMENT '移除原因',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          UNIQUE KEY unique_relationship (primary_sales_id, secondary_sales_id),
          INDEX idx_primary_sales_id (primary_sales_id),
          INDEX idx_secondary_sales_id (secondary_sales_id),
          INDEX idx_status (status)
        )
      `);
      results.tables_created.push('sales_hierarchy');
      console.log('✅ 销售层级关系表创建成功');
    } catch (error) {
      results.errors.push(`创建sales_hierarchy表失败: ${error.message}`);
    }

    // 4. 更新现有表结构
    console.log('🔄 更新现有表结构...');

    // 检查并更新sales表
    try {
      const [salesColumns] = await connection.execute(`
        SELECT COLUMN_NAME 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'sales' AND COLUMN_NAME = 'sales_type'
      `, [dbConfig.database]);
      
      if (salesColumns.length === 0) {
        await connection.execute(`
          ALTER TABLE sales 
          ADD COLUMN sales_type ENUM('primary', 'secondary') DEFAULT 'secondary' COMMENT '销售类型：一级/二级',
          ADD COLUMN parent_sales_id INT NULL COMMENT '上级销售ID',
          ADD INDEX idx_sales_type (sales_type),
          ADD INDEX idx_parent_sales_id (parent_sales_id)
        `);
        results.tables_updated.push('sales');
        console.log('✅ sales表结构更新成功');
      } else {
        console.log('✅ sales表结构已存在，跳过更新');
      }
    } catch (error) {
      results.errors.push(`更新sales表失败: ${error.message}`);
    }

    // 检查并更新links表
    try {
      const [linksColumns] = await connection.execute(`
        SELECT COLUMN_NAME 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'links' AND COLUMN_NAME = 'link_type'
      `, [dbConfig.database]);
      
      if (linksColumns.length === 0) {
        await connection.execute(`
          ALTER TABLE links 
          ADD COLUMN link_type ENUM('secondary_registration', 'user_sales') DEFAULT 'user_sales' COMMENT '链接类型：二级注册/用户销售',
          ADD INDEX idx_link_type (link_type)
        `);
        results.tables_updated.push('links');
        console.log('✅ links表结构更新成功');
      } else {
        console.log('✅ links表结构已存在，跳过更新');
      }
    } catch (error) {
      results.errors.push(`更新links表失败: ${error.message}`);
    }

    // 检查并更新orders表
    try {
      const [ordersColumns] = await connection.execute(`
        SELECT COLUMN_NAME 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'orders' AND COLUMN_NAME = 'primary_sales_id'
      `, [dbConfig.database]);
      
      if (ordersColumns.length === 0) {
        await connection.execute(`
          ALTER TABLE orders 
          ADD COLUMN primary_sales_id INT NULL COMMENT '一级销售ID',
          ADD COLUMN secondary_sales_id INT NULL COMMENT '二级销售ID',
          ADD INDEX idx_primary_sales_id (primary_sales_id),
          ADD INDEX idx_secondary_sales_id (secondary_sales_id)
        `);
        results.tables_updated.push('orders');
        console.log('✅ orders表结构更新成功');
      } else {
        console.log('✅ orders表结构已存在，跳过更新');
      }
    } catch (error) {
      results.errors.push(`更新orders表失败: ${error.message}`);
    }

    // 5. 创建视图
    console.log('📊 创建数据库视图...');

    // 销售层级关系视图
    try {
      await connection.execute(`
        CREATE OR REPLACE VIEW sales_hierarchy_view AS
        SELECT 
          ps.id as primary_sales_id,
          ps.wechat_name as primary_wechat_name,
          ps.commission_rate as primary_commission_rate,
          ss.id as secondary_sales_id,
          ss.wechat_name as secondary_wechat_name,
          ss.commission_rate as secondary_commission_rate,
          ss.status as secondary_status,
          sh.status as relationship_status,
          sh.created_at as relationship_created_at,
          sh.removed_at as relationship_removed_at
        FROM primary_sales ps
        LEFT JOIN sales_hierarchy sh ON ps.id = sh.primary_sales_id AND sh.status = 'active'
        LEFT JOIN secondary_sales ss ON sh.secondary_sales_id = ss.id AND ss.status = 'active'
      `);
      results.views_created.push('sales_hierarchy_view');
      console.log('✅ 销售层级关系视图创建成功');
    } catch (error) {
      results.errors.push(`创建sales_hierarchy_view失败: ${error.message}`);
    }

    // 销售业绩统计视图
    try {
      await connection.execute(`
        CREATE OR REPLACE VIEW sales_performance_view AS
        SELECT 
          s.id as sales_id,
          s.wechat_name,
          s.sales_type,
          s.parent_sales_id,
          COUNT(o.id) as total_orders,
          SUM(o.amount) as total_amount,
          SUM(o.commission_amount) as total_commission,
          AVG(o.commission_amount) as avg_commission,
          MAX(o.created_at) as last_order_date
        FROM sales s
        LEFT JOIN links l ON s.id = l.sales_id
        LEFT JOIN orders o ON l.id = o.link_id AND o.status = 'confirmed'
        GROUP BY s.id, s.wechat_name, s.sales_type, s.parent_sales_id
      `);
      results.views_created.push('sales_performance_view');
      console.log('✅ 销售业绩统计视图创建成功');
    } catch (error) {
      results.errors.push(`创建sales_performance_view失败: ${error.message}`);
    }

    // 6. 验证表结构
    console.log('🔍 验证表结构...');
    const [allTables] = await connection.execute(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = ? 
      AND TABLE_NAME IN ('primary_sales', 'secondary_sales', 'sales_hierarchy', 'sales', 'links', 'orders')
      ORDER BY TABLE_NAME
    `, [dbConfig.database]);

    const tableNames = allTables.map(t => t.TABLE_NAME);
    console.log('✅ 所有表验证成功:', tableNames);

    // 7. 返回结果
    const success = results.errors.length === 0;
    
    res.status(success ? 200 : 207).json({
      success,
      message: success ? '销售分佣系统数据库结构调整完成' : '销售分佣系统数据库结构调整部分完成，存在错误',
      data: {
        tables_created: results.tables_created,
        tables_updated: results.tables_updated,
        views_created: results.views_created,
        errors: results.errors,
        total_tables: tableNames.length,
        table_names: tableNames
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ 销售分佣系统数据库结构调整失败:', error);
    res.status(500).json({
      success: false,
      message: '销售分佣系统数据库结构调整失败',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  } finally {
    if (connection) {
      await connection.end();
      console.log('📡 数据库连接已关闭');
    }
  }
} 