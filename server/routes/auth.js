const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Admins } = require('../models');

const router = express.Router();

// 管理员登录
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

    // 查找管理员
    const admin = await Admins.findOne({
      where: { username }
    });

    if (!admin) {
      return res.status(401).json({
        success: false,
        message: '用户名或密码错误'
      });
    }

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
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    res.json({
      success: true,
      message: '登录成功',
      data: {
        token,
        admin: {
          id: admin.id,
          username: admin.username
        }
      }
    });

  } catch (error) {
    console.error('登录错误:', error);
    res.status(500).json({
      success: false,
      message: '登录失败'
    });
  }
});

// 验证token
router.get('/verify', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: '未提供认证token'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // 查找管理员
    const admin = await Admins.findByPk(decoded.id);
    if (!admin) {
      return res.status(401).json({
        success: false,
        message: '管理员不存在'
      });
    }

    res.json({
      success: true,
      message: 'token有效',
      data: {
        admin: {
          id: admin.id,
          username: admin.username
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
});

module.exports = router; 