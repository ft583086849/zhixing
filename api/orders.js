// Vercel Serverless Function - 订单API
const mysql = require('mysql2/promise');
const multer = require('multer');
const jwt = require('jsonwebtoken');

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
    const connection = await mysql.createConnection(dbConfig);
    const { path, id } = req.query;

    // 需要权限验证的端点
    const protectedEndpoints = ['list', 'update'];
    
    if (req.method === 'GET' && protectedEndpoints.includes(path)) {
      const authResult = await verifyAdminAuth(req, res);
      if (!authResult.success) {
        await connection.end();
        return res.status(authResult.status).json({
          success: false,
          message: authResult.message
        });
      }
    }

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
      sales_code,
      link_code, // 兼容性支持
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

    // 处理销售代码兼容性：优先使用sales_code，如果没有则使用link_code
    let finalSalesCode = sales_code || link_code;
    
    // 验证必填字段
    const missingFields = [];
    if (!finalSalesCode) missingFields.push('sales_code/link_code');
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
        received: { sales_code: finalSalesCode, link_code, tradingview_username, duration, amount, payment_method, payment_time }
      });
    }

    // 验证销售代码是否存在（兼容新的links表和老的sales表）
    let sales = null;
    let salesType = null;
    
    // 首先查找links表中的用户销售链接
    const [linkRows] = await connection.execute(
      'SELECT * FROM links WHERE link_code = ? AND link_type = "user_sales"',
      [finalSalesCode]
    );
    
    if (linkRows.length > 0) {
      const link = linkRows[0];
      // 根据links表的sales_id查找对应的销售信息
      
      // 先查一级销售
      const [primaryRows] = await connection.execute(
        'SELECT *, "primary" as sales_type FROM primary_sales WHERE id = ?',
        [link.sales_id]
      );
      
      if (primaryRows.length > 0) {
        sales = primaryRows[0];
        salesType = 'primary';
      } else {
        // 再查二级销售
        const [secondaryRows] = await connection.execute(
          'SELECT *, "secondary" as sales_type FROM secondary_sales WHERE id = ?',
          [link.sales_id]
        );
        
        if (secondaryRows.length > 0) {
          sales = secondaryRows[0];
          salesType = 'secondary';
        }
      }
    }
    
    // 如果在links表中没找到，则回退到老的sales表查找
    if (!sales) {
      const [salesRows] = await connection.execute(
        'SELECT *, "legacy" as sales_type FROM sales WHERE link_code = ?',
        [finalSalesCode]
      );
      
      if (salesRows.length > 0) {
        sales = salesRows[0];
        salesType = 'legacy';
      }
    }
    
    if (!sales) {
      await connection.end();
      return res.status(404).json({
        success: false,
        message: '销售链接不存在',
        link_code: finalSalesCode
      });
    }

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
          finalSalesCode, 
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
          duration === '7days' ? 'pending_configuration_confirmation' : 'pending_payment_confirmation',
          screenshotData,
          formatDateForMySQL(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)) // 7天后过期
        ]
      );

    // 更新销售统计
    await connection.execute(
      'UPDATE sales SET total_orders = total_orders + 1, total_revenue = total_revenue + ? WHERE link_code = ?',
      [amount, finalSalesCode]
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
    `SELECT 
       o.*,
       COALESCE(ps.wechat_name, ss.wechat_name, s.wechat_name) as sales_wechat_name,
       COALESCE(ps.payment_method, ss.payment_method, s.payment_method) as sales_payment_method,
       CASE 
         WHEN ps.id IS NOT NULL THEN 'primary'
         WHEN ss.id IS NOT NULL THEN 'secondary' 
         ELSE 'legacy'
       END as sales_type
     FROM orders o 
     LEFT JOIN links l ON o.link_code = l.link_code AND l.link_type = 'user_sales'
     LEFT JOIN primary_sales ps ON l.sales_id = ps.id
     LEFT JOIN secondary_sales ss ON l.sales_id = ss.id
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

  if (!['pending_payment_confirmation', 'pending_configuration_confirmation', 'confirmed', 'active', 'expired', 'cancelled', 'rejected'].includes(status)) {
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