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

// 修复版：统一销售代码查找函数（支持临时代码）
async function findSalesByCode(sales_code, connection) {
  try {
    console.log('🔍 查找销售代码:', sales_code);
    
    // 1. 查找一级销售 - 支持临时代码格式 ps_123
    let primary = [];
    if (sales_code.startsWith('ps_')) {
      const primaryId = sales_code.replace('ps_', '');
      [primary] = await connection.execute(
        'SELECT *, "primary" as sales_type FROM primary_sales WHERE id = ?', 
        [primaryId]
      );
    } else {
      [primary] = await connection.execute(
        'SELECT *, "primary" as sales_type FROM primary_sales WHERE sales_code = ?', 
        [sales_code]
      );
    }
    console.log('📊 一级销售查询结果:', primary.length);
    
    if (primary.length > 0) {
      console.log('✅ 找到一级销售');
      // 为临时代码添加销售代码字段
      if (sales_code.startsWith('ps_')) {
        primary[0].sales_code = sales_code;
      }
      return { sales: primary[0], type: 'primary' };
    }
    
    // 2. 查找二级销售 - 支持临时代码格式 ss_123
    let secondary = [];
    if (sales_code.startsWith('ss_')) {
      const secondaryId = sales_code.replace('ss_', '');
      [secondary] = await connection.execute(
        'SELECT *, "secondary" as sales_type FROM secondary_sales WHERE id = ?', 
        [secondaryId]
      );
    } else {
      [secondary] = await connection.execute(
        'SELECT *, "secondary" as sales_type FROM secondary_sales WHERE sales_code = ?', 
        [sales_code]
      );
    }
    console.log('📊 二级销售查询结果:', secondary.length);
    
    if (secondary.length > 0) {
      console.log('✅ 找到二级销售');
      // 为临时代码添加销售代码字段
      if (sales_code.startsWith('ss_')) {
        secondary[0].sales_code = sales_code;
      }
      return { sales: secondary[0], type: 'secondary' };
    }
    
    // 3. 查找遗留的sales表（兼容性处理）- 检查多个字段
    // 先查找 sales_code 字段（如果存在且匹配）
    const [legacySalesCode] = await connection.execute(
      'SELECT *, "legacy" as sales_type FROM sales WHERE sales_code = ?', 
      [sales_code]
    );
    console.log('📊 遗留销售(sales_code)查询结果:', legacySalesCode.length);
    
    if (legacySalesCode.length > 0) {
      console.log('✅ 通过sales_code找到遗留销售');
      return { sales: legacySalesCode[0], type: 'legacy' };
    }
    
    // 再查找 link_code 字段
    const [legacyLinkCode] = await connection.execute(
      'SELECT *, "legacy" as sales_type FROM sales WHERE link_code = ?', 
      [sales_code]
    );
    console.log('📊 遗留销售(link_code)查询结果:', legacyLinkCode.length);
    
    if (legacyLinkCode.length > 0) {
      console.log('✅ 通过link_code找到遗留销售');
      return { sales: legacyLinkCode[0], type: 'legacy' };
    }
    
    // 4. 未找到
    console.log('❌ 未找到任何销售记录');
    return null;
    
  } catch (error) {
    console.error('❌ 查找销售代码错误:', error);
    return null;
  }
}

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
      duration: rawDuration,
      amount,
      payment_method,
      payment_time,
      purchase_type = 'immediate',
      alipay_amount,
      crypto_amount
    } = req.body;

    // 后端字段适配 - 映射为数据库兼容的短值
    let duration, mappedPaymentMethod, mappedPurchaseType;
    
    // Duration映射 (字符串 -> 数字，数据库friendly)
    if (typeof rawDuration === 'number') {
      duration = rawDuration.toString();
    } else {
      const durationMap = {
        '7days': '7',
        '1month': '30',
        '3months': '90', 
        '6months': '180',
        'lifetime': '365'
      };
      duration = durationMap[rawDuration] || rawDuration;
    }
    
    // Payment method映射 (字符串 -> 数字编码)
    const paymentMethodMap = {
      'alipay': '1',
      'crypto': '2',
      'free': '0'
    };
    mappedPaymentMethod = paymentMethodMap[payment_method] || payment_method;
    
    // Purchase type映射 (字符串 -> 数字编码)
    const purchaseTypeMap = {
      'immediate': '1',
      'advance': '2'
    };
    mappedPurchaseType = purchaseTypeMap[purchase_type] || purchase_type;

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

    // 统一销售代码查找逻辑（重构版）
    const salesResult = await findSalesByCode(finalSalesCode, connection);
    
    let sales = null;
    let salesType = null;
    
    if (salesResult) {
      sales = salesResult.sales;
      salesType = salesResult.type;
    }
    
    if (!sales) {
      await connection.end();
      return res.status(404).json({
        success: false,
        message: '下单拥挤，请等待',
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
    const rawCommissionRate = parseFloat(sales.commission_rate || 30); // sales表存储百分比，独立二级销售默认30%，一级销售40%
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

    // 设置销售身份信息
    let dbSalesType = null;
    let primarySalesId = null;
    let secondarySalesId = null;
    
    if (salesType === 'primary') {
      dbSalesType = 'primary';
      primarySalesId = sales.id;
      secondarySalesId = null;
    } else if (salesType === 'secondary') {
      dbSalesType = 'secondary';
      primarySalesId = sales.primary_sales_id || null; // 二级销售可能有上级一级销售
      secondarySalesId = sales.id;
    } else if (salesType === 'legacy') {
      // 遗留销售默认视为二级销售
      dbSalesType = 'secondary';
      primarySalesId = null;
      secondarySalesId = null; // 遗留销售没有新表ID
    }

      // 后端字段适配：使用映射后的短值插入数据库，包含销售身份信息
      const [result] = await connection.execute(
        `INSERT INTO orders (
          link_code, tradingview_username, customer_wechat, duration, amount, 
          payment_method, payment_time, purchase_type, effective_time, expiry_time,
          commission_rate, commission_amount, sales_type, primary_sales_id, secondary_sales_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          finalSalesCode, // 使用sales_code作为link_code的兼容值
          tradingview_username, 
          customer_wechat || null, 
          duration, // 已映射为短值 (7, 30, 90, etc.)
          amount,
          mappedPaymentMethod, // 已映射为数字编码 (1, 2, 0)
          formatDateForMySQL(new Date(payment_time)), 
          mappedPurchaseType, // 已映射为数字编码 (1, 2)
          formatDateForMySQL(effectiveTime), 
          formatDateForMySQL(expiryTime),
          commissionRate,
          commissionAmount,
          dbSalesType, // 销售类型：primary/secondary
          primarySalesId, // 一级销售ID
          secondarySalesId // 二级销售ID
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

  // 正确的sales_code标准：直接使用sales_code关联
  const [rows] = await connection.execute(
    `SELECT 
       o.*,
       CASE 
         WHEN o.sales_type = 'primary' THEN ps.wechat_name
         WHEN o.sales_type = 'secondary' THEN ss.wechat_name
         ELSE s.wechat_name
       END as sales_wechat_name,
       CASE 
         WHEN o.sales_type = 'primary' THEN ps.payment_method
         WHEN o.sales_type = 'secondary' THEN ss.payment_method
         ELSE s.payment_method
       END as sales_payment_method
     FROM orders o 
     LEFT JOIN primary_sales ps ON o.sales_type = 'primary' AND o.primary_sales_id = ps.id
     LEFT JOIN secondary_sales ss ON o.sales_type = 'secondary' AND o.secondary_sales_id = ss.id
     LEFT JOIN sales s ON o.sales_type = 'legacy' AND o.sales_code = s.link_code
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

      if (!['pending_payment', 'pending_config', 'confirmed', 'active', 'expired', 'cancelled', 'rejected'].includes(status)) {
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