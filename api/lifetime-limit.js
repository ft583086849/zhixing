// Vercel Serverless Function - 永久授权限量API
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

  try {
    if (req.method === 'GET') {
      // 模拟永久授权限量数据
      const lifetimeLimit = {
        total_limit: 100,
        used_count: 23,
        remaining_count: 77,
        is_active: true,
        created_at: "2024-01-01T00:00:00.000Z",
        updated_at: new Date().toISOString()
      };

      return res.json({
        success: true,
        data: lifetimeLimit,
        message: '永久授权限量信息获取成功'
      });

    } else if (req.method === 'POST') {
      const { total_limit, is_active } = req.body;

      if (!total_limit || typeof total_limit !== 'number') {
        return res.status(400).json({
          success: false,
          message: '总限量必须是一个有效数字'
        });
      }

      // 模拟更新操作
      const updatedLimit = {
        total_limit,
        used_count: 23, // 保持已使用数量不变
        remaining_count: total_limit - 23,
        is_active: is_active !== undefined ? is_active : true,
        updated_at: new Date().toISOString()
      };

      return res.json({
        success: true,
        data: updatedLimit,
        message: '永久授权限量更新成功'
      });
    }

    return res.status(405).json({
      success: false,
      message: '方法不允许'
    });

  } catch (error) {
    console.error('永久授权限量API错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
}; 