const express = require('express');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const router = express.Router();

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

// 登录路由
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // 验证输入
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: '用户名和密码不能为空'
      });
    }

    // 创建数据库连接
    const connection = await mysql.createConnection(dbConfig);

    // 查找管理员
    const [rows] = await connection.execute(
      'SELECT * FROM admins WHERE username = ?',
      [username]
    );

    if (rows.length === 0) {
      await connection.end();
      return res.status(401).json({
        success: false,
        message: '用户名或密码错误'
      });
    }

    const admin = rows[0];

    // 验证密码
    const isValidPassword = await bcrypt.compare(password, admin.password_hash);
    if (!isValidPassword) {
      await connection.end();
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
      process.env.JWT_SECRET || 'your-secret-key',
      { 
        expiresIn: process.env.JWT_EXPIRES_IN || '24h' 
      }
    );

    await connection.end();

    res.json({
      success: true,
      message: '登录成功',
      token,
      admin: {
        id: admin.id,
        username: admin.username
      }
    });

  } catch (error) {
    console.error('登录错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
});

// 验证token路由
router.get('/verify', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: '缺少认证token'
      });
    }

    const token = authHeader.substring(7);

    // 验证JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');

    // 创建数据库连接
    const connection = await mysql.createConnection(dbConfig);

    // 验证管理员是否存在
    const [rows] = await connection.execute(
      'SELECT id, username FROM admins WHERE id = ?',
      [decoded.id]
    );

    if (rows.length === 0) {
      await connection.end();
      return res.status(401).json({
        success: false,
        message: '管理员不存在'
      });
    }

    await connection.end();

    res.json({
      success: true,
      message: 'token有效',
      admin: {
        id: rows[0].id,
        username: rows[0].username
      }
    });

  } catch (error) {
    console.error('token验证错误:', error);
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: '无效的token'
      });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'token已过期'
      });
    }
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
});

module.exports = router; 