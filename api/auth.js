// Vercel Serverless Function - 认证API
const jwt = require('jsonwebtoken');

module.exports = async (req, res) => {
  // 设置CORS头部
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const { path } = req.query;

  try {
    if (path === 'login' && req.method === 'POST') {
      const { username, password } = req.body;

      // 验证输入
      if (!username || !password) {
        return res.status(400).json({
          success: false,
          message: '用户名和密码不能为空'
        });
      }

      // 临时硬编码管理员账号（后续连接数据库）
      const validCredentials = {
        admin: 'admin123',
        test: 'test123'
      };

      if (validCredentials[username] !== password) {
        return res.status(401).json({
          success: false,
          message: '用户名或密码错误'
        });
      }

      // 生成JWT token
      const token = jwt.sign(
        { 
          id: 1, 
          username: username 
        },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '24h' }
      );

      return res.json({
        success: true,
        message: '登录成功',
        data: {
          token,
          admin: {
            id: 1,
            username: username
          }
        }
      });

    } else if (path === 'verify' && req.method === 'GET') {
      const authHeader = req.headers.authorization;
      const token = authHeader && authHeader.split(' ')[1];

      if (!token) {
        return res.status(401).json({
          success: false,
          message: '未提供认证令牌'
        });
      }

      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        return res.json({
          success: true,
          data: {
            admin: {
              id: decoded.id,
              username: decoded.username
            }
          }
        });
      } catch (error) {
        return res.status(401).json({
          success: false,
          message: '无效的认证令牌'
        });
      }
    }

    return res.status(404).json({
      success: false,
      message: '接口不存在'
    });

  } catch (error) {
    console.error('认证错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
}; 