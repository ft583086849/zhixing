// Vercel Serverless Function - 二级销售API（重构版）
const mysql = require('mysql2/promise');
const { v4: uuidv4 } = require('uuid');
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

    // 处理二级销售对账（GET请求）- 优先处理
    if (req.method === 'GET' && path === 'settlement') {
      const connection = await mysql.createConnection(dbConfig);
      try {
        await handleSecondarySalesSettlement(req, res, connection);
      } finally {
        await connection.end();
      }
      return;
    }

    // 处理二级销售注册验证（替代之前的/api/links调用）
    if (req.method === 'GET' && (path === 'validate' || !path)) {
      const connection = await mysql.createConnection(dbConfig);
      try {
        await handleValidateRegistrationCode(req, res, connection);
      } finally {
        await connection.end();
      }
      return;
    }

    // 处理二级销售注册
    if (req.method === 'POST' && (path === 'register' || bodyPath === 'register')) {
      const connection = await mysql.createConnection(dbConfig);
      try {
        await handleRegisterSecondarySales(req, res, connection);
      } finally {
        await connection.end();
      }
      return;
    }

    // 处理独立二级销售注册
    if (req.method === 'POST' && (path === 'register-independent' || bodyPath === 'register-independent')) {
      const connection = await mysql.createConnection(dbConfig);
      try {
        // 设置independent标志为true
        req.body.independent = true;
        await handleRegisterSecondarySales(req, res, connection);
      } finally {
        await connection.end();
      }
      return;
    }

    // 处理二级销售列表（管理员权限）
    if (req.method === 'GET' && path === 'list') {
      const authResult = await verifyAdminAuth(req, res);
      if (!authResult.success) {
        return res.status(authResult.status).json({
          success: false,
          message: authResult.message
        });
      }
      const connection = await mysql.createConnection(dbConfig);
      try {
        await handleGetSecondarySalesList(req, res, connection);
      } finally {
        await connection.end();
      }
      return;
    }

    // 如果没有匹配的路径，返回404
    res.status(404).json({
      success: false,
      message: `路径不存在: ${req.method} ${path || bodyPath || 'default'}`
    });

  } catch (error) {
    console.error('二级销售API错误:', error);
    res.status(500).json({
      success: false,
      message: error.message || '服务器内部错误'
    });
  }
}

// 验证二级销售注册代码（重构版 - 直接查找primary_sales表）
async function handleValidateRegistrationCode(req, res, connection) {
  try {
    const { link_code, link_type } = req.query;
    
    // 兼容前端的调用格式
    if (link_type !== 'secondary_registration') {
      return res.status(400).json({
        success: false,
        message: '无效的链接类型'
      });
    }

    // 标准实现：查找SR开头的secondary_registration_code
    let rows = [];
    
    if (link_code && link_code.startsWith('SR')) {
      console.log('🔍 查找二级销售注册代码:', link_code);
      [rows] = await connection.execute(
        'SELECT id, wechat_name, payment_method FROM primary_sales WHERE secondary_registration_code = ?',
        [link_code]
      );
      console.log('📊 查找结果:', rows.length, rows.length > 0 ? rows[0] : 'none');
    } else if (link_code && link_code.startsWith('reg_')) {
      // 兼容性：支持旧的reg_格式
      const primaryId = link_code.replace('reg_', '');
      console.log('🔍 查找一级销售ID (兼容模式):', primaryId);
      [rows] = await connection.execute(
        'SELECT id, wechat_name, payment_method FROM primary_sales WHERE id = ?',
        [primaryId]
      );
      console.log('📊 查找结果:', rows.length, rows.length > 0 ? rows[0] : 'none');
    } else {
      console.log('❌ 无效的注册码格式:', link_code);
    }

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: '注册码无效或已过期'
      });
    }

    // 返回验证成功的信息
    res.status(200).json({
      success: true,
      message: '注册码验证成功',
      data: {
        primary_sales_id: rows[0].id,
        primary_sales_wechat: rows[0].wechat_name,
        registration_code: link_code
      }
    });

  } catch (error) {
    console.error('验证注册码失败:', error);
    res.status(500).json({
      success: false,
      message: '验证注册码失败'
    });
  }
}

