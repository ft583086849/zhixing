// Vercel Serverless Function - 销售层级管理API
const mysql = require('mysql2/promise');
const jwt = require('jsonwebtoken');

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

// 权限验证中间件
async function verifyAdminAuth(req, res) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { success: false, status: 401, message: '未提供有效的认证Token' };
  }
  
  const token = authHeader.substring(7);
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default-secret');
    
    // 验证管理员是否存在
    const connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.execute(
      'SELECT id, username, role FROM admins WHERE id = ?',
      [decoded.id]
    );
    await connection.end();
    
    if (rows.length === 0) {
      return { success: false, status: 401, message: '管理员账户不存在' };
    }
    
    return { success: true, admin: rows[0] };
  } catch (error) {
    return { success: false, status: 401, message: 'Token无效或已过期' };
  }
}

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

  try {
    const { path } = req.query;
    const bodyPath = req.body?.path;

    // 处理销售层级统计
    if (req.method === 'GET' && (path === 'stats' || !path)) {
      await handleStats(req, res);
      return;
    }

    // 处理销售层级关系（需要管理员权限）
    if (req.method === 'GET' && path === 'relationships') {
      const authResult = await verifyAdminAuth(req, res);
      if (!authResult.success) {
        return res.status(authResult.status).json({
          success: false,
          message: authResult.message
        });
      }
      await handleRelationships(req, res);
      return;
    }

    // 如果没有匹配的路径，返回404
    res.status(404).json({
      success: false,
      message: `路径不存在: ${req.method} ${path || bodyPath || 'default'}`
    });

  } catch (error) {
    console.error('销售层级API错误:', error);
    res.status(500).json({
      success: false,
      message: error.message || '服务器内部错误'
    });
  }
}

