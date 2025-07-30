// Vercel Serverless Function - 管理员API
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

// 验证管理员token
async function authenticateAdmin(req) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    throw new Error('未提供认证token');
  }

  const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default-secret');
  return decoded;
}

module.exports = async (req, res) => {
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
    // 验证管理员权限
    await authenticateAdmin(req);

    const connection = await mysql.createConnection(dbConfig);
    const { path, id } = req.query;

    if (req.method === 'GET' && path === 'stats') {
      await handleGetStats(req, res, connection);
    } else if (req.method === 'GET' && path === 'orders') {
      await handleGetOrders(req, res, connection);
    } else if (req.method === 'GET' && path === 'customers') {
      await handleGetCustomers(req, res, connection);
    } else if (req.method === 'GET' && path === 'sales') {
      await handleGetSales(req, res, connection);
    } else if (req.method === 'PUT' && path === 'update-order' && id) {
      await handleUpdateOrder(req, res, connection, id);
    } else if (req.method === 'PUT' && path === 'update-commission' && id) {
      await handleUpdateCommission(req, res, connection, id);
    } else {
      res.status(404).json({
        success: false,
        message: `路径不存在: ${req.method} ${path || 'default'}`
      });
    }

    await connection.end();

  } catch (error) {
    console.error('管理员API错误:', error);
    res.status(500).json({
      success: false,
      message: error.message || '服务器内部错误'
    });
  }
};

// 获取统计信息
async function handleGetStats(req, res, connection) {
  // 总订单数
  const [totalOrdersResult] = await connection.execute(
    'SELECT COUNT(*) as count FROM orders'
  );

  // 今日订单数
  const [todayOrdersResult] = await connection.execute(
    'SELECT COUNT(*) as count FROM orders WHERE DATE(created_at) = CURDATE()'
  );

  // 总收入
  const [totalRevenueResult] = await connection.execute(
    'SELECT SUM(amount) as total FROM orders WHERE status = "active"'
  );

  // 今日收入
  const [todayRevenueResult] = await connection.execute(
    'SELECT SUM(amount) as total FROM orders WHERE status = "active" AND DATE(created_at) = CURDATE()'
  );

  // 销售员数量
  const [salesCountResult] = await connection.execute(
    'SELECT COUNT(*) as count FROM sales'
  );

  // 待审核订单数
  const [pendingOrdersResult] = await connection.execute(
    'SELECT COUNT(*) as count FROM orders WHERE status = "pending_review"'
  );

  res.json({
    success: true,
    data: {
      totalOrders: totalOrdersResult[0].count,
      todayOrders: todayOrdersResult[0].count,
      totalRevenue: totalRevenueResult[0].total || 0,
      todayRevenue: todayRevenueResult[0].total || 0,
      salesCount: salesCountResult[0].count,
      pendingOrders: pendingOrdersResult[0].count
    }
  });
}

// 获取订单列表
async function handleGetOrders(req, res, connection) {
  const { page = 1, limit = 10, status, startDate, endDate } = req.query;
  const offset = (page - 1) * limit;

  let whereClause = 'WHERE 1=1';
  let params = [];

  if (status) {
    whereClause += ' AND o.status = ?';
    params.push(status);
  }

  if (startDate) {
    whereClause += ' AND DATE(o.created_at) >= ?';
    params.push(startDate);
  }

  if (endDate) {
    whereClause += ' AND DATE(o.created_at) <= ?';
    params.push(endDate);
  }

  const [rows] = await connection.execute(
    `SELECT o.*, s.wechat_name, s.payment_method as sales_payment_method
     FROM orders o 
     LEFT JOIN sales s ON o.link_code = s.link_code 
     ${whereClause}
     ORDER BY o.created_at DESC 
     LIMIT ? OFFSET ?`,
    [...params, parseInt(limit), parseInt(offset)]
  );

  const [countRows] = await connection.execute(
    `SELECT COUNT(*) as total FROM orders o ${whereClause}`,
    params
  );

  res.json({
    success: true,
    data: {
      orders: rows,
      total: countRows[0].total,
      page: parseInt(page),
      limit: parseInt(limit)
    }
  });
}

// 获取客户信息
async function handleGetCustomers(req, res, connection) {
  const [rows] = await connection.execute(
    `SELECT 
      customer_wechat, 
      COUNT(*) as order_count,
      SUM(amount) as total_amount,
      MAX(created_at) as last_order_date
     FROM orders 
     WHERE customer_wechat IS NOT NULL AND customer_wechat != ''
     GROUP BY customer_wechat
     ORDER BY total_amount DESC`
  );

  res.json({
    success: true,
    data: rows
  });
}

// 获取销售信息
async function handleGetSales(req, res, connection) {
  const [rows] = await connection.execute(
    `SELECT 
      s.*,
      COUNT(o.id) as order_count,
      SUM(o.amount) as total_revenue,
      SUM(o.commission_amount) as total_commission
     FROM sales s
     LEFT JOIN orders o ON s.link_code = o.link_code
     GROUP BY s.id
     ORDER BY total_revenue DESC`
  );

  res.json({
    success: true,
    data: rows
  });
}

// 更新订单状态
async function handleUpdateOrder(req, res, connection, orderId) {
  const { status } = req.body;

  if (!['pending_review', 'active', 'expired', 'cancelled'].includes(status)) {
    return res.status(400).json({
      success: false,
      message: '无效的订单状态'
    });
  }

  await connection.execute(
    'UPDATE orders SET status = ?, updated_at = NOW() WHERE id = ?',
    [status, orderId]
  );

  res.json({
    success: true,
    message: '订单状态更新成功'
  });
}

// 更新佣金比例
async function handleUpdateCommission(req, res, connection, salesId) {
  const { commissionRate } = req.body;

  if (!commissionRate || commissionRate < 0 || commissionRate > 1) {
    return res.status(400).json({
      success: false,
      message: '佣金比例必须在0-1之间'
    });
  }

  await connection.execute(
    'UPDATE sales SET commission_rate = ?, updated_at = NOW() WHERE id = ?',
    [commissionRate, salesId]
  );

  res.json({
    success: true,
    message: '佣金比例更新成功'
  });
}