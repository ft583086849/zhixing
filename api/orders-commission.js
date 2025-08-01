// Vercel Serverless Function - 订单分佣API
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

    // 处理佣金计算
    if (req.method === 'POST' && (path === 'calculate' || bodyPath === 'calculate')) {
      await handleCalculate(req, res);
      return;
    }

    // 处理佣金统计（需要管理员权限）
    if (req.method === 'GET' && path === 'stats') {
      const authResult = await verifyAdminAuth(req, res);
      if (!authResult.success) {
        return res.status(authResult.status).json({
          success: false,
          message: authResult.message
        });
      }
      await handleStats(req, res);
      return;
    }

    // 如果没有匹配的路径，返回404
    res.status(404).json({
      success: false,
      message: `路径不存在: ${req.method} ${path || bodyPath || 'default'}`
    });

  } catch (error) {
    console.error('佣金管理API错误:', error);
    res.status(500).json({
      success: false,
      message: error.message || '服务器内部错误'
    });
  }
}

// 佣金统计功能
async function handleStats(req, res) {
  let connection;
  
  try {
    connection = await mysql.createConnection(dbConfig);
    
    // 获取佣金统计数据
    const [commissionStats] = await connection.execute(`
      SELECT 
        SUM(commission_amount) as total_commission,
        COUNT(*) as total_orders,
        AVG(commission_amount) as avg_commission,
        SUM(CASE WHEN status = 'paid' THEN commission_amount ELSE 0 END) as paid_commission,
        COUNT(CASE WHEN status = 'paid' THEN 1 END) as paid_orders
      FROM orders
    `);
    
    // 获取销售层级佣金统计
    const [hierarchyStats] = await connection.execute(`
      SELECT 
        s.sales_type,
        COUNT(o.id) as order_count,
        SUM(o.commission_amount) as total_commission,
        AVG(o.commission_amount) as avg_commission
      FROM sales s
      LEFT JOIN orders o ON s.id = o.sales_id
      GROUP BY s.sales_type
    `);
    
    // 获取时间维度统计
    const [timeStats] = await connection.execute(`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as order_count,
        SUM(commission_amount) as daily_commission
      FROM orders
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    `);
    
    const stats = {
      summary: commissionStats[0] || {},
      hierarchy: hierarchyStats,
      time_series: timeStats
    };
    
    res.status(200).json({
      success: true,
      data: stats
    });
    
  } catch (error) {
    console.error('佣金统计错误:', error);
    res.status(500).json({
      success: false,
      message: error.message || '获取佣金统计数据失败'
    });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// 获取佣金列表
async function handleGetCommissionList(req, res, connection) {
  try {
    // 先检查表结构
    const [columns] = await connection.execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'orders'
      ORDER BY ORDINAL_POSITION
    `, [process.env.DB_NAME]);
    
    console.log('订单表字段:', columns.map(c => c.COLUMN_NAME));
    
    // 简化查询，只查询基本字段
    const [rows] = await connection.execute(`
      SELECT 
        o.id,
        o.tradingview_username,
        o.customer_wechat,
        o.amount,
        o.created_at
      FROM orders o
      ORDER BY o.created_at DESC
      LIMIT 50
    `);

    res.json({
      success: true,
      data: rows,
      message: '佣金列表查询成功（简化版）'
    });
  } catch (error) {
    console.error('获取佣金列表错误:', error);
    res.status(500).json({
      success: false,
      message: '获取佣金列表失败',
      error: error.message
    });
  }
}

// 创建带佣金的订单
async function handleCreateOrderWithCommission(req, res, connection) {
  const { 
    tradingview_username, 
    customer_wechat, 
    link_code, 
    payment_screenshot,
    secondary_sales_id,
    amount,
    duration
  } = req.body;

  if (!tradingview_username || !customer_wechat || !link_code || !amount) {
    return res.status(400).json({
      success: false,
      message: 'TradingView用户名、客户微信、销售链接和金额为必填项'
    });
  }

  try {
    // 开始事务
    await connection.beginTransaction();

    // 1. 创建订单记录
    const [orderResult] = await connection.execute(
      `INSERT INTO orders (tradingview_username, customer_wechat, link_code, payment_screenshot, amount, duration, secondary_sales_id) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [tradingview_username, customer_wechat, link_code, payment_screenshot, amount, duration, secondary_sales_id]
    );

    const orderId = orderResult.insertId;

    // 2. 计算佣金分配
    let commissionDistribution = null;
    
    if (secondary_sales_id) {
      // 获取二级销售信息
      const [secondarySales] = await connection.execute(
        `SELECT 
          ss.id,
          ss.wechat_name,
          ss.primary_sales_id,
          sh.commission_rate
         FROM secondary_sales ss
         LEFT JOIN sales_hierarchy sh ON ss.id = sh.secondary_sales_id
         WHERE ss.id = ? AND ss.status = 'active'`,
        [secondary_sales_id]
      );

      if (secondarySales.length > 0) {
        const ss = secondarySales[0];
        const orderAmount = parseFloat(amount);
        const primaryCommissionRate = 40; // 一级销售默认佣金率40%
        const secondaryCommissionRate = parseFloat(ss.commission_rate);
        
        // 计算佣金
        const primaryCommission = orderAmount * (primaryCommissionRate / 100);
        const secondaryCommission = orderAmount * (secondaryCommissionRate / 100);
        const netPrimaryCommission = primaryCommission - secondaryCommission;

        commissionDistribution = {
          order_id: orderId,
          order_amount: orderAmount,
          primary_sales_id: ss.primary_sales_id,
          secondary_sales_id: ss.id,
          primary_commission_rate: primaryCommissionRate,
          secondary_commission_rate: secondaryCommissionRate,
          primary_commission: primaryCommission,
          secondary_commission: secondaryCommission,
          net_primary_commission: netPrimaryCommission
        };

        // 3. 创建佣金记录
        await connection.execute(
          `INSERT INTO sales_commissions (
            order_id, primary_sales_id, secondary_sales_id, 
            order_amount, primary_commission, secondary_commission, 
            net_primary_commission, status, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', NOW())`,
          [
            orderId, ss.primary_sales_id, ss.id,
            orderAmount, primaryCommission, secondaryCommission,
            netPrimaryCommission
          ]
        );
      }
    }

    // 提交事务
    await connection.commit();

    res.status(201).json({
      success: true,
      message: '订单创建成功',
      data: {
        order_id: orderId,
        commission_distribution: commissionDistribution
      }
    });

  } catch (error) {
    // 回滚事务
    await connection.rollback();
    console.error('创建订单错误:', error);
    res.status(500).json({
      success: false,
      message: '创建订单失败'
    });
  }
}

// 获取佣金历史
async function handleGetCommissionHistory(req, res, connection) {
  try {
    const { primary_sales_id, secondary_sales_id, status, start_date, end_date } = req.query;
    
    let whereClause = 'WHERE 1=1';
    let params = [];
    
    if (primary_sales_id) {
      whereClause += ' AND sc.primary_sales_id = ?';
      params.push(primary_sales_id);
    }
    
    if (secondary_sales_id) {
      whereClause += ' AND sc.secondary_sales_id = ?';
      params.push(secondary_sales_id);
    }
    
    if (status) {
      whereClause += ' AND sc.status = ?';
      params.push(status);
    }
    
    if (start_date) {
      whereClause += ' AND DATE(sc.created_at) >= ?';
      params.push(start_date);
    }
    
    if (end_date) {
      whereClause += ' AND DATE(sc.created_at) <= ?';
      params.push(end_date);
    }
    
    const [commissions] = await connection.execute(
      `SELECT 
        sc.*,
        o.tradingview_username,
        o.customer_wechat,
        o.duration,
        ps.wechat_name as primary_sales_name,
        ss.wechat_name as secondary_sales_name
       FROM sales_commissions sc
       LEFT JOIN orders o ON sc.order_id = o.id
       LEFT JOIN primary_sales ps ON sc.primary_sales_id = ps.id
       LEFT JOIN secondary_sales ss ON sc.secondary_sales_id = ss.id
       ${whereClause}
       ORDER BY sc.created_at DESC`,
      params
    );

    res.json({
      success: true,
      data: commissions
    });

  } catch (error) {
    console.error('获取佣金历史错误:', error);
    res.status(500).json({
      success: false,
      message: '获取佣金历史失败'
    });
  }
}

// 获取佣金统计
async function handleGetCommissionStats(req, res, connection) {
  try {
    const { primary_sales_id, secondary_sales_id, period } = req.query;
    
    let whereClause = 'WHERE 1=1';
    let params = [];
    
    if (primary_sales_id) {
      whereClause += ' AND sc.primary_sales_id = ?';
      params.push(primary_sales_id);
    }
    
    if (secondary_sales_id) {
      whereClause += ' AND sc.secondary_sales_id = ?';
      params.push(secondary_sales_id);
    }
    
    // 根据时间段筛选
    if (period === 'today') {
      whereClause += ' AND DATE(sc.created_at) = CURDATE()';
    } else if (period === 'week') {
      whereClause += ' AND sc.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)';
    } else if (period === 'month') {
      whereClause += ' AND sc.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)';
    }
    
    const [stats] = await connection.execute(
      `SELECT 
        COUNT(*) as total_orders,
        SUM(sc.order_amount) as total_amount,
        SUM(sc.primary_commission) as total_primary_commission,
        SUM(sc.secondary_commission) as total_secondary_commission,
        SUM(sc.net_primary_commission) as total_net_primary_commission,
        AVG(sc.primary_commission) as avg_primary_commission,
        AVG(sc.secondary_commission) as avg_secondary_commission,
        COUNT(CASE WHEN sc.status = 'pending' THEN 1 END) as pending_commissions,
        COUNT(CASE WHEN sc.status = 'settled' THEN 1 END) as settled_commissions
       FROM sales_commissions sc
       ${whereClause}`,
      params
    );

    res.json({
      success: true,
      data: stats[0]
    });

  } catch (error) {
    console.error('获取佣金统计错误:', error);
    res.status(500).json({
      success: false,
      message: '获取佣金统计失败'
    });
  }
}

// 结算佣金
async function handleSettleCommission(req, res, connection) {
  const { commission_ids, settled_by } = req.body;

  if (!commission_ids || !Array.isArray(commission_ids) || commission_ids.length === 0) {
    return res.status(400).json({
      success: false,
      message: '佣金ID列表为必填项'
    });
  }

  try {
    // 开始事务
    await connection.beginTransaction();

    // 批量更新佣金状态
    const placeholders = commission_ids.map(() => '?').join(',');
    const [result] = await connection.execute(
      `UPDATE sales_commissions 
       SET status = 'settled', settled_at = NOW(), settled_by = ?
       WHERE id IN (${placeholders}) AND status = 'pending'`,
      [settled_by, ...commission_ids]
    );

    if (result.affectedRows === 0) {
      return res.status(400).json({
        success: false,
        message: '没有可结算的佣金'
      });
    }

    // 提交事务
    await connection.commit();

    res.json({
      success: true,
      message: `成功结算 ${result.affectedRows} 笔佣金`,
      data: {
        settled_count: result.affectedRows
      }
    });

  } catch (error) {
    // 回滚事务
    await connection.rollback();
    console.error('结算佣金错误:', error);
    res.status(500).json({
      success: false,
      message: '结算佣金失败'
    });
  }
}

// 获取待结算佣金
async function handleGetPendingCommissions(req, res, connection) {
  try {
    const { primary_sales_id, secondary_sales_id } = req.query;
    
    let whereClause = 'WHERE sc.status = "pending"';
    let params = [];
    
    if (primary_sales_id) {
      whereClause += ' AND sc.primary_sales_id = ?';
      params.push(primary_sales_id);
    }
    
    if (secondary_sales_id) {
      whereClause += ' AND sc.secondary_sales_id = ?';
      params.push(secondary_sales_id);
    }
    
    const [pendingCommissions] = await connection.execute(
      `SELECT 
        sc.*,
        o.tradingview_username,
        o.customer_wechat,
        o.duration,
        ps.wechat_name as primary_sales_name,
        ss.wechat_name as secondary_sales_name
       FROM sales_commissions sc
       LEFT JOIN orders o ON sc.order_id = o.id
       LEFT JOIN primary_sales ps ON sc.primary_sales_id = ps.id
       LEFT JOIN secondary_sales ss ON sc.secondary_sales_id = ss.id
       ${whereClause}
       ORDER BY sc.created_at ASC`,
      params
    );

    res.json({
      success: true,
      data: pendingCommissions
    });

  } catch (error) {
    console.error('获取待结算佣金错误:', error);
    res.status(500).json({
      success: false,
      message: '获取待结算佣金失败'
    });
  }
} 