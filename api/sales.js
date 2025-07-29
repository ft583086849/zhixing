// Vercel Serverless Function - 销售相关API
export default function handler(req, res) {
  // 设置CORS头部
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');

  // 处理OPTIONS预检请求
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // 模拟销售数据（后续可连接真实数据库）
  const mockSalesData = [
    {
      id: 1,
      name: "知行财库专业版",
      price: 299,
      description: "专业的财务管理工具",
      created_at: new Date().toISOString()
    },
    {
      id: 2,
      name: "知行财库企业版", 
      price: 599,
      description: "适合企业使用的财务解决方案",
      created_at: new Date().toISOString()
    }
  ];

  switch (req.method) {
    case 'GET':
      return res.status(200).json({
        success: true,
        data: mockSalesData,
        message: '销售数据获取成功'
      });

    case 'POST':
      // 创建新的销售记录
      const newSale = {
        id: Date.now(),
        ...req.body,
        created_at: new Date().toISOString()
      };
      
      return res.status(201).json({
        success: true,
        data: newSale,
        message: '销售记录创建成功'
      });

    default:
      return res.status(405).json({
        success: false,
        message: '方法不允许'
      });
  }
} 