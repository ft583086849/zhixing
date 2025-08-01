// Vercel Serverless Function - 订单API
const mysql = require('mysql2/promise');
const multer = require('multer');

// 配置multer用于文件上传 - 针对Vercel Serverless优化
const upload = multer({
  storage: multer.memoryStorage(), // 使用内存存储，适合Serverless
  limits: {
    fileSize: 5 * 1024 * 1024, // 限制5MB
    files: 1 // 只允许1个文件
  },
  fileFilter: (req, file, cb) => {
    // 只允许图片文件
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('只允许上传图片文件'), false);
    }
  }
}).single('screenshot'); // 直接指定字段名

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

  try {
    const connection = await mysql.createConnection(dbConfig);
    const { path, id } = req.query;

    if (req.method === 'POST' && path === 'create') {
      // 使用multer处理文件上传
      upload(req, res, async (err) => {
        if (err) {
          console.error('文件上传错误:', err);
          await connection.end();
          return res.status(400).json({
            success: false,
            message: err.message || '文件上传失败'
          });
        }
        
        try {
          await handleCreateOrder(req, res, connection);
        } catch (error) {
          console.error('创建订单错误:', error);
          await connection.end();
          res.status(500).json({
            success: false,
            message: '服务器内部错误',
            error: error.message
          });
        }
      });
    } else if (req.method === 'GET' && (path === 'list' || !path)) {
      await handleGetOrdersList(req, res, connection);
      await connection.end();
    } else if (req.method === 'PUT' && path === 'update' && id) {
      await handleUpdateOrderStatus(req, res, connection, id);
      await connection.end();
    } else {
      await connection.end();
      res.status(404).json({
        success: false,
        message: `路径不存在: ${req.method} ${path || 'default'}`
      });
    }

  } catch (error) {
    console.error('订单API错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误',
      error: error.message
    });
  }
};

// 创建订单
async function handleCreateOrder(req, res, connection) {
  try {
    const {
      link_code,
      tradingview_username,
      customer_wechat,
      duration,
      amount,
      payment_method,
      payment_time,
      purchase_type = 'immediate',
      alipay_amount,
      crypto_amount
    } = req.body;

    console.log('接收到的数据:', req.body);
    console.log('文件信息:', req.file);
    console.log('amount类型:', typeof amount, '值:', amount);

    // 验证必填字段
    const missingFields = [];
    if (!link_code) missingFields.push('link_code');
    if (!tradingview_username) missingFields.push('tradingview_username');
    if (!duration) missingFields.push('duration');
    if (amount === undefined || amount === null || amount === '' || (typeof amount === 'string' && amount.trim() === '')) missingFields.push('amount');
    if (!payment_method) missingFields.push('payment_method');
    if (!payment_time) missingFields.push('payment_time');
    
    if (missingFields.length > 0) {
      await connection.end();
      return res.status(400).json({
        success: false,
        message: `缺少必填字段: ${missingFields.join(', ')}`,
        missingFields: missingFields,
        received: { link_code, tradingview_username, duration, amount, payment_method, payment_time }
      });
    }

    // 验证链接代码是否存在
    const [salesRows] = await connection.execute(
      'SELECT * FROM sales WHERE link_code = ?',
      [link_code]
    );

    if (salesRows.length === 0) {
      await connection.end();
      return res.status(404).json({
        success: false,
        message: '销售链接不存在',
        link_code
      });
    }

    const sales = salesRows[0];

    // 验证TradingView用户名是否已被绑定
    const [existingOrders] = await connection.execute(
      'SELECT * FROM orders WHERE tradingview_username = ? AND status != "cancelled"',
      [tradingview_username]
    );

    // 如果是七天免费订单，检查是否已经使用过免费期
    if (duration === '7days' && existingOrders.length > 0) {
      // 检查是否有七天免费订单记录
      const [freeOrders] = await connection.execute(
        'SELECT * FROM orders WHERE tradingview_username = ? AND duration = "7days" AND status != "cancelled"',
        [tradingview_username]
      );
      
      if (freeOrders.length > 0) {
        await connection.end();
        return res.status(400).json({
          success: false,
          message: '您已享受过免费期，请续费使用',
          tradingview_username
        });
      }
    }
    
    // 如果不是七天免费订单，但该账号已有其他订单，则不允许
    if (duration !== '7days' && existingOrders.length > 0) {
      await connection.end();
      return res.status(400).json({
        success: false,
        message: '您的tradingview已通过销售绑定，不支持二次销售绑定',
        tradingview_username
      });
    }

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

    // 计算佣金 - 正确处理百分比到小数的转换
    const rawCommissionRate = parseFloat(sales.commission_rate || 15); // sales表存储百分比，如40.00
    const commissionRate = Math.min(Math.max((rawCommissionRate / 100), 0.0000), 0.9999); // 转换为小数，限制在DECIMAL(5,4)范围内
    const commissionAmount = Math.round(parseFloat(amount) * commissionRate * 100) / 100; // 保留两位小数

    // 格式化日期为MySQL兼容格式
    const formatDateForMySQL = (date) => {
      return date.toISOString().slice(0, 19).replace('T', ' ');
    };

    // 处理截图数据（Base64格式）
    let screenshotData = null;
    if (req.body.screenshot_data) {
      // 将Base64字符串转换为Buffer存储
      const base64Data = req.body.screenshot_data.replace(/^data:image\/[a-z]+;base64,/, '');
      screenshotData = Buffer.from(base64Data, 'base64');
      console.log('截图数据接收成功，大小:', screenshotData.length, 'bytes');
    }

          // 创建订单 - 暂时不插入commission_rate，使用数据库默认值
      const [result] = await connection.execute(
        `INSERT INTO orders (
          link_code, tradingview_username, customer_wechat, duration, amount, 
          payment_method, payment_time, purchase_type, effective_time, expiry_time,
          alipay_amount, crypto_amount, commission_amount, status, screenshot_data, screenshot_expires_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          link_code, 
          tradingview_username, 
          customer_wechat || null, 
          duration, 
          amount,
          payment_method, 
          formatDateForMySQL(new Date(payment_time)), 
          purchase_type, 
          formatDateForMySQL(effectiveTime), 
          formatDateForMySQL(expiryTime),
          alipay_amount || null, 
          crypto_amount || null,
          commissionAmount, 
          'pending_review',
          screenshotData,
          formatDateForMySQL(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)) // 7天后过期
        ]
      );

    // 更新销售统计
    await connection.execute(
      'UPDATE sales SET total_orders = total_orders + 1, total_revenue = total_revenue + ? WHERE link_code = ?',
      [amount, link_code]
    );

    await connection.end();

    res.json({
      success: true,
      message: '订单创建成功',
      data: {
        order_id: result.insertId,
        effective_time: effectiveTime,
        expiry_time: expiryTime,
        commission_amount: commissionAmount,
        has_screenshot: !!req.body.screenshot_data
      }
    });
  } catch (error) {
    console.error('创建订单详细错误:', error);
    await connection.end();
    res.status(500).json({
      success: false,
      message: '服务器内部错误',
      error: error.message
    });
  }
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