// 创建二级销售（重构版）
async function handleRegisterSecondarySales(req, res, connection) {
  try {
    const {
      wechat_name,
      payment_method,
      payment_address,
      alipay_surname,
      chain_name,
      registration_code,
      primary_sales_id,
      independent = false
    } = req.body;

    // 验证必填字段（独立注册时不需要registration_code）
    const missingFields = [];
    if (!wechat_name) missingFields.push('微信号');
    if (!payment_method) missingFields.push('收款方式');
    if (!payment_address) missingFields.push('收款地址');
    if (!independent && !registration_code) missingFields.push('注册码');
    
    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: `以下字段为必填项: ${missingFields.join('、')}`
      });
    }

    // 验证收款方式
    if (!['alipay', 'crypto'].includes(payment_method)) {
      return res.status(400).json({
        success: false,
        message: '收款方式只能是支付宝或线上地址码'
      });
    }

    // 支付宝收款验证
    if (payment_method === 'alipay' && !alipay_surname) {
      return res.status(400).json({
        success: false,
        message: '支付宝收款需要填写收款人姓氏'
      });
    }

    // 线上地址码验证
    if (payment_method === 'crypto' && !chain_name) {
      return res.status(400).json({
        success: false,
        message: '线上地址码需要填写链名'
      });
    }

    // 验证一级销售（仅对非独立注册）
    let validPrimarySalesId = null;
    
    if (!independent) {
      // 标准实现：支持SR开头的secondary_registration_code
      let primarySales = [];
      
      if (registration_code && registration_code.startsWith('SR')) {
        [primarySales] = await connection.execute(
          'SELECT id FROM primary_sales WHERE secondary_registration_code = ?',
          [registration_code]
        );
      } else if (registration_code && registration_code.startsWith('reg_')) {
        // 兼容性：支持旧的reg_格式
        const primaryId = registration_code.replace('reg_', '');
        [primarySales] = await connection.execute(
          'SELECT id FROM primary_sales WHERE id = ?',
          [primaryId]
        );
      }

      if (primarySales.length === 0) {
        return res.status(400).json({
          success: false,
          message: '注册码无效或已过期'
        });
      }

      validPrimarySalesId = primarySales[0].id;
    }

    // 检查微信号是否已存在（全局去重）
    const [existingSales] = await connection.execute(
      `SELECT wechat_name FROM primary_sales WHERE wechat_name = ? 
       UNION SELECT wechat_name FROM secondary_sales WHERE wechat_name = ? 
       UNION SELECT wechat_name FROM sales WHERE wechat_name = ?`,
      [wechat_name, wechat_name, wechat_name]
    );

    if (existingSales.length > 0) {
      return res.status(400).json({
        success: false,
        message: '一个微信号仅支持一次注册。'
      });
    }

    // 生成唯一销售代码
    const salesCode = uuidv4().replace(/-/g, '').substring(0, 16);

    // 临时兼容性实现：移除不存在的字段，等待数据库字段添加
    const [result] = await connection.execute(
      `INSERT INTO secondary_sales (
        wechat_name, primary_sales_id, 
        payment_method, payment_address, alipay_surname, chain_name, commission_rate
      ) VALUES (?, ?, ?, ?, ?, ?, 30.00)`,
      [
        wechat_name,
        validPrimarySalesId,
        payment_method,
        payment_address,
        alipay_surname || null,
        chain_name || null
      ]
    );

    // 标准实现：生成标准销售代码
    const standardSalesCode = `SS${Date.now().toString(36).slice(-8).toUpperCase()}${Math.random().toString(36).slice(-4).toUpperCase()}`;
    
    // 更新数据库记录，添加标准sales_code字段
    await connection.execute(
      'UPDATE secondary_sales SET sales_code = ? WHERE id = ?',
      [standardSalesCode, result.insertId]
    );
    
    // 返回成功响应（标准实现）
    res.status(201).json({
      success: true,
      message: '二级销售注册成功！',
      data: {
        secondary_sales_id: result.insertId,
        wechat_name: wechat_name,
        sales_code: standardSalesCode,
        primary_sales_id: validPrimarySalesId,
        user_sales_link: `https://zhixing-seven.vercel.app/purchase?sales_code=${standardSalesCode}`,
        note: "标准sales_code实现"
      }
    });

  } catch (error) {
    console.error('创建二级销售错误:', error);
    
    // 检查是否是唯一约束错误
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({
        success: false,
        message: '一个微信号仅支持一次注册。'
      });
    }

    res.status(500).json({
      success: false,
      message: '注册失败，请稍后重试'
    });
  }
}

// 获取二级销售列表
async function handleGetSecondarySalesList(req, res, connection) {
  try {
    const [rows] = await connection.execute(
      `SELECT 
        ss.id,
        ss.wechat_name,
        ss.sales_code,
        ss.payment_method,
        ss.commission_rate,
        ss.status,
        ss.created_at,
        ps.wechat_name as primary_sales_wechat,
        COUNT(o.id) as order_count,
        SUM(o.commission_amount) as total_commission
       FROM secondary_sales ss
       LEFT JOIN primary_sales ps ON ss.primary_sales_id = ps.id
       LEFT JOIN orders o ON o.sales_code = ss.sales_code AND o.sales_type = 'secondary'
       WHERE ss.status = 'active'
       GROUP BY ss.id
       ORDER BY ss.created_at DESC`
    );

    res.status(200).json({
      success: true,
      data: rows
    });

  } catch (error) {
    console.error('获取二级销售列表错误:', error);
    res.status(500).json({
      success: false,
      message: '获取二级销售列表失败'
    });
  }
}

