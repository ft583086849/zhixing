const mysql = require('mysql2/promise');

// 数据库配置
const dbConfig = {
  host: process.env.DB_HOST || 'aws.connect.psdb.cloud',
  user: process.env.DB_USER || 'your_db_user',
  password: process.env.DB_PASSWORD || 'your_db_password',
  database: process.env.DB_NAME || 'zhixing',
  ssl: {
    rejectUnauthorized: false
  }
};

async function testDatabaseSchema() {
  console.log('🔍 开始测试数据库结构调整...');
  
  let connection;
  
  try {
    // 连接数据库
    console.log('📡 连接数据库...');
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ 数据库连接成功');
    
    // 1. 检查现有表结构
    console.log('\n📋 检查现有表结构...');
    const [existingTables] = await connection.execute(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = ? 
      AND TABLE_NAME IN ('sales', 'links', 'orders', 'sales_commissions')
    `, [dbConfig.database]);
    
    console.log('现有表:', existingTables.map(t => t.TABLE_NAME));
    
    // 2. 执行数据库结构调整脚本
    console.log('\n🔧 执行数据库结构调整...');
    
    // 创建一级销售表
    console.log('创建一级销售表...');
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
    console.log('✅ 一级销售表创建成功');
    
    // 创建二级销售表
    console.log('创建二级销售表...');
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
    console.log('✅ 二级销售表创建成功');
    
    // 创建销售层级关系表
    console.log('创建销售层级关系表...');
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
    console.log('✅ 销售层级关系表创建成功');
    
    // 3. 更新现有表结构
    console.log('\n🔄 更新现有表结构...');
    
    // 检查sales表是否有sales_type字段
    const [salesColumns] = await connection.execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'sales' AND COLUMN_NAME = 'sales_type'
    `, [dbConfig.database]);
    
    if (salesColumns.length === 0) {
      console.log('更新sales表结构...');
      await connection.execute(`
        ALTER TABLE sales 
        ADD COLUMN sales_type ENUM('primary', 'secondary') DEFAULT 'secondary' COMMENT '销售类型：一级/二级',
        ADD COLUMN parent_sales_id INT NULL COMMENT '上级销售ID',
        ADD INDEX idx_sales_type (sales_type),
        ADD INDEX idx_parent_sales_id (parent_sales_id)
      `);
      console.log('✅ sales表结构更新成功');
    } else {
      console.log('✅ sales表结构已存在，跳过更新');
    }
    
    // 检查links表是否有link_type字段
    const [linksColumns] = await connection.execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'links' AND COLUMN_NAME = 'link_type'
    `, [dbConfig.database]);
    
    if (linksColumns.length === 0) {
      console.log('更新links表结构...');
      await connection.execute(`
        ALTER TABLE links 
        ADD COLUMN link_type ENUM('secondary_registration', 'user_sales') DEFAULT 'user_sales' COMMENT '链接类型：二级注册/用户销售',
        ADD INDEX idx_link_type (link_type)
      `);
      console.log('✅ links表结构更新成功');
    } else {
      console.log('✅ links表结构已存在，跳过更新');
    }
    
    // 检查orders表是否有primary_sales_id字段
    const [ordersColumns] = await connection.execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'orders' AND COLUMN_NAME = 'primary_sales_id'
    `, [dbConfig.database]);
    
    if (ordersColumns.length === 0) {
      console.log('更新orders表结构...');
      await connection.execute(`
        ALTER TABLE orders 
        ADD COLUMN primary_sales_id INT NULL COMMENT '一级销售ID',
        ADD COLUMN secondary_sales_id INT NULL COMMENT '二级销售ID',
        ADD INDEX idx_primary_sales_id (primary_sales_id),
        ADD INDEX idx_secondary_sales_id (secondary_sales_id)
      `);
      console.log('✅ orders表结构更新成功');
    } else {
      console.log('✅ orders表结构已存在，跳过更新');
    }
    
    // 4. 创建视图
    console.log('\n📊 创建数据库视图...');
    
    // 销售层级关系视图
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
    console.log('✅ 销售层级关系视图创建成功');
    
    // 销售业绩统计视图
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
    console.log('✅ 销售业绩统计视图创建成功');
    
    // 5. 验证表结构
    console.log('\n🔍 验证表结构...');
    
    const [allTables] = await connection.execute(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = ? 
      AND TABLE_NAME IN ('primary_sales', 'secondary_sales', 'sales_hierarchy', 'sales', 'links', 'orders')
      ORDER BY TABLE_NAME
    `, [dbConfig.database]);
    
    console.log('✅ 所有表创建成功:', allTables.map(t => t.TABLE_NAME));
    
    // 6. 测试数据插入
    console.log('\n🧪 测试数据插入...');
    
    // 测试插入一级销售
    const [primaryResult] = await connection.execute(`
      INSERT INTO primary_sales (wechat_name, payment_method, payment_address, alipay_surname) 
      VALUES (?, ?, ?, ?)
    `, ['测试一级销售', 'alipay', 'test@alipay.com', '测试']);
    
    console.log('✅ 一级销售测试数据插入成功，ID:', primaryResult.insertId);
    
    // 测试插入二级销售
    const [secondaryResult] = await connection.execute(`
      INSERT INTO secondary_sales (wechat_name, primary_sales_id, payment_method, payment_address, alipay_surname) 
      VALUES (?, ?, ?, ?, ?)
    `, ['测试二级销售', primaryResult.insertId, 'alipay', 'test2@alipay.com', '测试2']);
    
    console.log('✅ 二级销售测试数据插入成功，ID:', secondaryResult.insertId);
    
    // 测试插入层级关系
    await connection.execute(`
      INSERT INTO sales_hierarchy (primary_sales_id, secondary_sales_id, commission_rate) 
      VALUES (?, ?, ?)
    `, [primaryResult.insertId, secondaryResult.insertId, 25.00]);
    
    console.log('✅ 销售层级关系测试数据插入成功');
    
    // 7. 测试视图查询
    console.log('\n📊 测试视图查询...');
    
    const [hierarchyView] = await connection.execute('SELECT * FROM sales_hierarchy_view LIMIT 5');
    console.log('✅ 销售层级关系视图查询成功，记录数:', hierarchyView.length);
    
    const [performanceView] = await connection.execute('SELECT * FROM sales_performance_view LIMIT 5');
    console.log('✅ 销售业绩统计视图查询成功，记录数:', performanceView.length);
    
    // 8. 清理测试数据
    console.log('\n🧹 清理测试数据...');
    
    await connection.execute('DELETE FROM sales_hierarchy WHERE primary_sales_id = ?', [primaryResult.insertId]);
    await connection.execute('DELETE FROM secondary_sales WHERE id = ?', [secondaryResult.insertId]);
    await connection.execute('DELETE FROM primary_sales WHERE id = ?', [primaryResult.insertId]);
    
    console.log('✅ 测试数据清理完成');
    
    // 9. 最终验证
    console.log('\n🎯 最终验证...');
    
    const [finalTables] = await connection.execute(`
      SELECT 
        TABLE_NAME,
        TABLE_ROWS
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = ? 
      AND TABLE_NAME IN ('primary_sales', 'secondary_sales', 'sales_hierarchy')
      ORDER BY TABLE_NAME
    `, [dbConfig.database]);
    
    console.log('✅ 最终验证完成:');
    finalTables.forEach(table => {
      console.log(`  - ${table.TABLE_NAME}: ${table.TABLE_ROWS} 行`);
    });
    
    console.log('\n🎉 数据库结构调整测试完成！');
    console.log('✅ 所有表创建成功');
    console.log('✅ 表结构更新成功');
    console.log('✅ 视图创建成功');
    console.log('✅ 数据插入测试成功');
    console.log('✅ 视图查询测试成功');
    console.log('✅ 测试数据清理完成');
    
  } catch (error) {
    console.error('❌ 数据库结构调整测试失败:', error.message);
    console.error('错误详情:', error);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n📡 数据库连接已关闭');
    }
  }
}

// 运行测试
testDatabaseSchema().catch(console.error); 