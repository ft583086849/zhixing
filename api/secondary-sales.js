// Vercel Serverless Function - 二级销售API
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
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');

  // 处理OPTIONS预检请求
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const connection = await mysql.createConnection(dbConfig);
    const { path, id } = req.query;

    if (req.method === 'POST' && path === 'register') {
      await handleSecondarySalesRegistration(req, res, connection);
    } else if (req.method === 'GET' && path === 'list') {
      await handleGetSecondarySalesList(req, res, connection);
    } else if (req.method === 'GET' && path === 'stats') {
      await handleGetSecondarySalesStats(req, res, connection);
    } else if (req.method === 'PUT' && path === 'update-commission') {
      await handleUpdateCommission(req, res, connection);
    } else if (req.method === 'DELETE' && path === 'remove') {
      await handleRemoveSecondarySales(req, res, connection);
    } else if (req.method === 'GET' && path === 'orders') {
      await handleGetSecondarySalesOrders(req, res, connection);
    } else {
      res.status(404).json({
        success: false,
        message: `路径不存在: ${req.method} ${path || 'default'}`
      });
    }

    await connection.end();

  } catch (error) {
    console.error('二级销售API错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
};

// 二级销售注册
async function handleSecondarySalesRegistration(req, res, connection) {
  const { 
    wechat_name, 
    primary_sales_id,
    payment_method, 
    payment_address, 
    alipay_surname, 
    chain_name,
    registration_code
  } = req.body;

  // 验证必填字段
  if (!wechat_name || !primary_sales_id || !payment_method || !payment_address) {
    return res.status(400).json({
      success: false,
      message: '微信名称、一级销售ID、收款方式和收款地址为必填项'
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
    // 验证注册码是否有效
    const [registrationLink] = await connection.execute(
      'SELECT * FROM links WHERE link_code = ? AND link_type = "secondary_registration"',
      [registration_code]
    );

    if (registrationLink.length === 0) {
      return res.status(400).json({
        success: false,
        message: '注册码无效或已过期'
      });
    }

    // 检查微信名是否已存在
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
    const userSalesCode = uuidv4().replace(/-/g, '').substring(0, 16);

    // 创建二级销售记录
    const [secondaryResult] = await connection.execute(
      `INSERT INTO secondary_sales (wechat_name, primary_sales_id, payment_method, payment_address, alipay_surname, chain_name) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [wechat_name, primary_sales_id, payment_method, payment_address, alipay_surname || null, chain_name || null]
    );

    const secondarySalesId = secondaryResult.insertId;

    // 创建销售层级关系
    await connection.execute(
      `INSERT INTO sales_hierarchy (primary_sales_id, secondary_sales_id, commission_rate) 
       VALUES (?, ?, 30.00)`,
      [primary_sales_id, secondarySalesId]
    );

    // 创建用户销售链接
    await connection.execute(
      `INSERT INTO links (link_code, sales_id, link_type, created_at) 
       VALUES (?, ?, 'user_sales', NOW())`,
      [userSalesCode, secondarySalesId]
    );

    // 返回成功响应
    res.status(201).json({
      success: true,
      message: '二级销售注册成功！',
      data: {
        secondary_sales_id: secondarySalesId,
        wechat_name: wechat_name,
        primary_sales_id: primary_sales_id,
        user_sales_code: userSalesCode,
        user_sales_link: `${process.env.CORS_ORIGIN || 'https://zhixing-seven.vercel.app'}/purchase/${userSalesCode}`,
        commission_rate: 30.00
      }
    });

  } catch (error) {
    console.error('二级销售注册错误:', error);
    
    // 检查是否是唯一约束错误
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({
        success: false,
        message: '这个微信名已经被人使用了，请换一个'
      });
    }

    res.status(500).json({
      success: false,
      message: '二级销售注册失败，请稍后重试'
    });
  }
}

// 获取二级销售列表
async function handleGetSecondarySalesList(req, res, connection) {
  try {
    const { primary_sales_id } = req.query;
    
    let query = `
      SELECT 
        ss.*,
        ps.wechat_name as primary_sales_name,
        sh.commission_rate
      FROM secondary_sales ss
      LEFT JOIN primary_sales ps ON ss.primary_sales_id = ps.id
      LEFT JOIN sales_hierarchy sh ON ss.id = sh.secondary_sales_id
    `;
    
    let params = [];
    
    if (primary_sales_id) {
      query += ' WHERE ss.primary_sales_id = ?';
      params.push(primary_sales_id);
    }
    
    query += ' ORDER BY ss.created_at DESC';
    
    const [rows] = await connection.execute(query, params);

    res.json({
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

// 获取二级销售统计
async function handleGetSecondarySalesStats(req, res, connection) {
  try {
    const { primary_sales_id } = req.query;
    
    let whereClause = '';
    let params = [];
    
    if (primary_sales_id) {
      whereClause = 'WHERE ss.primary_sales_id = ?';
      params.push(primary_sales_id);
    }
    
    const [stats] = await connection.execute(
      `SELECT 
        COUNT(ss.id) as total_secondary_sales,
        COUNT(CASE WHEN ss.status = 'active' THEN 1 END) as active_secondary_sales,
        AVG(sh.commission_rate) as avg_commission_rate
       FROM secondary_sales ss
       LEFT JOIN sales_hierarchy sh ON ss.id = sh.secondary_sales_id
       ${whereClause}`,
      params
    );

    res.json({
      success: true,
      data: stats[0]
    });

  } catch (error) {
    console.error('获取二级销售统计错误:', error);
    res.status(500).json({
      success: false,
      message: '获取二级销售统计失败'
    });
  }
}

// 更新佣金比例
async function handleUpdateCommission(req, res, connection) {
  const { secondary_sales_id, commission_rate } = req.body;

  if (!secondary_sales_id || !commission_rate) {
    return res.status(400).json({
      success: false,
      message: '二级销售ID和佣金比例为必填项'
    });
  }

  if (commission_rate < 0 || commission_rate > 100) {
    return res.status(400).json({
      success: false,
      message: '佣金比例必须在0-100之间'
    });
  }

  try {
    await connection.execute(
      `UPDATE sales_hierarchy SET commission_rate = ? WHERE secondary_sales_id = ?`,
      [commission_rate, secondary_sales_id]
    );

    res.json({
      success: true,
      message: '佣金比例更新成功'
    });

  } catch (error) {
    console.error('更新佣金比例错误:', error);
    res.status(500).json({
      success: false,
      message: '更新佣金比例失败'
    });
  }
}

// 移除二级销售
async function handleRemoveSecondarySales(req, res, connection) {
  const { secondary_sales_id, removed_by } = req.body;

  if (!secondary_sales_id || !removed_by) {
    return res.status(400).json({
      success: false,
      message: '二级销售ID和移除操作为必填项'
    });
  }

  try {
    // 更新二级销售状态为已移除
    await connection.execute(
      `UPDATE secondary_sales SET status = 'removed', removed_by = ?, removed_at = NOW() WHERE id = ?`,
      [removed_by, secondary_sales_id]
    );

    // 删除销售层级关系
    await connection.execute(
      `DELETE FROM sales_hierarchy WHERE secondary_sales_id = ?`,
      [secondary_sales_id]
    );

    res.json({
      success: true,
      message: '二级销售移除成功'
    });

  } catch (error) {
    console.error('移除二级销售错误:', error);
    res.status(500).json({
      success: false,
      message: '移除二级销售失败'
    });
  }
}

// 获取二级销售订单
async function handleGetSecondarySalesOrders(req, res, connection) {
  try {
    const { secondary_sales_id } = req.query;
    
    if (!secondary_sales_id) {
      return res.status(400).json({
        success: false,
        message: '二级销售ID为必填项'
      });
    }

    const [orders] = await connection.execute(
      `SELECT 
        o.*,
        ss.wechat_name as secondary_sales_name,
        ps.wechat_name as primary_sales_name
       FROM orders o
       LEFT JOIN secondary_sales ss ON o.secondary_sales_id = ss.id
       LEFT JOIN primary_sales ps ON ss.primary_sales_id = ps.id
       WHERE o.secondary_sales_id = ?
       ORDER BY o.created_at DESC`,
      [secondary_sales_id]
    );

    res.json({
      success: true,
      data: orders
    });

  } catch (error) {
    console.error('获取二级销售订单错误:', error);
    res.status(500).json({
      success: false,
      message: '获取二级销售订单失败'
    });
  }
} 