// 处理二级销售对账查询
async function handleSecondarySalesSettlement(req, res, connection) {
  try {
    const { wechat_name, sales_code, payment_date_range } = req.query;
    
    // 验证查询参数
    if (!wechat_name && !sales_code && !payment_date_range) {
      return res.status(400).json({
        success: false,
        message: '请提供微信号、销售代码或付款时间范围'
      });
    }

    // 构建查询条件
    let whereConditions = ['ss.status = ?'];
    let queryParams = ['active'];
    
    if (wechat_name) {
      whereConditions.push('ss.wechat_name LIKE ?');
      queryParams.push(`%${wechat_name}%`);
    }
    
    if (sales_code) {
      whereConditions.push('ss.sales_code LIKE ?');
      queryParams.push(`%${sales_code}%`);
    }

    // 查询二级销售基本信息
    const salesQuery = `
      SELECT 
        ss.id,
        ss.wechat_name,
        ss.sales_code,
        ss.commission_rate,
        ss.payment_method,
        ss.created_at,
        ss.primary_sales_id,
        ps.wechat_name as primary_sales_name,
        CASE WHEN ss.primary_sales_id IS NULL THEN '独立二级销售' ELSE '一级下属二级销售' END as sales_type
      FROM secondary_sales ss
      LEFT JOIN primary_sales ps ON ss.primary_sales_id = ps.id
      WHERE ${whereConditions.join(' AND ')}
      LIMIT 1
    `;

    const [salesRows] = await connection.execute(salesQuery, queryParams);

    if (salesRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: '未找到匹配的二级销售'
      });
    }

    const salesData = salesRows[0];

    // 构建订单查询条件
    let orderWhereConditions = ['o.config_confirmed = true']; // 只查询已配置确认的订单
    let orderQueryParams = [];

    // 根据sales_code或secondary_sales_id查询订单
    if (salesData.sales_code) {
      orderWhereConditions.push('(o.secondary_sales_id = ? OR o.sales_code = ?)');
      orderQueryParams.push(salesData.id, salesData.sales_code);
    } else {
      orderWhereConditions.push('o.secondary_sales_id = ?');
      orderQueryParams.push(salesData.id);
    }

    // 添加时间范围过滤
    if (payment_date_range) {
      try {
        const [startDate, endDate] = payment_date_range.split(',');
        if (startDate && endDate) {
          orderWhereConditions.push('DATE(o.payment_time) BETWEEN ? AND ?');
          orderQueryParams.push(startDate, endDate);
        }
      } catch (error) {
        console.warn('时间范围解析失败:', error);
      }
    }

    // 查询订单列表
    const ordersQuery = `
      SELECT 
        o.id,
        o.tradingview_username,
        o.customer_wechat,
        o.duration,
        o.amount,
        o.commission_amount as commission,
        o.payment_time,
        o.status,
        o.config_confirmed,
        o.expiry_time,
        o.created_at
      FROM orders o
      WHERE ${orderWhereConditions.join(' AND ')}
      ORDER BY o.payment_time DESC
    `;

    const [ordersRows] = await connection.execute(ordersQuery, orderQueryParams);

    // 查询催单订单（status为pending的订单）
    const reminderQuery = `
      SELECT 
        o.id,
        o.tradingview_username,
        o.customer_wechat,
        o.duration,
        o.amount,
        o.commission_amount as commission,
        o.payment_time,
        o.status,
        o.config_confirmed,
        o.expiry_time,
        o.created_at
      FROM orders o
      WHERE ${orderWhereConditions.join(' AND ')}
        AND o.status IN ('pending_payment', 'pending_config')
      ORDER BY o.created_at DESC
    `;

    const [reminderRows] = await connection.execute(reminderQuery, orderQueryParams);

    // 计算统计数据
    const totalOrders = ordersRows.length;
    const totalAmount = ordersRows.reduce((sum, order) => sum + parseFloat(order.amount || 0), 0);
    const totalCommission = ordersRows.reduce((sum, order) => sum + parseFloat(order.commission || 0), 0);
    const pendingReminderCount = reminderRows.length;

    // 返回数据
    res.status(200).json({
      success: true,
      data: {
        sales: {
          ...salesData,
          total_orders: totalOrders,
          total_amount: totalAmount,
          total_commission: totalCommission
        },
        orders: ordersRows,
        reminderOrders: reminderRows,
        stats: {
          totalOrders,
          totalAmount,
          totalCommission,
          pendingReminderCount
        }
      }
    });

  } catch (error) {
    console.error('二级销售对账查询错误:', error);
    res.status(500).json({
      success: false,
      message: '对账查询失败'
    });
  }
}