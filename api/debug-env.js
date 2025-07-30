// 环境变量调试API
module.exports = (req, res) => {
  // 设置CORS头部
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: '方法不允许' });
  }

  // 安全地显示环境变量状态（不显示真实值）
  const envStatus = {
    NODE_ENV: process.env.NODE_ENV,
    VERCEL_ENV: process.env.VERCEL_ENV,
    database_vars: {
      DATABASE_HOST: process.env.DATABASE_HOST ? `设置(${process.env.DATABASE_HOST?.length}字符)` : '未设置',
      DATABASE_USERNAME: process.env.DATABASE_USERNAME ? `设置(${process.env.DATABASE_USERNAME?.length}字符)` : '未设置', 
      DATABASE_PASSWORD: process.env.DATABASE_PASSWORD ? `设置(${process.env.DATABASE_PASSWORD?.length}字符)` : '未设置',
      DATABASE_NAME: process.env.DATABASE_NAME ? `设置(${process.env.DATABASE_NAME?.length}字符)` : '未设置'
    },
    sequelize_vars: {
      DB_HOST: process.env.DB_HOST ? `设置(${process.env.DB_HOST?.length}字符)` : '未设置',
      DB_USER: process.env.DB_USER ? `设置(${process.env.DB_USER?.length}字符)` : '未设置',
      DB_PASSWORD: process.env.DB_PASSWORD ? `设置(${process.env.DB_PASSWORD?.length}字符)` : '未设置', 
      DB_NAME: process.env.DB_NAME ? `设置(${process.env.DB_NAME?.length}字符)` : '未设置'
    },
    computed: {
      hasDbConfig: !!(process.env.DATABASE_HOST && process.env.DATABASE_USERNAME && process.env.DATABASE_PASSWORD && process.env.DATABASE_NAME),
      isProduction: process.env.NODE_ENV === 'production' || process.env.VERCEL_ENV === 'production'
    }
  };

  res.status(200).json(envStatus);
}; 