// 销售层级统计功能
async function handleStats(req, res) {
  let connection;
  
  try {
    connection = await mysql.createConnection(dbConfig);
    
    // 获取销售层级统计数据
    const [stats] = await connection.execute(`
      SELECT 
        COUNT(DISTINCT ps.id) as primary_sales_count,
        COUNT(DISTINCT ss.id) as secondary_sales_count,
        COUNT(DISTINCT CASE WHEN ss.id IS NOT NULL THEN ps.id END) as active_primary_sales,
        AVG(ps.commission_rate) as avg_primary_commission_rate,
        AVG(ss.commission_rate) as avg_secondary_commission_rate
      FROM primary_sales ps
      LEFT JOIN secondary_sales ss ON ps.id = ss.primary_sales_id
    `);
    
    res.status(200).json({
      success: true,
      data: stats[0] || {}
    });
    
  } catch (error) {
    console.error('销售层级统计错误:', error);
    res.status(500).json({
      success: false,
      message: error.message || '获取层级统计数据失败'
    });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// 销售层级关系功能
async function handleRelationships(req, res) {
  let connection;
  
  try {
    connection = await mysql.createConnection(dbConfig);
    
    // 获取销售层级关系数据
    const [relationships] = await connection.execute(`
      SELECT 
        ps.id as primary_sales_id,
        ps.wechat_name as primary_sales_name,
        ps.commission_rate as primary_commission_rate,
        ps.created_at as primary_created_at,
        ss.id as secondary_sales_id,
        ss.wechat_name as secondary_sales_name,
        ss.commission_rate as secondary_commission_rate,
        ss.created_at as secondary_created_at,
        COUNT(o.id) as total_orders,
        SUM(o.amount) as total_amount,
        SUM(o.commission_amount) as total_commission
      FROM primary_sales ps
      LEFT JOIN secondary_sales ss ON ps.id = ss.primary_sales_id
      LEFT JOIN orders o ON (ps.id = o.sales_id OR ss.id = o.sales_id)
      GROUP BY ps.id, ss.id
      ORDER BY ps.created_at DESC, ss.created_at DESC
    `);
    
    // 获取层级统计
    const [hierarchyStats] = await connection.execute(`
      SELECT 
        COUNT(DISTINCT ps.id) as primary_sales_count,
        COUNT(DISTINCT ss.id) as secondary_sales_count,
        COUNT(DISTINCT CASE WHEN ss.id IS NOT NULL THEN ps.id END) as active_primary_sales
      FROM primary_sales ps
      LEFT JOIN secondary_sales ss ON ps.id = ss.primary_sales_id
    `);
    
    res.status(200).json({
      success: true,
      data: {
        relationships,
        stats: hierarchyStats[0] || {}
      }
    });
    
  } catch (error) {
    console.error('销售层级关系错误:', error);
    res.status(500).json({
      success: false,
      message: error.message || '获取层级关系数据失败'
    });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// 获取层级列表
async function handleGetHierarchyList(req, res, connection) {
  try {
    const [rows] = await connection.execute(`
      SELECT 
        sh.id,
        sh.primary_sales_id,
        sh.secondary_sales_id,
        sh.created_at,
        ps.wechat_name as primary_sales_name,
        ss.wechat_name as secondary_sales_name,
        ss.commission_rate
      FROM sales_hierarchy sh
      LEFT JOIN primary_sales ps ON sh.primary_sales_id = ps.id
      LEFT JOIN secondary_sales ss ON sh.secondary_sales_id = ss.id
      ORDER BY sh.created_at DESC
    `);

    res.json({
      success: true,
      data: rows
    });
  } catch (error) {
    console.error('获取层级列表错误:', error);
    res.status(500).json({
      success: false,
      message: '获取层级列表失败'
    });
  }
}

// 获取层级树结构
async function handleGetHierarchyTree(req, res, connection) {
  try {
    const { primary_sales_id } = req.query;
    
    if (!primary_sales_id) {
      return res.status(400).json({
        success: false,
        message: '一级销售ID为必填项'
      });
    }

    // 获取一级销售信息
    const [primarySales] = await connection.execute(
      'SELECT * FROM primary_sales WHERE id = ?',
      [primary_sales_id]
    );

    if (primarySales.length === 0) {
      return res.status(404).json({
        success: false,
        message: '一级销售不存在'
      });
    }

    // 获取二级销售列表
    const [secondarySales] = await connection.execute(
      `SELECT 
        ss.*,
        sh.commission_rate,
        COUNT(o.id) as order_count,
        SUM(o.amount) as total_revenue
       FROM secondary_sales ss
       LEFT JOIN sales_hierarchy sh ON ss.id = sh.secondary_sales_id
       LEFT JOIN orders o ON ss.id = o.secondary_sales_id
       WHERE ss.primary_sales_id = ? AND ss.status = 'active'
       GROUP BY ss.id
       ORDER BY ss.created_at DESC`,
      [primary_sales_id]
    );

    // 构建层级树结构
    const hierarchyTree = {
      primary_sales: primarySales[0],
      secondary_sales: secondarySales,
      total_secondary_count: secondarySales.length,
      total_orders: secondarySales.reduce((sum, ss) => sum + (ss.order_count || 0), 0),
      total_revenue: secondarySales.reduce((sum, ss) => sum + (parseFloat(ss.total_revenue) || 0), 0)
    };

    res.json({
      success: true,
      data: hierarchyTree
    });

  } catch (error) {
    console.error('获取层级树错误:', error);
    res.status(500).json({
      success: false,
      message: '获取层级树失败'
    });
  }
}

// 获取层级统计
async function handleGetHierarchyStats(req, res, connection) {
  try {
    const { primary_sales_id } = req.query;
    
    let whereClause = '';
    let params = [];
    
    if (primary_sales_id) {
      whereClause = 'WHERE sh.primary_sales_id = ?';
      params.push(primary_sales_id);
    }
    
    const [stats] = await connection.execute(
      `SELECT 
        COUNT(DISTINCT sh.primary_sales_id) as total_primary_sales,
        COUNT(DISTINCT sh.secondary_sales_id) as total_secondary_sales,
        AVG(sh.commission_rate) as avg_commission_rate,
        MIN(sh.commission_rate) as min_commission_rate,
        MAX(sh.commission_rate) as max_commission_rate
       FROM sales_hierarchy sh
       LEFT JOIN secondary_sales ss ON sh.secondary_sales_id = ss.id
       WHERE ss.status = 'active'
       ${whereClause}`,
      params
    );

    res.json({
      success: true,
      data: stats[0]
    });

  } catch (error) {
    console.error('获取层级统计错误:', error);
    res.status(500).json({
      success: false,
      message: '获取层级统计失败'
    });
  }
}

// 创建层级关系
async function handleCreateHierarchy(req, res, connection) {
  const { primary_sales_id, secondary_sales_id, commission_rate } = req.body;

  if (!primary_sales_id || !secondary_sales_id || !commission_rate) {
    return res.status(400).json({
      success: false,
      message: '一级销售ID、二级销售ID和佣金比例为必填项'
    });
  }

  if (commission_rate < 0 || commission_rate > 100) {
    return res.status(400).json({
      success: false,
      message: '佣金比例必须在0-100之间'
    });
  }

  try {
    // 检查是否已存在层级关系
    const [existing] = await connection.execute(
      'SELECT * FROM sales_hierarchy WHERE primary_sales_id = ? AND secondary_sales_id = ?',
      [primary_sales_id, secondary_sales_id]
    );

    if (existing.length > 0) {
      return res.status(400).json({
        success: false,
        message: '层级关系已存在'
      });
    }

    // 创建层级关系
    await connection.execute(
      'INSERT INTO sales_hierarchy (primary_sales_id, secondary_sales_id, commission_rate) VALUES (?, ?, ?)',
      [primary_sales_id, secondary_sales_id, commission_rate]
    );

    res.status(201).json({
      success: true,
      message: '层级关系创建成功'
    });

  } catch (error) {
    console.error('创建层级关系错误:', error);
    res.status(500).json({
      success: false,
      message: '创建层级关系失败'
    });
  }
}

// 更新层级关系
async function handleUpdateHierarchy(req, res, connection) {
  const { primary_sales_id, secondary_sales_id, commission_rate } = req.body;

  if (!primary_sales_id || !secondary_sales_id || !commission_rate) {
    return res.status(400).json({
      success: false,
      message: '一级销售ID、二级销售ID和佣金比例为必填项'
    });
  }

  if (commission_rate < 0 || commission_rate > 100) {
    return res.status(400).json({
      success: false,
      message: '佣金比例必须在0-100之间'
    });
  }

  try {
    const [result] = await connection.execute(
      'UPDATE sales_hierarchy SET commission_rate = ? WHERE primary_sales_id = ? AND secondary_sales_id = ?',
      [commission_rate, primary_sales_id, secondary_sales_id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: '层级关系不存在'
      });
    }

    res.json({
      success: true,
      message: '层级关系更新成功'
    });

  } catch (error) {
    console.error('更新层级关系错误:', error);
    res.status(500).json({
      success: false,
      message: '更新层级关系失败'
    });
  }
}

// 移除层级关系
async function handleRemoveHierarchy(req, res, connection) {
  const { primary_sales_id, secondary_sales_id } = req.body;

  if (!primary_sales_id || !secondary_sales_id) {
    return res.status(400).json({
      success: false,
      message: '一级销售ID和二级销售ID为必填项'
    });
  }

  try {
    const [result] = await connection.execute(
      'DELETE FROM sales_hierarchy WHERE primary_sales_id = ? AND secondary_sales_id = ?',
      [primary_sales_id, secondary_sales_id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: '层级关系不存在'
      });
    }

    res.json({
      success: true,
      message: '层级关系移除成功'
    });

  } catch (error) {
    console.error('移除层级关系错误:', error);
    res.status(500).json({
      success: false,
      message: '移除层级关系失败'
    });
  }
}

// 计算佣金
async function handleCalculateCommission(req, res, connection) {
  const { primary_sales_id, order_amount } = req.query;

  if (!primary_sales_id || !order_amount) {
    return res.status(400).json({
      success: false,
      message: '一级销售ID和订单金额为必填项'
    });
  }

  try {
    // 获取一级销售的二级销售列表
    const [secondarySales] = await connection.execute(
      `SELECT 
        ss.id,
        ss.wechat_name,
        sh.commission_rate
       FROM secondary_sales ss
       LEFT JOIN sales_hierarchy sh ON ss.id = sh.secondary_sales_id
       WHERE ss.primary_sales_id = ? AND ss.status = 'active'`,
      [primary_sales_id]
    );

    const amount = parseFloat(order_amount);
    const primaryCommissionRate = 40; // 一级销售默认佣金率40%
    
    // 计算佣金分配
    const commissionCalculation = {
      order_amount: amount,
      primary_commission_rate: primaryCommissionRate,
      primary_commission: amount * (primaryCommissionRate / 100),
      secondary_sales: secondarySales.map(ss => ({
        id: ss.id,
        wechat_name: ss.wechat_name,
        commission_rate: ss.commission_rate,
        commission_amount: amount * (ss.commission_rate / 100)
      })),
      total_secondary_commission: secondarySales.reduce((sum, ss) => 
        sum + (amount * (ss.commission_rate / 100)), 0
      ),
      net_primary_commission: amount * (primaryCommissionRate / 100) - 
        secondarySales.reduce((sum, ss) => sum + (amount * (ss.commission_rate / 100)), 0)
    };

    res.json({
      success: true,
      data: commissionCalculation
    });

  } catch (error) {
    console.error('计算佣金错误:', error);
    res.status(500).json({
      success: false,
      message: '计算佣金失败'
    });
  }
} 