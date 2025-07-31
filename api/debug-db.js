// Vercel Serverless Function - 数据库调试API
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
    console.log('🔍 开始数据库调试...');
    
    const connection = await mysql.createConnection(dbConfig);
    console.log('✅ 数据库连接成功');
    
    const debugInfo = {
      connection: 'success',
      database: process.env.DB_NAME,
      tables: [],
      salesTable: null,
      testInsert: null
    };
    
    // 检查所有表
    console.log('📋 检查数据库表...');
    const [tables] = await connection.execute('SHOW TABLES');
    debugInfo.tables = tables.map(table => Object.values(table)[0]);
    console.log('📊 找到表:', debugInfo.tables);
    
    // 检查sales表
    if (debugInfo.tables.includes('sales')) {
      console.log('📋 检查sales表结构...');
      const [columns] = await connection.execute('DESCRIBE sales');
      debugInfo.salesTable = {
        exists: true,
        columns: columns.map(col => ({
          field: col.Field,
          type: col.Type,
          null: col.Null,
          key: col.Key,
          default: col.Default
        }))
      };
      
      // 尝试插入测试数据
      console.log('📋 尝试插入测试数据...');
      try {
        const testData = {
          wechat_name: '调试测试用户',
          payment_method: 'alipay',
          payment_address: 'debug@test.com',
          alipay_surname: '调试',
          chain_name: null,
          link_code: 'debug_' + Date.now()
        };
        
        const [result] = await connection.execute(
          `INSERT INTO sales (wechat_name, payment_method, payment_address, alipay_surname, chain_name, link_code) 
           VALUES (?, ?, ?, ?, ?, ?)`,
          [testData.wechat_name, testData.payment_method, testData.payment_address, 
           testData.alipay_surname, testData.chain_name, testData.link_code]
        );
        
        debugInfo.testInsert = {
          success: true,
          insertId: result.insertId,
          message: '测试数据插入成功'
        };
        
        // 删除测试数据
        await connection.execute('DELETE FROM sales WHERE link_code = ?', [testData.link_code]);
        console.log('✅ 测试数据已清理');
        
      } catch (insertError) {
        debugInfo.testInsert = {
          success: false,
          error: insertError.message,
          code: insertError.code,
          sqlState: insertError.sqlState
        };
        console.log('❌ 插入测试失败:', insertError.message);
      }
    } else {
      debugInfo.salesTable = {
        exists: false,
        message: 'sales表不存在'
      };
      console.log('❌ sales表不存在');
    }
    
    await connection.end();
    
    res.json({
      success: true,
      message: '数据库调试完成',
      debug: debugInfo,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ 数据库调试失败:', error);
    res.status(500).json({
      success: false,
      message: '数据库调试失败',
      error: error.message,
      code: error.code,
      timestamp: new Date().toISOString()
    });
  }
}; 