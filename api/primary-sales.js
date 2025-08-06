// Vercel Serverless Function - 一级销售API
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

  // 路径解析
  const { path } = req.query;

  try {
    // 处理一级销售创建
    if (req.method === 'POST' && path === 'create') {
      await handleCreatePrimarySales(req, res);
      return;
    }

    // 处理一级销售列表（管理员权限）
    if (req.method === 'GET' && path === 'list') {
      const authResult = await verifyAdminAuth(req, res);
      if (!authResult.success) {
        return res.status(authResult.status).json({
          success: false,
          message: authResult.message
        });
      }
      await handleGetPrimarySalesList(req, res);
      return;
    }

    // 处理一级销售统计
    if (req.method === 'GET' && path === 'statistics') {
      const authResult = await verifyAdminAuth(req, res);
      if (!authResult.success) {
        return res.status(authResult.status).json({
          success: false,
          message: authResult.message
        });
      }
      await handleGetPrimarySalesStatistics(req, res);
      return;
    }

    // 如果没有匹配的路径，返回404
    res.status(404).json({
      success: false,
      message: '接口路径不存在',
      availablePaths: ['POST /create', 'GET /list', 'GET /statistics']
    });

  } catch (error) {
    console.error('一级销售API错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误',
      error: error.message
    });
  }
}

// 创建一级销售
async function handleCreatePrimarySales(req, res) {
  const connection = await mysql.createConnection(dbConfig);
  
  try {
    const {
      wechat_name,
      payment_method,
      payment_address,
      alipay_surname,
      chain_name
    } = req.body;

    // 验证必填字段
    const missingFields = [];
    if (!wechat_name) missingFields.push('微信号');
    if (!payment_method) missingFields.push('收款方式');
    if (!payment_address) missingFields.push('收款地址');
    
    if (missingFields.length > 0) {
      await connection.end();
      return res.status(400).json({
        success: false,
        message: `以下字段为必填项: ${missingFields.join('、')}`
      });
    }

    // 验证收款方式
    if (!['alipay', 'crypto'].includes(payment_method)) {
      await connection.end();
      return res.status(400).json({
        success: false,
        message: '收款方式只能是支付宝或线上地址码'
      });
    }

    // 支付宝收款验证
    if (payment_method === 'alipay' && !alipay_surname) {
      await connection.end();
      return res.status(400).json({
        success: false,
        message: '支付宝收款需要填写收款人姓氏'
      });
    }

    // 线上地址码验证
    if (payment_method === 'crypto' && !chain_name) {
      await connection.end();
      return res.status(400).json({
        success: false,
        message: '线上地址码需要填写链名'
      });
    }

    // 生成唯一代码（支持临时代码格式）
    const timestamp = Date.now();
    const randomPart = Math.random().toString(36).substr(2, 6).toUpperCase();
    
    // 支持ps_前缀的临时代码格式
    const salesCode = `ps_${timestamp}_${randomPart}`;
    const secondaryRegistrationCode = `SR${timestamp}${randomPart}`.toUpperCase();

    // 插入数据库
    const [result] = await connection.execute(
      `INSERT INTO primary_sales (
        wechat_name, sales_code, secondary_registration_code,
        payment_method, payment_address, alipay_surname, chain_name
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        wechat_name,
        salesCode,
        secondaryRegistrationCode,
        payment_method,
        payment_address,
        alipay_surname || null,
        chain_name || null
      ]
    );

    await connection.end();

    // 返回成功响应
    res.status(201).json({
      success: true,
      message: '一级销售创建成功！',
      data: {
        primary_sales_id: result.insertId,
        wechat_name: wechat_name,
        sales_code: salesCode,
        secondary_registration_code: secondaryRegistrationCode,
        user_sales_link: `https://zhixing-seven.vercel.app/purchase?sales_code=${salesCode}`,
        secondary_registration_link: `https://zhixing-seven.vercel.app/secondary-sales?sales_code=${secondaryRegistrationCode}`
      }
    });

  } catch (error) {
    await connection.end();
    console.error('创建一级销售详细错误:', error);
    
    // 检查是否是唯一约束错误
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({
        success: false,
        message: '一个微信号仅支持一次注册。'
      });
    }

    res.status(500).json({
      success: false,
      message: '创建失败，请稍后重试',
      error: error.message
    });
  }
}

