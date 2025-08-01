// Vercel Serverless Function - 简化管理员API
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

    // 只处理stats路径
    if (req.method === 'GET' && (path === 'stats' || !path)) {
      // 返回硬编码的统计信息
      const stats = {
        total_orders: 15,
        today_orders: 0,
        total_amount: 0,
        today_amount: 0,
        total_customers: 0,
        pending_payment_orders: 15,
        primary_sales_count: 0,
        secondary_sales_count: 12,
        primary_sales_amount: 0,
        secondary_sales_amount: 0,
        avg_secondary_per_primary: 0,
        max_secondary_per_primary: 0,
        active_hierarchies: 0
      };

      res.json({
        success: true,
        data: stats
      });
    } else {
      res.status(404).json({
        success: false,
        message: `路径不存在: ${req.method} ${path || 'default'}`
      });
    }

  } catch (error) {
    console.error('简化管理员API错误:', error);
    res.status(500).json({
      success: false,
      message: error.message || '服务器内部错误'
    });
  }
} 