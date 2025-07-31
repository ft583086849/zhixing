// Vercel Serverless Function - 创建管理员账号API
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

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
    const connection = await mysql.createConnection(dbConfig);
    const { path } = req.query;

    if (req.method === 'POST' && (path === 'create' || !path)) {
      await handleCreateAdmin(req, res, connection);
    } else if (req.method === 'GET' && (path === 'check' || !path)) {
      await handleCheckAdmin(req, res, connection);
    } else {
      res.status(404).json({
        success: false,
        message: `路径不存在: ${req.method} ${path || 'default'}`
      });
    }

    await connection.end();

  } catch (error) {
    console.error('创建管理员API错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误',
      error: error.message
    });
  }
};

// 创建管理员账号
async function handleCreateAdmin(req, res, connection) {
  try {
    console.log('🔧 开始创建管理员账号...');
    
    const { username, password } = req.body;
    
    // 如果没有提供用户名和密码，使用默认值
    const targetUsername = username || 'admin';
    const targetPassword = password || 'admin123';
    
    // 检查是否已存在该管理员账号
    const [existingAdmins] = await connection.execute(
      'SELECT * FROM admins WHERE username = ?',
      [targetUsername]
    );
    
    if (existingAdmins.length > 0) {
      return res.json({
        success: true,
        message: '管理员账号已存在',
        data: {
          username: targetUsername,
          exists: true
        }
      });
    }
    
    // 创建管理员账号
    const hashedPassword = await bcrypt.hash(targetPassword, 10);
    
    await connection.execute(
      'INSERT INTO admins (username, password_hash, created_at) VALUES (?, ?, NOW())',
      [targetUsername, hashedPassword]
    );
    
    res.json({
      success: true,
      message: '管理员账号创建成功！',
      data: {
        username: targetUsername,
        password: targetPassword,
        created: true
      }
    });
    
  } catch (error) {
    console.error('❌ 创建管理员账号失败:', error.message);
    res.status(500).json({
      success: false,
      message: '创建失败',
      error: error.message
    });
  }
}

// 检查管理员账号
async function handleCheckAdmin(req, res, connection) {
  try {
    const [admins] = await connection.execute(
      'SELECT username, created_at FROM admins'
    );
    
    res.json({
      success: true,
      message: '管理员账号检查完成',
      data: {
        count: admins.length,
        admins: admins
      }
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '检查失败',
      error: error.message
    });
  }
} 