// 获取一级销售列表
async function handleGetPrimarySalesList(req, res) {
  const connection = await mysql.createConnection(dbConfig);
  
  try {
    // 获取一级销售基本信息及统计
    const [primarySales] = await connection.execute(`
      SELECT 
        ps.id,
        ps.wechat_name,
        ps.sales_code,
        ps.payment_method,
        ps.payment_address,
        ps.commission_rate,
        ps.created_at,
        COUNT(ss.id) as secondary_sales_count,
        COUNT(o.id) as order_count,
        SUM(o.amount) as total_amount,
        SUM(o.commission_amount) as total_commission
      FROM primary_sales ps
      LEFT JOIN secondary_sales ss ON ps.id = ss.primary_sales_id
      LEFT JOIN orders o ON (o.primary_sales_id = ps.id OR o.secondary_sales_id = ss.id)
      GROUP BY ps.id
      ORDER BY ps.created_at DESC
    `);
    
    // 获取二级销售列表
    const [secondarySales] = await connection.execute(`
      SELECT 
        ss.id,
        ss.wechat_name,
        ss.commission_rate,
        ss.created_at,
        ps.wechat_name as primary_sales_name,
        COUNT(o.id) as order_count,
        SUM(o.amount) as total_amount,
        SUM(o.commission_amount) as total_commission
      FROM secondary_sales ss
      LEFT JOIN primary_sales ps ON ss.primary_sales_id = ps.id
      LEFT JOIN orders o ON ss.id = o.secondary_sales_id
      GROUP BY ss.id
      ORDER BY ss.created_at DESC
    `);

    await connection.end();

    res.json({
      success: true,
      data: {
        primary_sales: primarySales.map(item => ({
          ...item,
          total_amount: parseFloat(item.total_amount || 0),
          total_commission: parseFloat(item.total_commission || 0),
          commission_rate: parseFloat(item.commission_rate || 40)
        })),
        secondary_sales: secondarySales.map(item => ({
          ...item,
          total_amount: parseFloat(item.total_amount || 0),
          total_commission: parseFloat(item.total_commission || 0),
          commission_rate: parseFloat(item.commission_rate || 30)
        }))
      }
    });

  } catch (error) {
    await connection.end();
    console.error('获取一级销售列表错误:', error);
    res.status(500).json({
      success: false,
      message: '获取列表失败',
      error: error.message
    });
  }
}

// 获取一级销售统计
async function handleGetPrimarySalesStatistics(req, res) {
  const connection = await mysql.createConnection(dbConfig);
  
  try {
    // 基础统计
    const [stats] = await connection.execute(`
      SELECT 
        COUNT(DISTINCT ps.id) as total_primary_sales,
        COUNT(DISTINCT ss.id) as total_secondary_sales,
        COUNT(DISTINCT o.id) as total_orders,
        SUM(o.amount) as total_revenue,
        SUM(o.commission_amount) as total_commission
      FROM primary_sales ps
      LEFT JOIN secondary_sales ss ON ps.id = ss.primary_sales_id
      LEFT JOIN orders o ON (o.primary_sales_id = ps.id OR o.secondary_sales_id = ss.id)
    `);

    // 按销售类型分组统计
    const [typeStats] = await connection.execute(`
      SELECT 
        'primary' as sales_type,
        COUNT(o.id) as order_count,
        SUM(o.amount) as total_amount,
        SUM(o.commission_amount) as total_commission
      FROM orders o
      WHERE o.primary_sales_id IS NOT NULL
      UNION ALL
      SELECT 
        'secondary' as sales_type,
        COUNT(o.id) as order_count,
        SUM(o.amount) as total_amount,
        SUM(o.commission_amount) as total_commission
      FROM orders o
      WHERE o.secondary_sales_id IS NOT NULL
    `);

    // 近期趋势
    const [trends] = await connection.execute(`
      SELECT 
        DATE(o.created_at) as date,
        COUNT(o.id) as daily_orders,
        SUM(o.amount) as daily_revenue
      FROM orders o
      WHERE o.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
      GROUP BY DATE(o.created_at)
      ORDER BY date DESC
      LIMIT 30
    `);

    await connection.end();

    res.json({
      success: true,
      data: {
        overview: {
          total_primary_sales: stats[0].total_primary_sales || 0,
          total_secondary_sales: stats[0].total_secondary_sales || 0,
          total_orders: stats[0].total_orders || 0,
          total_revenue: parseFloat(stats[0].total_revenue || 0),
          total_commission: parseFloat(stats[0].total_commission || 0)
        },
        by_type: typeStats.map(item => ({
          ...item,
          total_amount: parseFloat(item.total_amount || 0),
          total_commission: parseFloat(item.total_commission || 0)
        })),
        trends: trends.map(item => ({
          ...item,
          daily_revenue: parseFloat(item.daily_revenue || 0)
        }))
      }
    });

  } catch (error) {
    await connection.end();
    console.error('获取一级销售统计错误:', error);
    res.status(500).json({
      success: false,
      message: '获取统计失败',
      error: error.message
    });
  }
}