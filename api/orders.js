// Vercel Serverless Function - 订单API
const mysql = require('mysql2/promise');
const multer = require('multer');
const path = require('path');

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
    const connection = await mysql.createConnection(dbConfig);
    const { path, id } = req.query;

    if (req.method === 'POST' && path === 'create') {
      await handleCreateOrder(req, res, connection);
    } else if (req.method === 'GET' && !path) {
      await handleGetOrdersList(req, res, connection);
    } else if (req.method === 'PUT' && path === 'update' && id) {
      await handleUpdateOrderStatus(req, res, connection, id);
    } else {
      res.status(404).json({
        success: false,
        message: `路径不存在: ${req.method} ${path || 'default'}`
      });
    }

    await connection.end();

  } catch (error) {
    console.error('订单API错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
};

// 创建订单
async function handleCreateOrder(req, res, connection) {
  const {
    link_code,
    tradingview_username,
    customer_wechat,
    duration,
    amount,
    payment_method,
    payment_time,
    purchase_type = 'immediate',
    alipay_amount
  } = req.body;

  // 验证必填字段
  if (!link_code || !tradingview_username || !duration || !amount || !payment_method || !payment_time) {
    return res.status(400).json({
      success: false,
      message: '缺少必填字段'
    });
  }

  // 验证链接代码是否存在
  const [salesRows] = await connection.execute(
    'SELECT * FROM sales WHERE link_code = ?',
    [link_code]
  );

  if (salesRows.length === 0) {
    return res.status(404).json({
      success: false,
      message: '销售链接不存在'
    });
  }

  const sales = salesRows[0];

  // 计算生效时间和过期时间
  let effectiveTime = new Date();
  let expiryTime = new Date();
  
  if (purchase_type === 'advance') {
    effectiveTime = new Date(req.body.effective_time);
  }

  // 计算过期时间
  switch (duration) {
    case '7days':
      expiryTime = new Date(effectiveTime.getTime() + 7 * 24 * 60 * 60 * 1000);
      break;
    case '1month':
      expiryTime = new Date(effectiveTime);
      expiryTime.setMonth(expiryTime.getMonth() + 1);
      break;
    case '3months':
      expiryTime = new Date(effectiveTime);
      expiryTime.setMonth(expiryTime.getMonth() + 3);
      break;
    case '6months':
      expiryTime = new Date(effectiveTime);
      expiryTime.setMonth(expiryTime.getMonth() + 6);
      break;
    case '1year':
      expiryTime = new Date(effectiveTime);
      expiryTime.setFullYear(expiryTime.getFullYear() + 1);
      break;
    case 'lifetime':
      expiryTime = new Date('2099-12-31');
      break;
  }

  // 计算佣金
  const commissionRate = sales.commission_rate || 0.15;
  const commissionAmount = parseFloat(amount) * commissionRate;

  // 创建订单
  const [result] = await connection.execute(
    `INSERT INTO orders (
      link_code, tradingview_username, customer_wechat, duration, amount, 
      payment_method, payment_time, purchase_type, effective_time, expiry_time,
      alipay_amount, commission_rate, commission_amount, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      link_code, tradingview_username, customer_wechat, duration, amount,
      payment_method, payment_time, purchase_type, effectiveTime, expiryTime,
      alipay_amount, commissionRate, commissionAmount, 'pending_review'
    ]
  );

  // 更新销售统计
  await connection.execute(
    'UPDATE sales SET total_orders = total_orders + 1, total_revenue = total_revenue + ? WHERE link_code = ?',
    [amount, link_code]
  );

  res.json({
    success: true,
    message: '订单创建成功',
    data: {
      order_id: result.insertId,
      effective_time: effectiveTime,
      expiry_time: expiryTime,
      commission_amount: commissionAmount
    }
  });
}

// 获取订单列表
async function handleGetOrdersList(req, res, connection) {
  const { page = 1, limit = 10, status } = req.query;
  const offset = (page - 1) * limit;

  let whereClause = '';
  let params = [];

  if (status) {
    whereClause = 'WHERE status = ?';
    params.push(status);
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
    `SELECT COUNT(*) as total FROM orders ${whereClause}`,
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

// 更新订单状态
async function handleUpdateOrderStatus(req, res, connection, orderId) {
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