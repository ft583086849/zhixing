// Vercel Serverless Function - 订单管理API
module.exports = (req, res) => {
  // 设置CORS头部
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // 模拟订单数据
  const mockOrders = [
    {
      id: 1,
      user_name: "张三",
      product_name: "知行财库专业版",
      amount: 299,
      status: "已完成",
      created_at: new Date().toISOString()
    },
    {
      id: 2,
      user_name: "李四",
      product_name: "知行财库企业版",
      amount: 599,
      status: "处理中",
      created_at: new Date().toISOString()
    }
  ];

  switch (req.method) {
    case 'GET':
      return res.status(200).json({
        success: true,
        data: mockOrders,
        message: '订单数据获取成功'
      });

    case 'POST':
      const newOrder = {
        id: Date.now(),
        ...req.body,
        status: "待处理",
        created_at: new Date().toISOString()
      };
      
      return res.status(201).json({
        success: true,
        data: newOrder,
        message: '订单创建成功'
      });

    default:
      return res.status(405).json({
        success: false,
        message: '方法不允许'
      });
  }
}; 