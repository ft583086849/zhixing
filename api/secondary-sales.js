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

    // 临时兼容版本：通过links表查找
    const [linkRows] = await connection.execute(
      'SELECT * FROM links WHERE link_code = ? AND link_type = ?',
      [link_code, link_type]
    );

    if (linkRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: '注册码无效或已过期'
      });
    }

    // 通过sales_id查找primary_sales信息
    const [rows] = await connection.execute(
      'SELECT id, wechat_name, payment_method FROM primary_sales WHERE id = ?',
      [linkRows[0].sales_id]
    );

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
      primary_sales_id
    } = req.body;

    // 验证必填字段
    if (!wechat_name || !payment_method || !payment_address || !registration_code) {
      return res.status(400).json({
        success: false,
        message: '微信号、收款方式、收款地址和注册码为必填项'
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

    // 临时兼容版本：通过links表验证注册码
    const [linkRows] = await connection.execute(
      'SELECT * FROM links WHERE link_code = ? AND link_type = ?',
      [registration_code, 'secondary_registration']
    );

    if (linkRows.length === 0) {
      return res.status(400).json({
        success: false,
        message: '注册码无效或已过期'
      });
    }

    const validPrimarySalesId = linkRows[0].sales_id;

    // 检查微信号是否已存在（兼容现有表结构）
    const [existingSales] = await connection.execute(
      `SELECT wechat_name FROM primary_sales WHERE wechat_name = ? 
       UNION SELECT wechat_name FROM sales WHERE wechat_name = ?`,
      [wechat_name, wechat_name]
    );

    if (existingSales.length > 0) {
      return res.status(400).json({
        success: false,
        message: '一个微信号仅支持一次注册。'
      });
    }

    // 生成唯一销售代码
    const salesCode = uuidv4().replace(/-/g, '').substring(0, 16);

    // 临时兼容版本：创建sales表记录（标记为二级销售）
    const [result] = await connection.execute(
      `INSERT INTO sales (
        wechat_name, payment_method, payment_address, alipay_surname, chain_name, 
        link_code, sales_type, parent_sales_id
      ) VALUES (?, ?, ?, ?, ?, ?, 'secondary', ?)`,
      [
        wechat_name,
        payment_method,
        payment_address,
        alipay_surname || null,
        chain_name || null,
        salesCode,
        validPrimarySalesId
      ]
    );

    // 创建用户购买链接
    await connection.execute(
      `INSERT INTO links (link_code, sales_id, link_type, created_at) 
       VALUES (?, ?, 'user_sales', NOW())`,
      [salesCode, result.insertId]
    );

    // 返回成功响应（临时兼容版本）
    res.status(201).json({
      success: true,
      message: '二级销售注册成功！',
      data: {
        secondary_sales_id: result.insertId,
        wechat_name: wechat_name,
        sales_code: salesCode,
        link_code: salesCode, // 兼容性字段
        primary_sales_id: validPrimarySalesId,
        user_sales_link: `https://zhixing-seven.vercel.app/purchase?sales_code=${salesCode}`
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