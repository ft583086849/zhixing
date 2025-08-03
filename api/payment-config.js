// Vercel Serverless Function - 支付配置API
const mysql = require('mysql2/promise');
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

    // 需要权限验证的端点
    const protectedEndpoints = ['get', 'update'];
    
    if (req.method === 'GET' && protectedEndpoints.includes(path)) {
      const authResult = await verifyAdminAuth(req, res);
      if (!authResult.success) {
        return res.status(authResult.status).json({
          success: false,
          message: authResult.message
        });
      }
    }

    // 处理获取支付配置
    if (req.method === 'GET' && (path === 'get' || !path)) {
      await handleGetPaymentConfig(req, res);
      return;
    }

    // 处理更新支付配置
    if (req.method === 'PUT' && (path === 'update' || bodyPath === 'update')) {
      await handleUpdatePaymentConfig(req, res);
      return;
    }

    // 如果没有匹配的路径，返回404
    res.status(404).json({
      success: false,
      message: `路径不存在: ${req.method} ${path || bodyPath || 'default'}`
    });

  } catch (error) {
    console.error('支付配置API错误:', error);
    res.status(500).json({
      success: false,
      message: error.message || '服务器内部错误'
    });
  }
}

// 获取支付配置
async function handleGetPaymentConfig(req, res) {
  const connection = await mysql.createConnection(dbConfig);
  const [rows] = await connection.execute(
    'SELECT * FROM payment_config ORDER BY id DESC LIMIT 1'
  );
  await connection.end();

  if (rows.length === 0) {
    // 如果没有配置，返回默认值
    return res.json({
      success: true,
      data: {
        alipay_account: '752304285@qq.com',
        alipay_surname: '梁',
        alipay_qr_code: '',
        crypto_chain_name: 'TRC10/TRC20',
        crypto_address: 'TDnNfU9GYcDbzFqf8LUNzBuTsaDbCh5LTo',
        crypto_qr_code: ''
      }
    });
  }

  res.json({
    success: true,
    data: rows[0]
  });
}

// 保存支付配置
async function handleUpdatePaymentConfig(req, res) {
  const {
    alipay_account,
    alipay_surname,
    alipay_qr_code,
    crypto_chain_name,
    crypto_address,
    crypto_qr_code
  } = req.body;

  const connection = await mysql.createConnection(dbConfig);
  // 检查是否已存在配置
  const [existingRows] = await connection.execute(
    'SELECT id FROM payment_config ORDER BY id DESC LIMIT 1'
  );

  if (existingRows.length > 0) {
    // 更新现有配置
    await connection.execute(
      `UPDATE payment_config SET 
       alipay_account = ?, alipay_surname = ?, alipay_qr_code = ?,
       crypto_chain_name = ?, crypto_address = ?, crypto_qr_code = ?,
       updated_at = NOW()
       WHERE id = ?`,
      [alipay_account, alipay_surname, alipay_qr_code, 
       crypto_chain_name, crypto_address, crypto_qr_code, 
       existingRows[0].id]
    );
  } else {
    // 创建新配置
    await connection.execute(
      `INSERT INTO payment_config (
        alipay_account, alipay_surname, alipay_qr_code,
        crypto_chain_name, crypto_address, crypto_qr_code
      ) VALUES (?, ?, ?, ?, ?, ?)`,
      [alipay_account, alipay_surname, alipay_qr_code, 
       crypto_chain_name, crypto_address, crypto_qr_code]
    );
  }
  await connection.end();

  res.json({
    success: true,
    message: '支付配置保存成功'
  });
}