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

// 验证管理员token
async function authenticateAdmin(req) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    throw new Error('未提供认证token');
  }

  const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default-secret');
  return decoded;
}

module.exports = async (req, res) => {
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
    // 验证管理员权限
    await authenticateAdmin(req);

    const connection = await mysql.createConnection(dbConfig);

    if (req.method === 'GET') {
      await handleGetPaymentConfig(req, res, connection);
    } else if (req.method === 'POST') {
      await handleSavePaymentConfig(req, res, connection);
    } else {
      res.status(404).json({
        success: false,
        message: `方法不支持: ${req.method}`
      });
    }

    await connection.end();

  } catch (error) {
    console.error('支付配置API错误:', error);
    res.status(500).json({
      success: false,
      message: error.message || '服务器内部错误'
    });
  }
};

// 获取支付配置
async function handleGetPaymentConfig(req, res, connection) {
  const [rows] = await connection.execute(
    'SELECT * FROM payment_config ORDER BY id DESC LIMIT 1'
  );

  if (rows.length === 0) {
    // 如果没有配置，返回默认值
    return res.json({
      success: true,
      data: {
        alipay_account: '',
        alipay_surname: '',
        alipay_qr_code: '',
        crypto_chain_name: '',
        crypto_address: '',
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
async function handleSavePaymentConfig(req, res, connection) {
  const {
    alipay_account,
    alipay_surname,
    alipay_qr_code,
    crypto_chain_name,
    crypto_address,
    crypto_qr_code
  } = req.body;

  // 检查是否已有配置
  const [existingRows] = await connection.execute(
    'SELECT id FROM payment_config LIMIT 1'
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
       crypto_chain_name, crypto_address, crypto_qr_code, existingRows[0].id]
    );
  } else {
    // 创建新配置
    await connection.execute(
      `INSERT INTO payment_config 
       (alipay_account, alipay_surname, alipay_qr_code, crypto_chain_name, crypto_address, crypto_qr_code)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [alipay_account, alipay_surname, alipay_qr_code, 
       crypto_chain_name, crypto_address, crypto_qr_code]
    );
  }

  res.json({
    success: true,
    message: '支付配置保存成功'
  });
}