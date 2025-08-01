// Vercel Serverless Function - 一级销售API
const mysql = require('mysql2/promise');
const { v4: uuidv4 } = require('uuid');

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
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');

  // 处理OPTIONS预检请求
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const connection = await mysql.createConnection(dbConfig);
    const { path } = req.query;

    if (req.method === 'POST' && path === 'create') {
      await handleCreatePrimarySales(req, res, connection);
    } else if (req.method === 'GET' && path === 'list') {
      await handleGetPrimarySalesList(req, res, connection);
    } else if (req.method === 'GET' && path === 'stats') {
      await handleGetPrimarySalesStats(req, res, connection);
    } else {
      res.status(404).json({
        success: false,
        message: `路径不存在: ${req.method} ${path || 'default'}`
      });
    }

    await connection.end();

  } catch (error) {
    console.error('一级销售API错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
};

// 创建一级销售
async function handleCreatePrimarySales(req, res, connection) {
  const { 
    wechat_name, 
    payment_method, 
    payment_address, 
    alipay_surname, 
    chain_name 
  } = req.body;

  // 验证必填字段
  if (!wechat_name || !payment_method || !payment_address) {
    return res.status(400).json({
      success: false,
      message: '微信名称、收款方式和收款地址为必填项'
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

  try {
    // 检查微信名是否已存在（包括一级销售、二级销售和普通销售）
    const [existingSales] = await connection.execute(
      `SELECT wechat_name FROM primary_sales WHERE wechat_name = ? 
       UNION SELECT wechat_name FROM secondary_sales WHERE wechat_name = ? 
       UNION SELECT wechat_name FROM sales WHERE wechat_name = ?`,
      [wechat_name, wechat_name, wechat_name]
    );

    if (existingSales.length > 0) {
      return res.status(400).json({
        success: false,
        message: '这个微信名已经被人使用了，请换一个'
      });
    }

    // 生成唯一链接代码
    const secondaryRegistrationCode = uuidv4().replace(/-/g, '').substring(0, 16);
    const userSalesCode = uuidv4().replace(/-/g, '').substring(0, 16);

    // 确保所有参数都不是undefined，转换为null
    const params = {
      wechat_name: wechat_name || null,
      payment_method: payment_method || null,
      payment_address: payment_address || null,
      alipay_surname: alipay_surname || null,
      chain_name: chain_name || null,
      secondary_registration_code: secondaryRegistrationCode,
      user_sales_code: userSalesCode
    };

    // 插入一级销售数据
    const [result] = await connection.execute(
      `INSERT INTO primary_sales (wechat_name, payment_method, payment_address, alipay_surname, chain_name) 
       VALUES (?, ?, ?, ?, ?)`,
      [params.wechat_name, params.payment_method, params.payment_address, params.alipay_surname, params.chain_name]
    );

    const primarySalesId = result.insertId;

    // 创建二级销售注册链接
    await connection.execute(
      `INSERT INTO links (link_code, sales_id, link_type, created_at) 
       VALUES (?, ?, 'secondary_registration', NOW())`,
      [secondaryRegistrationCode, primarySalesId]
    );

    // 创建用户销售链接
    await connection.execute(
      `INSERT INTO links (link_code, sales_id, link_type, created_at) 
       VALUES (?, ?, 'user_sales', NOW())`,
      [userSalesCode, primarySalesId]
    );

    // 返回成功响应
    res.status(201).json({
      success: true,
      message: '一级销售信息创建成功！',
      data: {
        primary_sales_id: primarySalesId,
        wechat_name: params.wechat_name,
        secondary_registration_code: secondaryRegistrationCode,
        user_sales_code: userSalesCode,
        secondary_registration_link: `${process.env.CORS_ORIGIN || 'https://zhixing-seven.vercel.app'}/secondary-registration/${secondaryRegistrationCode}`,
        user_sales_link: `${process.env.CORS_ORIGIN || 'https://zhixing-seven.vercel.app'}/purchase/${userSalesCode}`
      }
    });

  } catch (error) {
    console.error('创建一级销售错误:', error);
    
    // 检查是否是唯一约束错误
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({
        success: false,
        message: '这个微信名已经被人使用了，请换一个'
      });
    }

    res.status(500).json({
      success: false,
      message: '创建一级销售失败，请稍后重试'
    });
  }
}

// 获取一级销售列表
async function handleGetPrimarySalesList(req, res, connection) {
  try {
    const [rows] = await connection.execute(
      `SELECT 
        ps.id,
        ps.wechat_name,
        ps.payment_method,
        ps.commission_rate,
        ps.created_at,
        COUNT(ss.id) as secondary_sales_count,
        SUM(CASE WHEN ss.status = 'active' THEN 1 ELSE 0 END) as active_secondary_count
       FROM primary_sales ps
       LEFT JOIN secondary_sales ss ON ps.id = ss.primary_sales_id
       GROUP BY ps.id
       ORDER BY ps.created_at DESC`
    );

    res.status(200).json({
      success: true,
      data: rows
    });

  } catch (error) {
    console.error('获取一级销售列表错误:', error);
    res.status(500).json({
      success: false,
      message: '获取一级销售列表失败'
    });
  }
}

// 获取一级销售统计信息
async function handleGetPrimarySalesStats(req, res, connection) {
  try {
    const [stats] = await connection.execute(
      `SELECT 
        COUNT(*) as total_primary_sales,
        COUNT(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN 1 END) as new_this_week,
        COUNT(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN 1 END) as new_this_month
       FROM primary_sales`
    );

    const [secondaryStats] = await connection.execute(
      `SELECT 
        COUNT(*) as total_secondary_sales,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active_secondary_sales
       FROM secondary_sales`
    );

    res.status(200).json({
      success: true,
      data: {
        primary_sales: stats[0],
        secondary_sales: secondaryStats[0]
      }
    });

  } catch (error) {
    console.error('获取一级销售统计错误:', error);
    res.status(500).json({
      success: false,
      message: '获取统计信息失败'
    });
  }
} 