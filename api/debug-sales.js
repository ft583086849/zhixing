// Vercel Serverless Function - 销售API调试
const mysql = require('mysql2/promise');
const { v4: uuidv4 } = require('uuid');

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

module.exports = async (req, res) => {
  // 设置CORS头部
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');

  // 处理OPTIONS预检请求
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    console.log('🔍 开始销售API调试...');
    console.log('📋 请求方法:', req.method);
    console.log('📋 请求路径:', req.url);
    console.log('📋 请求体:', JSON.stringify(req.body, null, 2));
    
    const debugInfo = {
      request: {
        method: req.method,
        url: req.url,
        body: req.body,
        headers: req.headers
      },
      steps: [],
      errors: []
    };
    
    // 步骤1: 连接数据库
    debugInfo.steps.push('开始连接数据库');
    const connection = await mysql.createConnection(dbConfig);
    debugInfo.steps.push('数据库连接成功');
    console.log('✅ 数据库连接成功');
    
    // 步骤2: 解析请求参数
    debugInfo.steps.push('解析请求参数');
    const { path, link_code } = req.query;
    console.log('📋 查询参数:', { path, link_code });
    
    if (req.method === 'POST' && path === 'create') {
      debugInfo.steps.push('处理创建销售请求');
      
      // 步骤3: 提取请求体数据
      const { 
        wechat_name, 
        payment_method, 
        payment_address, 
        alipay_surname, 
        chain_name 
      } = req.body;
      
      console.log('📋 请求体数据:', {
        wechat_name,
        payment_method,
        payment_address,
        alipay_surname,
        chain_name
      });
      
      debugInfo.steps.push('数据提取完成');
      
      // 步骤4: 验证必填字段
      debugInfo.steps.push('开始字段验证');
      if (!wechat_name || !payment_method || !payment_address) {
        const error = '微信名称、收款方式和收款地址为必填项';
        debugInfo.errors.push(error);
        debugInfo.steps.push('字段验证失败');
        console.log('❌ 字段验证失败:', error);
        
        await connection.end();
        return res.status(400).json({
          success: false,
          message: error,
          debug: debugInfo
        });
      }
      debugInfo.steps.push('字段验证通过');
      
      // 步骤5: 验证收款方式
      debugInfo.steps.push('验证收款方式');
      if (!['alipay', 'crypto'].includes(payment_method)) {
        const error = '收款方式只能是支付宝或线上地址码';
        debugInfo.errors.push(error);
        debugInfo.steps.push('收款方式验证失败');
        console.log('❌ 收款方式验证失败:', error);
        
        await connection.end();
        return res.status(400).json({
          success: false,
          message: error,
          debug: debugInfo
        });
      }
      debugInfo.steps.push('收款方式验证通过');
      
      // 步骤6: 支付宝收款验证
      if (payment_method === 'alipay' && !alipay_surname) {
        const error = '支付宝收款需要填写收款人姓氏';
        debugInfo.errors.push(error);
        debugInfo.steps.push('支付宝验证失败');
        console.log('❌ 支付宝验证失败:', error);
        
        await connection.end();
        return res.status(400).json({
          success: false,
          message: error,
          debug: debugInfo
        });
      }
      debugInfo.steps.push('支付宝验证通过');
      
      // 步骤7: 线上地址码验证
      if (payment_method === 'crypto' && !chain_name) {
        const error = '线上地址码需要填写链名';
        debugInfo.errors.push(error);
        debugInfo.steps.push('加密货币验证失败');
        console.log('❌ 加密货币验证失败:', error);
        
        await connection.end();
        return res.status(400).json({
          success: false,
          message: error,
          debug: debugInfo
        });
      }
      debugInfo.steps.push('加密货币验证通过');
      
      // 步骤8: 生成唯一链接代码
      debugInfo.steps.push('生成链接代码');
      const linkCode = uuidv4().replace(/-/g, '').substring(0, 16);
      console.log('📋 生成的链接代码:', linkCode);
      debugInfo.steps.push('链接代码生成完成');
      
      // 步骤9: 创建销售记录
      debugInfo.steps.push('开始插入数据库');
      try {
        const [result] = await connection.execute(
          `INSERT INTO sales (wechat_name, payment_method, payment_address, alipay_surname, chain_name, link_code) 
           VALUES (?, ?, ?, ?, ?, ?)`,
          [wechat_name, payment_method, payment_address, alipay_surname, chain_name, linkCode]
        );
        
        debugInfo.steps.push('数据库插入成功');
        console.log('✅ 数据库插入成功，ID:', result.insertId);
        
        // 步骤10: 返回成功响应
        const responseData = {
          success: true,
          message: '销售收款信息创建成功',
          data: {
            sales_id: result.insertId,
            link_code: linkCode,
            full_link: `${req.headers.origin || 'https://zhixing-seven.vercel.app'}/purchase/${linkCode}`
          }
        };
        
        debugInfo.steps.push('准备返回响应');
        console.log('📋 返回数据:', responseData);
        
        await connection.end();
        debugInfo.steps.push('数据库连接已关闭');
        
        res.json({
          ...responseData,
          debug: debugInfo
        });
        
      } catch (dbError) {
        debugInfo.errors.push(`数据库操作失败: ${dbError.message}`);
        debugInfo.steps.push('数据库操作失败');
        console.error('❌ 数据库操作失败:', dbError);
        
        await connection.end();
        return res.status(500).json({
          success: false,
          message: '数据库操作失败',
          error: dbError.message,
          debug: debugInfo
        });
      }
      
    } else {
      debugInfo.errors.push(`不支持的请求: ${req.method} ${path}`);
      await connection.end();
      return res.status(404).json({
        success: false,
        message: `路径不存在: ${req.method} ${path || link_code || 'default'}`,
        debug: debugInfo
      });
    }
    
  } catch (error) {
    console.error('❌ 销售API调试失败:', error);
    res.status(500).json({
      success: false,
      message: '销售API调试失败',
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
  }
}; 