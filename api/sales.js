// Vercel Serverless Function - 销售API
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
    const connection = await mysql.createConnection(dbConfig);
    const { path, link_code, sales_code } = req.query;

    // 需要权限验证的端点
    const protectedEndpoints = ['list', 'filter', 'export'];
    
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
      await handleCreateSales(req, res, connection);
    } else if (req.method === 'GET' && sales_code) {
      // 支持sales_code查询（新标准）
      await handleGetSalesBySalesCode(req, res, connection, sales_code);
    } else if (req.method === 'GET' && link_code) {
      // 支持link_code查询（兼容性）
      await handleGetSalesByLink(req, res, connection, link_code);
    } else if (req.method === 'GET' && (path === 'list' || !path)) {
      // 默认GET请求返回销售列表，支持销售类型筛选
      await handleGetAllSales(req, res, connection);
    } else if (req.method === 'GET' && path === 'filter') {
      // 销售类型筛选
      await handleFilterSales(req, res, connection);
    } else if (req.method === 'GET' && path === 'export') {
      // 导出销售数据
      await handleExportSales(req, res, connection);
    } else if (req.method === 'PUT' && path === 'remove-secondary') {
      // 移除二级销售
      const authResult = await verifyAdminAuth(req, res);
      if (!authResult.success) {
        await connection.end();
        return res.status(authResult.status).json({
          success: false,
          message: authResult.message
        });
      }
      await handleRemoveSecondarySales(req, res, connection);
    } else {
      res.status(404).json({
        success: false,
        message: `路径不存在: ${req.method} ${path || link_code || 'default'}`
      });
    }

    await connection.end();

  } catch (error) {
    console.error('销售API错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
};

// 创建销售收款信息
async function handleCreateSales(req, res, connection) {
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
              message: '微信号、收款方式和收款地址为必填项'
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

  // 生成唯一链接代码
  const linkCode = uuidv4().replace(/-/g, '').substring(0, 16);

  try {
          // 检查微信号是否已存在（包括一级销售和二级销售）
    const [existingSales] = await connection.execute(
      'SELECT wechat_name FROM sales WHERE wechat_name = ? UNION SELECT wechat_name FROM primary_sales WHERE wechat_name = ? UNION SELECT wechat_name FROM secondary_sales WHERE wechat_name = ?',
      [wechat_name, wechat_name, wechat_name]
    );

    if (existingSales.length > 0) {
      return res.status(400).json({
        success: false,
        message: '一个微信号仅支持一次注册。'
      });
    }
  } catch (error) {
            console.error('微信号去重校验错误:', error);
    return res.status(500).json({
      success: false,
                message: '微信号校验失败，请稍后重试'
    });
  }

  // 确保所有参数都不是undefined，转换为null
  const params = [
    wechat_name,
    payment_method,
    payment_address,
    alipay_surname || null,
    chain_name || null,
    linkCode
  ];

  try {
    // 创建销售记录
    console.log('🔧 尝试插入销售记录，参数:', params);
    
    const [result] = await connection.execute(
      `INSERT INTO sales (wechat_name, payment_method, payment_address, alipay_surname, chain_name, link_code, commission_rate, sales_type) 
       VALUES (?, ?, ?, ?, ?, ?, 30.00, 'secondary')`,
      params
    );

    console.log('✅ 销售记录插入成功，ID:', result.insertId);

    res.json({
      success: true,
      message: '销售收款信息创建成功',
      data: {
        sales_id: result.insertId,
        link_code: linkCode,
        full_link: `${req.headers.origin || 'https://zhixing-seven.vercel.app'}/purchase/${linkCode}`
      }
    });
  } catch (dbError) {
    console.error('❌ 数据库插入错误:', dbError);
    console.error('❌ 错误代码:', dbError.code);
    console.error('❌ 错误消息:', dbError.message);
    
    // 检查是否是唯一约束错误
    if (dbError.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({
        success: false,
                  message: '这个微信号或链接代码已经存在，请重试'
      });
    }
    
    // 检查是否是字段不匹配错误
    if (dbError.code === 'ER_WRONG_VALUE_COUNT_ON_ROW') {
      return res.status(500).json({
        success: false,
        message: '数据库表结构不匹配，请联系管理员'
      });
    }
    
    return res.status(500).json({
      success: false,
      message: '创建销售记录失败，请稍后重试',
      error: process.env.NODE_ENV === 'development' ? dbError.message : undefined
    });
  }
}

// 根据链接代码获取销售信息
async function handleGetSalesByLink(req, res, connection, linkCode) {
  const [rows] = await connection.execute(
    'SELECT * FROM sales WHERE link_code = ?',
    [linkCode]
  );

  if (rows.length === 0) {
    return res.status(404).json({
      success: false,
      message: '下单拥挤，请等待'
    });
  }

  res.json({
    success: true,
    data: rows[0]
  });
}

// 获取所有销售信息
async function handleGetAllSales(req, res, connection) {
  const [rows] = await connection.execute(
    'SELECT * FROM sales ORDER BY created_at DESC'
  );

  res.json({
    success: true,
    data: rows
  });
}

// 导出销售数据
async function handleExportSales(req, res, connection) {
  try {
    // 获取所有销售数据，包含层级关系信息
    const [rows] = await connection.execute(`
      SELECT 
        s.*,
        CASE 
          WHEN s.sales_type = 'primary' THEN (
            SELECT COUNT(*) FROM sales_hierarchy sh WHERE sh.primary_sales_id = s.id
          )
          ELSE 0
        END as secondary_sales_count,
        CASE 
          WHEN s.sales_type = 'secondary' THEN (
            SELECT ps.wechat_name 
            FROM sales_hierarchy sh 
            JOIN sales ps ON sh.primary_sales_id = ps.id 
            WHERE sh.secondary_sales_id = s.id
          )
          ELSE NULL
        END as primary_sales_name,
        COUNT(o.id) as total_orders,
        SUM(CASE WHEN o.status = 'confirmed_configuration' THEN 1 ELSE 0 END) as valid_orders,
        SUM(o.amount) as total_amount
      FROM sales s
      LEFT JOIN orders o ON s.link_code = o.sales_link_code
      GROUP BY s.id
      ORDER BY s.created_at DESC
    `);

    // 格式化导出数据
    const exportData = rows.map(sale => ({
      '销售ID': sale.id,
      '销售类型': sale.sales_type === 'primary' ? '一级销售' : (sale.sales_type === 'secondary' ? '二级销售' : '普通销售'),
              '微信号': sale.wechat_name,
      '链接代码': sale.link_code,
      '层级关系': sale.sales_type === 'secondary' ? `隶属于: ${sale.primary_sales_name || '未知'}` : 
                  sale.sales_type === 'primary' ? `管理 ${sale.secondary_sales_count} 个二级销售` : '独立销售',
      '总订单数': sale.total_orders || 0,
      '有效订单数': sale.valid_orders || 0,
      '总金额': sale.total_amount || 0,
      '佣金率': `${sale.commission_rate || 30}%`,
      '收款方式': sale.payment_method,
      '创建时间': sale.created_at
    }));

    // 设置响应头
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="销售数据_${new Date().toISOString().split('T')[0]}.csv"`);

    // 生成CSV内容
    const headers = Object.keys(exportData[0] || {});
    const csvContent = [
      headers.join(','),
      ...exportData.map(row => headers.map(header => `"${row[header] || ''}"`).join(','))
    ].join('\n');

    // 添加BOM以确保Excel正确显示中文
    const bom = '\ufeff';
    res.send(bom + csvContent);

  } catch (error) {
    console.error('导出销售数据错误:', error);
    res.status(500).json({
      success: false,
      message: '导出失败，请稍后重试'
    });
  }
}

// 销售类型筛选
async function handleFilterSales(req, res, connection) {
  const { sales_type } = req.query;
  
  let query = '';
  let params = [];
  
  if (sales_type === 'primary') {
    // 获取一级销售
    query = `
      SELECT s.*, 
             COUNT(sh.secondary_sales_id) as secondary_sales_count,
             ps.wechat_name as primary_sales_name
      FROM sales s
      LEFT JOIN primary_sales ps ON s.id = ps.id
      LEFT JOIN sales_hierarchy sh ON ps.id = sh.primary_sales_id
      WHERE s.sales_type = 'primary' OR s.sales_type IS NULL
      GROUP BY s.id
      ORDER BY s.created_at DESC
    `;
  } else if (sales_type === 'secondary') {
    // 获取二级销售
    query = `
      SELECT s.*, 
             ps.wechat_name as primary_sales_name,
             ss.commission_rate
      FROM sales s
      LEFT JOIN secondary_sales ss ON s.id = ss.id
      LEFT JOIN sales_hierarchy sh ON ss.id = sh.secondary_sales_id
      LEFT JOIN primary_sales ps ON sh.primary_sales_id = ps.id
      WHERE s.sales_type = 'secondary'
      ORDER BY s.created_at DESC
    `;
  } else {
    // 获取全部销售
    query = `
      SELECT s.*, 
             CASE 
               WHEN s.sales_type = 'primary' THEN '一级销售'
               WHEN s.sales_type = 'secondary' THEN '二级销售'
               ELSE '未知'
             END as sales_type_name,
             ps.wechat_name as primary_sales_name,
             ss.commission_rate
      FROM sales s
      LEFT JOIN primary_sales ps ON s.id = ps.id
      LEFT JOIN secondary_sales ss ON s.id = ss.id
      LEFT JOIN sales_hierarchy sh ON ss.id = sh.secondary_sales_id
      ORDER BY s.created_at DESC
    `;
  }
  
  try {
    const [rows] = await connection.execute(query, params);
    
    res.json({
      success: true,
      data: rows
    });
  } catch (error) {
    console.error('销售类型筛选错误:', error);
    res.status(500).json({
      success: false,
      message: '销售类型筛选失败'
    });
  }
}

// 根据sales_code查找销售信息（实现sales_code标准：先查一级销售，再查二级销售）
async function handleGetSalesBySalesCode(req, res, connection, sales_code) {
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
    
    if (primary.length > 0) {
      console.log('✅ 找到一级销售:', primary[0].wechat_name);
      // 为临时代码添加销售代码字段
      if (sales_code.startsWith('ps_')) {
        primary[0].sales_code = sales_code;
      }
      return res.json({
        success: true,
        data: {
          ...primary[0],
          sales_type: 'primary'
        }
      });
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
    
    if (secondary.length > 0) {
      console.log('✅ 找到二级销售:', secondary[0].wechat_name);
      // 为临时代码添加销售代码字段
      if (sales_code.startsWith('ss_')) {
        secondary[0].sales_code = sales_code;
      }
      return res.json({
        success: true,
        data: {
          ...secondary[0],
          sales_type: 'secondary'
        }
      });
    }
    
    // 3. 查找遗留的sales表（兼容性处理）- 检查多个字段
    // 先查找 sales_code 字段（如果存在且匹配）
    const [legacySalesCode] = await connection.execute(
      'SELECT *, "legacy" as sales_type FROM sales WHERE sales_code = ?', 
      [sales_code]
    );
    
    if (legacySalesCode.length > 0) {
      console.log('✅ 通过sales_code找到遗留销售:', legacySalesCode[0].wechat_name);
      return res.json({
        success: true,
        data: {
          ...legacySalesCode[0],
          sales_type: 'legacy'
        }
      });
    }
    
    // 再查找 link_code 字段
    const [legacyLinkCode] = await connection.execute(
      'SELECT *, "legacy" as sales_type FROM sales WHERE link_code = ?', 
      [sales_code]
    );
    
    if (legacyLinkCode.length > 0) {
      console.log('✅ 通过link_code找到遗留销售:', legacyLinkCode[0].wechat_name);
      return res.json({
        success: true,
        data: {
          ...legacyLinkCode[0],
          sales_type: 'legacy'
        }
      });
    }
    
    // 4. 未找到销售信息 - 返回友好提示
    console.log('❌ 未找到销售代码:', sales_code);
    return res.status(404).json({
      success: false,
      message: '下单拥挤，请等待'
    });
    
  } catch (error) {
    console.error('根据sales_code查找销售信息错误:', error);
    res.status(500).json({
      success: false,
      message: '下单拥挤，请等待'
    });
  }
}

// 移除二级销售
async function handleRemoveSecondarySales(req, res, connection) {
  try {
    const { id } = req.query; // 二级销售ID
    const { reason } = req.body; // 移除原因
    
    console.log('移除二级销售请求:', { id, reason });
    
    // 验证必需参数
    if (!id) {
      return res.status(400).json({
        success: false,
        message: '缺少必需的二级销售ID'
      });
    }
    
    if (!reason) {
      return res.status(400).json({
        success: false,
        message: '请提供移除原因'
      });
    }
    
    // 1. 检查二级销售是否存在
    const [secondarySalesRows] = await connection.execute(
      'SELECT id, wechat_name, primary_sales_id FROM secondary_sales WHERE id = ?',
      [id]
    );
    
    if (secondarySalesRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: '二级销售不存在'
      });
    }
    
    const secondarySales = secondarySalesRows[0];
    
    // 2. 检查是否有关联的订单
    const [orderRows] = await connection.execute(
      'SELECT COUNT(*) as order_count FROM orders WHERE secondary_sales_id = ?',
      [id]
    );
    
    const orderCount = orderRows[0].order_count;
    
    // 3. 开始事务处理
    await connection.beginTransaction();
    
    try {
      if (orderCount > 0) {
        // 如果有关联订单，不直接删除，而是设置为已移除状态
        await connection.execute(
          `UPDATE secondary_sales 
           SET status = 'removed', 
               removed_reason = ?, 
               removed_at = NOW() 
           WHERE id = ?`,
          [reason, id]
        );
        
        console.log(`二级销售 ${secondarySales.wechat_name} 已标记为移除，原因: ${reason}`);
      } else {
        // 如果没有关联订单，可以直接删除
        await connection.execute(
          'DELETE FROM secondary_sales WHERE id = ?',
          [id]
        );
        
        console.log(`二级销售 ${secondarySales.wechat_name} 已完全删除，原因: ${reason}`);
      }
      
      // 提交事务
      await connection.commit();
      
      // 返回成功响应
      res.status(200).json({
        success: true,
        message: '二级销售移除成功',
        data: {
          id: parseInt(id),
          wechat_name: secondarySales.wechat_name,
          action: orderCount > 0 ? 'marked_removed' : 'deleted',
          reason: reason,
          order_count: orderCount
        }
      });
      
    } catch (error) {
      // 回滚事务
      await connection.rollback();
      throw error;
    }
    
  } catch (error) {
    console.error('移除二级销售错误:', error);
    res.status(500).json({
      success: false,
      message: '移除失败: ' + error.message
    });
  }
}