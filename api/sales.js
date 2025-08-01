// Vercel Serverless Function - 销售API
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
    const { path, link_code } = req.query;

    if (req.method === 'POST' && path === 'create') {
      await handleCreateSales(req, res, connection);
    } else if (req.method === 'GET' && link_code) {
      await handleGetSalesByLink(req, res, connection, link_code);
    } else if (req.method === 'GET' && (path === 'list' || !path)) {
      // 默认GET请求返回销售列表，支持销售类型筛选
      await handleGetAllSales(req, res, connection);
    } else if (req.method === 'GET' && path === 'filter') {
      // 销售类型筛选
      await handleFilterSales(req, res, connection);
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

  // 生成唯一链接代码
  const linkCode = uuidv4().replace(/-/g, '').substring(0, 16);

  try {
    // 检查微信名是否已存在（包括一级销售和二级销售）
    const [existingSales] = await connection.execute(
      'SELECT wechat_name FROM sales WHERE wechat_name = ? UNION SELECT wechat_name FROM primary_sales WHERE wechat_name = ? UNION SELECT wechat_name FROM secondary_sales WHERE wechat_name = ?',
      [wechat_name, wechat_name, wechat_name]
    );

    if (existingSales.length > 0) {
      return res.status(400).json({
        success: false,
        message: '这个微信名已经被人使用了，请换一个'
      });
    }
  } catch (error) {
    console.error('微信名去重校验错误:', error);
    return res.status(500).json({
      success: false,
      message: '微信名校验失败，请稍后重试'
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
      `INSERT INTO sales (wechat_name, payment_method, payment_address, alipay_surname, chain_name, link_code) 
       VALUES (?, ?, ?, ?, ?, ?)`,
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
        message: '这个微信名或链接代码已经存在，请重试'
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
      message: '链接不存在'
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