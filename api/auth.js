// Vercel Serverless Function - 认证API
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
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
    // 创建数据库连接
    const connection = await mysql.createConnection(dbConfig);

    // 根据HTTP方法和查询参数处理不同请求
    const { path } = req.query;
    
    if (req.method === 'POST' && (!path || path === 'login')) {
      await handleLogin(req, res, connection);
    } else if (req.method === 'GET' && (!path || path === 'verify')) {
      await handleVerify(req, res, connection);
    } else {
      res.status(404).json({
        success: false,
        message: `路径不存在: ${req.method} ${path || 'default'}`
      });
    }

    await connection.end();

  } catch (error) {
    console.error('认证API错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
};

// 处理登录
async function handleLogin(req, res, connection) {
  const { username, password } = req.body;

  // 验证输入
  if (!username || !password) {
    return res.status(400).json({
      success: false,
      message: '用户名和密码不能为空'
    });
  }

  // 查找管理员
  const [rows] = await connection.execute(
    'SELECT * FROM admins WHERE username = ?',
    [username]
  );

  if (rows.length === 0) {
    return res.status(401).json({
      success: false,
      message: '用户名或密码错误'
    });
  }

  const admin = rows[0];

  // 验证密码
  const isValidPassword = await bcrypt.compare(password, admin.password_hash);
  if (!isValidPassword) {
    return res.status(401).json({
      success: false,
      message: '用户名或密码错误'
    });
  }

  // 生成JWT token
  const token = jwt.sign(
    { 
      id: admin.id, 
      username: admin.username 
    },
    process.env.JWT_SECRET || 'default-secret',
    { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
  );

  // 更新最后登录时间
  await connection.execute(
    'UPDATE admins SET last_login_at = NOW() WHERE id = ?',
    [admin.id]
  );

  res.json({
    success: true,
    message: '登录成功',
    data: {
      token,
      admin: {
        id: admin.id,
        username: admin.username,
        role: admin.role
      }
    }
  });
}

// 处理token验证
async function handleVerify(req, res, connection) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({
      success: false,
      message: '未提供认证token'
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default-secret');
    
    // 查找管理员
    const [rows] = await connection.execute(
      'SELECT * FROM admins WHERE id = ?',
      [decoded.id]
    );

    if (rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: '管理员不存在'
      });
    }

    const admin = rows[0];

    res.json({
      success: true,
      message: 'token有效',
      data: {
        admin: {
          id: admin.id,
          username: admin.username,
          role: admin.role
        }
      }
    });

  } catch (error) {
    console.error('token验证错误:', error);
    res.status(401).json({
      success: false,
      message: 'token无效或已过期'
    });
  }
}