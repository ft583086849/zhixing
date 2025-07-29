const jwt = require('jsonwebtoken');
const { Admins } = require('../models');

// 验证管理员token的中间件
const authenticateAdmin = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: '未提供认证token'
      });
    }

    // 验证token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // 查找管理员
    const admin = await Admins.findByPk(decoded.id);
    if (!admin) {
      return res.status(401).json({
        success: false,
        message: '管理员不存在'
      });
    }

    // 将管理员信息添加到请求对象
    req.admin = admin;
    next();

  } catch (error) {
    console.error('认证中间件错误:', error);
    res.status(401).json({
      success: false,
      message: 'token无效或已过期'
    });
  }
};

module.exports = {
  authenticateAdmin
}; 