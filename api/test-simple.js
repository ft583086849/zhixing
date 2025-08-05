// 最简化的Vercel函数测试
// 用于验证Vercel部署环境和基础功能

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
    
    // 基础测试响应
    if (req.method === 'GET') {
      return res.status(200).json({
        success: true,
        message: '测试API正常工作',
        method: req.method,
        path: path || 'default',
        timestamp: new Date().toISOString()
      });
    }
    
    // PUT方法测试
    if (req.method === 'PUT') {
      return res.status(200).json({
        success: true,
        message: 'PUT方法支持正常',
        method: req.method,
        path: path || 'default',
        query: req.query,
        timestamp: new Date().toISOString()
      });
    }
    
    // 其他方法
    res.status(405).json({
      success: false,
      message: `方法 ${req.method} 不支持`
    });
    
  } catch (error) {
    console.error('测试API错误:', error);
    res.status(500).json({
      success: false,
      message: error.message || '服务器内部错误',
      stack: error.stack
    });
  }
}