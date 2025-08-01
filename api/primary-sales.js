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
    } else if (req.method === 'GET' && path === 'orders') {
      await handleGetPrimarySalesOrders(req, res, connection);
    } else if (req.method === 'PUT' && path === 'update-commission') {
      await handleUpdateSecondarySalesCommission(req, res, connection);
    } else if (req.method === 'POST' && path === 'urge-order') {
      await handleUrgeOrder(req, res, connection);
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
    // 获取一级销售统计数据
    const [stats] = await connection.execute(
      `SELECT 
        COUNT(*) as total_primary_sales,
        COUNT(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN 1 END) as new_this_week,
        COUNT(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN 1 END) as new_this_month
       FROM primary_sales`
    );

    // 获取二级销售统计数据
    const [secondaryStats] = await connection.execute(
      `SELECT 
        COUNT(*) as total_secondary_sales,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active_secondary_sales
       FROM secondary_sales`
    );

    // 获取佣金统计数据
    const [commissionStats] = await connection.execute(
      `SELECT 
        SUM(commission_amount) as total_commission,
        SUM(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN commission_amount ELSE 0 END) as monthly_commission
       FROM orders 
       WHERE primary_sales_id IS NOT NULL`
    );

    // 获取订单统计数据
    const [orderStats] = await connection.execute(
      `SELECT 
        COUNT(*) as total_orders,
        COUNT(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN 1 END) as monthly_orders
       FROM orders 
       WHERE primary_sales_id IS NOT NULL`
    );

    // 获取二级销售列表
    const [secondarySales] = await connection.execute(
      `SELECT 
        ss.id,
        ss.wechat_name,
        ss.payment_method,
        ss.commission_rate,
        ss.created_at,
        COUNT(o.id) as order_count,
        SUM(o.commission_amount) as total_commission
       FROM secondary_sales ss
       LEFT JOIN orders o ON ss.id = o.secondary_sales_id
       WHERE ss.status = 'active'
       GROUP BY ss.id
       ORDER BY ss.created_at DESC`
    );

    res.status(200).json({
      success: true,
      data: {
        totalCommission: commissionStats[0].total_commission || 0,
        monthlyCommission: commissionStats[0].monthly_commission || 0,
        secondarySalesCount: secondaryStats[0].total_secondary_sales || 0,
        totalOrders: orderStats[0].total_orders || 0,
        secondarySales: secondarySales
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

// 获取一级销售订单列表
async function handleGetPrimarySalesOrders(req, res, connection) {
  try {
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    // 获取订单总数
    const [countResult] = await connection.execute(
      `SELECT COUNT(*) as total FROM orders WHERE primary_sales_id IS NOT NULL`
    );
    const total = countResult[0].total;

    // 获取订单列表
    const [orders] = await connection.execute(
      `SELECT 
        o.id,
        o.link_code,
        o.tradingview_username,
        o.customer_wechat,
        o.duration,
        o.amount,
        o.payment_method,
        o.payment_time,
        o.purchase_type,
        o.effective_time,
        o.expiry_time,
        o.status,
        o.commission_rate,
        o.commission_amount,
        o.created_at,
        o.updated_at,
        ss.wechat_name as secondary_sales_name
       FROM orders o
       LEFT JOIN secondary_sales ss ON o.secondary_sales_id = ss.id
       WHERE o.primary_sales_id IS NOT NULL
       ORDER BY o.created_at DESC
       LIMIT ? OFFSET ?`,
      [parseInt(limit), offset]
    );

    res.status(200).json({
      success: true,
      data: {
        orders,
        total,
        page: parseInt(page),
        limit: parseInt(limit)
      }
    });

  } catch (error) {
    console.error('获取一级销售订单列表错误:', error);
    res.status(500).json({
      success: false,
      message: '获取订单列表失败'
    });
  }
}

// 更新二级销售佣金率
async function handleUpdateSecondarySalesCommission(req, res, connection) {
  try {
    const { id } = req.query;
    const { commissionRate } = req.body;

    if (!id || commissionRate === undefined) {
      return res.status(400).json({
        success: false,
        message: '缺少必要参数'
      });
    }

    if (commissionRate < 0 || commissionRate > 1) {
      return res.status(400).json({
        success: false,
        message: '佣金率必须在0-1之间'
      });
    }

    // 更新二级销售佣金率
    const [result] = await connection.execute(
      `UPDATE secondary_sales SET commission_rate = ? WHERE id = ?`,
      [commissionRate, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: '二级销售不存在'
      });
    }

    // 获取更新后的二级销售信息
    const [updatedSales] = await connection.execute(
      `SELECT * FROM secondary_sales WHERE id = ?`,
      [id]
    );

    res.status(200).json({
      success: true,
      message: '佣金率更新成功',
      data: updatedSales[0]
    });

  } catch (error) {
    console.error('更新二级销售佣金率错误:', error);
    res.status(500).json({
      success: false,
      message: '更新佣金率失败'
    });
  }
}

// 催单功能
async function handleUrgeOrder(req, res, connection) {
  try {
    const { id } = req.query;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: '缺少订单ID'
      });
    }

    // 获取订单信息
    const [orders] = await connection.execute(
      `SELECT * FROM orders WHERE id = ?`,
      [id]
    );

    if (orders.length === 0) {
      return res.status(404).json({
        success: false,
        message: '订单不存在'
      });
    }

    const order = orders[0];

    // 这里可以添加实际的催单逻辑，比如发送微信消息、邮件等
    // 目前只是记录催单操作
    await connection.execute(
      `UPDATE orders SET updated_at = NOW() WHERE id = ?`,
      [id]
    );

    res.status(200).json({
      success: true,
      message: '催单提醒已发送',
      data: {
        orderId: id,
        customerWechat: order.customer_wechat
      }
    });

  } catch (error) {
    console.error('催单错误:', error);
    res.status(500).json({
      success: false,
      message: '催单失败'
    });
  }
} 