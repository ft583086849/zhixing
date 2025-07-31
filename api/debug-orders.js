// Vercel Serverless Function - 订单API调试
const mysql = require('mysql2/promise');

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
    console.log('🔍 开始订单API调试...');
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
    const { path } = req.query;
    console.log('📋 查询参数:', { path });
    
    if (req.method === 'POST' && path === 'create') {
      debugInfo.steps.push('处理创建订单请求');
      
      // 步骤3: 提取请求体数据
      const {
        link_code,
        tradingview_username,
        customer_wechat,
        duration,
        amount,
        payment_method,
        payment_time,
        purchase_type = 'immediate',
        alipay_amount
      } = req.body;
      
      console.log('📋 请求体数据:', {
        link_code,
        tradingview_username,
        customer_wechat,
        duration,
        amount,
        payment_method,
        payment_time,
        purchase_type,
        alipay_amount
      });
      
      debugInfo.steps.push('数据提取完成');
      
      // 步骤4: 验证必填字段
      debugInfo.steps.push('开始字段验证');
      if (!link_code || !tradingview_username || !duration || !amount || !payment_method || !payment_time) {
        const error = '缺少必填字段';
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
      
      // 步骤5: 验证链接代码是否存在
      debugInfo.steps.push('验证销售链接');
      try {
        const [salesRows] = await connection.execute(
          'SELECT * FROM sales WHERE link_code = ?',
          [link_code]
        );
        
        if (salesRows.length === 0) {
          const error = '销售链接不存在';
          debugInfo.errors.push(error);
          debugInfo.steps.push('销售链接验证失败');
          console.log('❌ 销售链接验证失败:', error);
          
          await connection.end();
          return res.status(404).json({
            success: false,
            message: error,
            debug: debugInfo
          });
        }
        
        const sales = salesRows[0];
        debugInfo.steps.push('销售链接验证通过');
        console.log('✅ 销售链接验证通过:', sales.wechat_name);
        
        // 步骤6: 计算时间
        debugInfo.steps.push('计算时间');
        let effectiveTime = new Date();
        let expiryTime = new Date();
        
        if (purchase_type === 'advance') {
          effectiveTime = new Date(req.body.effective_time);
        }

        // 计算过期时间
        switch (duration) {
          case '7days':
            expiryTime = new Date(effectiveTime.getTime() + 7 * 24 * 60 * 60 * 1000);
            break;
          case '1month':
            expiryTime = new Date(effectiveTime);
            expiryTime.setMonth(expiryTime.getMonth() + 1);
            break;
          case '3months':
            expiryTime = new Date(effectiveTime);
            expiryTime.setMonth(expiryTime.getMonth() + 3);
            break;
          case '6months':
            expiryTime = new Date(effectiveTime);
            expiryTime.setMonth(expiryTime.getMonth() + 6);
            break;
          case '1year':
            expiryTime = new Date(effectiveTime);
            expiryTime.setFullYear(expiryTime.getFullYear() + 1);
            break;
          case 'lifetime':
            expiryTime = new Date('2099-12-31');
            break;
        }
        
        debugInfo.steps.push('时间计算完成');
        console.log('📋 生效时间:', effectiveTime);
        console.log('📋 过期时间:', expiryTime);
        
        // 步骤7: 计算佣金
        debugInfo.steps.push('计算佣金');
        const commissionRate = sales.commission_rate || 0.15;
        const commissionAmount = parseFloat(amount) * commissionRate;
        debugInfo.steps.push('佣金计算完成');
        console.log('📋 佣金比例:', commissionRate);
        console.log('📋 佣金金额:', commissionAmount);
        
        // 步骤8: 创建订单
        debugInfo.steps.push('开始插入订单');
        try {
          const params = [
            link_code, 
            tradingview_username, 
            customer_wechat || null, 
            duration, 
            amount,
            payment_method, 
            payment_time, 
            purchase_type, 
            effectiveTime, 
            expiryTime,
            alipay_amount || null, 
            commissionRate, 
            commissionAmount, 
            'pending_review'
          ];
          
          console.log('📋 插入参数:', params);
          
          const [result] = await connection.execute(
            `INSERT INTO orders (
              link_code, tradingview_username, customer_wechat, duration, amount, 
              payment_method, payment_time, purchase_type, effective_time, expiry_time,
              alipay_amount, commission_rate, commission_amount, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            params
          );
          
          debugInfo.steps.push('订单插入成功');
          console.log('✅ 订单插入成功，ID:', result.insertId);
          
          // 步骤9: 更新销售统计
          debugInfo.steps.push('更新销售统计');
          await connection.execute(
            'UPDATE sales SET total_orders = total_orders + 1, total_revenue = total_revenue + ? WHERE link_code = ?',
            [amount, link_code]
          );
          debugInfo.steps.push('销售统计更新成功');
          
          // 步骤10: 返回成功响应
          const responseData = {
            success: true,
            message: '订单创建成功',
            data: {
              order_id: result.insertId,
              effective_time: effectiveTime,
              expiry_time: expiryTime,
              commission_amount: commissionAmount
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
        
      } catch (salesError) {
        debugInfo.errors.push(`销售链接查询失败: ${salesError.message}`);
        debugInfo.steps.push('销售链接查询失败');
        console.error('❌ 销售链接查询失败:', salesError);
        
        await connection.end();
        return res.status(500).json({
          success: false,
          message: '销售链接查询失败',
          error: salesError.message,
          debug: debugInfo
        });
      }
      
    } else {
      debugInfo.errors.push(`不支持的请求: ${req.method} ${path}`);
      await connection.end();
      return res.status(404).json({
        success: false,
        message: `路径不存在: ${req.method} ${path || 'default'}`,
        debug: debugInfo
      });
    }
    
  } catch (error) {
    console.error('❌ 订单API调试失败:', error);
    res.status(500).json({
      success: false,
      message: '订单API调试失败',
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
  }
}; 