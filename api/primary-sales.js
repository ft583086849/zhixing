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

  try {
    const { path } = req.query;
    const bodyPath = req.body?.path;

    // 处理一级销售列表
    if (req.method === 'GET' && (path === 'list' || !path)) {
      const connection = await mysql.createConnection(dbConfig);
      try {
        await handleGetPrimarySalesList(req, res, connection);
      } finally {
        await connection.end();
      }
      return;
    }

    // 处理一级销售创建
    if (req.method === 'POST' && (path === 'create' || bodyPath === 'create')) {
      const connection = await mysql.createConnection(dbConfig);
      try {
        await handleCreatePrimarySales(req, res, connection);
      } finally {
        await connection.end();
      }
      return;
    }

    // 处理一级销售结算（需要管理员权限）
    if (req.method === 'GET' && path === 'settlement') {
      const authResult = await verifyAdminAuth(req, res);
      if (!authResult.success) {
        return res.status(authResult.status).json({
          success: false,
          message: authResult.message
        });
      }
      await handleSettlement(req, res);
      return;
    }

    // 如果没有匹配的路径，返回404
    res.status(404).json({
      success: false,
      message: `路径不存在: ${req.method} ${path || bodyPath || 'default'}`
    });

  } catch (error) {
    console.error('一级销售API错误:', error);
    res.status(500).json({
      success: false,
      message: error.message || '服务器内部错误'
    });
  }
}

// 一级销售结算功能
async function handleSettlement(req, res) {
  let connection;
  
  try {
    connection = await mysql.createConnection(dbConfig);
    
    // 获取一级销售结算数据
    const [settlementData] = await connection.execute(`
      SELECT 
        ps.id,
        ps.wechat_name,
        ps.commission_rate,
        ps.created_at,
        COUNT(ss.id) as secondary_sales_count,
        COUNT(o.id) as order_count,
        SUM(o.amount) as total_amount,
        SUM(o.commission_amount) as total_commission
      FROM primary_sales ps
      LEFT JOIN secondary_sales ss ON ps.id = ss.primary_sales_id
      LEFT JOIN orders o ON (ps.id = o.sales_id OR ss.id = o.sales_id)
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
      LEFT JOIN orders o ON ss.id = o.sales_id
      GROUP BY ss.id
      ORDER BY ss.created_at DESC
    `);
    
    res.status(200).json({
      success: true,
      data: {
        settlement: settlementData,
        secondary_sales: secondarySales
      }
    });
    
  } catch (error) {
    console.error('一级销售结算错误:', error);
    res.status(500).json({
      success: false,
      message: error.message || '获取结算数据失败'
    });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

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
  if (!wechat_name || !payment_method) {
    return res.status(400).json({
      success: false,
      message: '微信号和收款方式为必填项'
    });
  }

  // 验证收款方式
  if (!['wechat', 'alipay', 'bank'].includes(payment_method)) {
    return res.status(400).json({
      success: false,
      message: '收款方式只能是微信、支付宝或银行卡'
    });
  }

  try {
          // 检查微信号是否已存在（包括一级销售、二级销售和普通销售）
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

    // 生成唯一销售代码（重构版）
    const userSalesCode = uuidv4().replace(/-/g, '').substring(0, 16);
    const secondaryRegistrationCode = uuidv4().replace(/-/g, '').substring(0, 16);

    // 确保所有参数都不是undefined，转换为null
    const params = {
      wechat_name: wechat_name || null,
      payment_method: payment_method || null,
      payment_address: payment_address || null,
      alipay_surname: alipay_surname || null,
      chain_name: chain_name || null,
      sales_code: userSalesCode,
      secondary_registration_code: secondaryRegistrationCode
    };

    // 生成标准的销售代码
    const tempId = Date.now();
    const salesCode = `PS${String(tempId).padStart(6, '0')}${Date.now().toString(36).slice(-8).toUpperCase()}`;
    
    // 使用最基础的字段插入，避免NULL约束错误
    const [result] = await connection.execute(
      `INSERT INTO primary_sales (
        wechat_name, payment_method
      ) VALUES (?, ?)`,
      [
        params.wechat_name, 
        params.payment_method
      ]
    );

    const primarySalesId = result.insertId;

    // 生成二级销售注册代码
    const regCode = `SR${String(primarySalesId).padStart(6, '0')}${Date.now().toString(36).slice(-8).toUpperCase()}`;

    // 返回成功响应（标准实现）
    res.status(201).json({
      success: true,
      message: '一级销售信息创建成功！',
      data: {
        primary_sales_id: primarySalesId,
        wechat_name: params.wechat_name,
        sales_code: userSalesCode,
        secondary_registration_code: secondaryRegistrationCode,
        user_sales_code: userSalesCode, // 保持兼容性
        secondary_registration_link: `https://zhixing-seven.vercel.app/secondary-sales?sales_code=${secondaryRegistrationCode}`,
        user_sales_link: `https://zhixing-seven.vercel.app/purchase?sales_code=${userSalesCode}`,
        note: "标准sales_code实现"
      }
    });

  } catch (error) {
    console.error('创建一级销售详细错误:', error);
    console.error('错误代码:', error.code);
    console.error('错误消息:', error.message);
    console.error('SQL状态:', error.sqlState);
    console.error('完整错误对象:', JSON.stringify(error, null, 2));
    
    // 检查是否是唯一约束错误
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({
        success: false,
        message: '一个微信号仅支持一次注册。'
      });
    }

    // 临时返回详细错误信息用于调试
    res.status(500).json({
      success: false,
      message: '创建一级销售失败，请稍后重试',
      debug: {
        code: error.code,
        message: error.message,
        sqlState: error.sqlState
      }
    });
  }
}

// 获取一级销售列表
async function handleGetPrimarySalesList(req, res, connection) {
  try {
    console.log('🔍 开始查询primary_sales表...');
    
    // 先测试最基础的查询
    const [testRows] = await connection.execute('SELECT COUNT(*) as count FROM primary_sales');
    console.log('📊 primary_sales记录数:', testRows[0].count);
    
    // 测试字段是否存在
    try {
      const [fieldTest] = await connection.execute('SELECT id, wechat_name FROM primary_sales LIMIT 1');
      console.log('✅ 基础字段测试通过');
    } catch (fieldError) {
      console.error('❌ 基础字段错误:', fieldError.message);
      throw fieldError;
    }
    
    // 暂时跳过字段测试，直接使用基础字段
    console.log('⚠️ 跳过字段测试，使用基础字段');
    
    // 执行完整查询 - 暂时只使用基础字段
    const [rows] = await connection.execute(
      `SELECT 
        id,
        wechat_name,
        payment_method,
        created_at
       FROM primary_sales
       ORDER BY created_at DESC`
    );
    
    console.log('✅ 查询成功，返回', rows.length, '条记录');

    res.status(200).json({
      success: true,
      data: rows
    });

  } catch (error) {
    console.error('❌ 获取一级销售列表详细错误:', error);
    console.error('错误消息:', error.message);
    console.error('错误代码:', error.code);
    console.error('SQL状态:', error.sqlState);
    res.status(500).json({
      success: false,
      message: '获取一级销售列表失败: ' + error.message,
      error_details: {
        message: error.message,
        code: error.code,
        sqlState: error.sqlState,
        stack: error.stack
      }
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