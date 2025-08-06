// 独立的数据库修复API端点
const mysql = require('mysql2/promise');

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

export default async function handler(req, res) {
  // 设置CORS头部
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  // 处理OPTIONS预检请求
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      message: 'Method not allowed'
    });
  }

  let connection;
  
  try {
    console.log('🔧 开始执行数据库修复...');
    
    connection = await mysql.createConnection(dbConfig);
    
    const fixResults = [];
    
    // 1. 修复 secondary_sales.primary_sales_id 字段允许NULL
    console.log('1️⃣ 修复 secondary_sales.primary_sales_id 字段...');
    
    try {
      await connection.execute(`
        ALTER TABLE secondary_sales 
        MODIFY COLUMN primary_sales_id INT NULL 
        COMMENT '一级销售ID，独立注册时为NULL'
      `);
      fixResults.push({ 
        field: 'secondary_sales.primary_sales_id', 
        status: 'success', 
        message: '已修复为允许NULL' 
      });
      console.log('✅ secondary_sales.primary_sales_id修复成功');
    } catch (error) {
      fixResults.push({ 
        field: 'secondary_sales.primary_sales_id', 
        status: 'error', 
        message: error.message 
      });
      console.log('❌ secondary_sales.primary_sales_id修复失败:', error.message);
    }
    
    // 2. 确保 payment_method 字段枚举值正确
    console.log('2️⃣ 确保 payment_method 字段枚举值...');
    
    try {
      await connection.execute(`
        ALTER TABLE secondary_sales 
        MODIFY COLUMN payment_method ENUM('alipay', 'crypto') DEFAULT 'alipay' 
        COMMENT '收款方式：alipay=支付宝，crypto=线上地址码'
      `);
      fixResults.push({ 
        field: 'secondary_sales.payment_method', 
        status: 'success', 
        message: '枚举值已更新' 
      });
      console.log('✅ secondary_sales.payment_method修复成功');
    } catch (error) {
      fixResults.push({ 
        field: 'secondary_sales.payment_method', 
        status: 'error', 
        message: error.message 
      });
      console.log('❌ secondary_sales.payment_method修复失败:', error.message);
    }
    
    // 3. 检查表结构
    console.log('3️⃣ 检查当前表结构...');
    
    const [columns] = await connection.execute(`
      SHOW COLUMNS FROM secondary_sales WHERE Field IN ('primary_sales_id', 'payment_method')
    `);
    
    const tableStructure = {};
    columns.forEach(col => {
      tableStructure[col.Field] = {
        type: col.Type,
        null: col.Null,
        default: col.Default
      };
    });
    
    // 4. 测试插入操作
    console.log('4️⃣ 测试插入操作...');
    
    const testData = {
      wechat_name: 'db_fix_test_' + Date.now(),
      primary_sales_id: null, // 测试NULL值
      payment_method: 'alipay',
      payment_address: 'test123',
      alipay_surname: '测试',
      commission_rate: 30.00,
      sales_code: `SS${Date.now().toString(36).slice(-8).toUpperCase()}`
    };
    
    let insertTest = { status: 'failed', message: '未执行' };
    
    try {
      const [result] = await connection.execute(`
        INSERT INTO secondary_sales (
          wechat_name, primary_sales_id, payment_method, payment_address, 
          alipay_surname, commission_rate, sales_code
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [
        testData.wechat_name,
        testData.primary_sales_id,
        testData.payment_method,
        testData.payment_address,
        testData.alipay_surname,
        testData.commission_rate,
        testData.sales_code
      ]);
      
      insertTest = { 
        status: 'success', 
        message: '插入成功',
        insertId: result.insertId 
      };
      console.log('✅ 测试插入成功，ID:', result.insertId);
      
      // 清理测试数据
      await connection.execute('DELETE FROM secondary_sales WHERE id = ?', [result.insertId]);
      console.log('🗑️ 测试数据已清理');
      
    } catch (error) {
      insertTest = { 
        status: 'failed', 
        message: error.message 
      };
      console.log('❌ 测试插入失败:', error.message);
    }
    
    // 返回修复结果
    res.status(200).json({
      success: true,
      message: '数据库修复完成',
      data: {
        fixes: fixResults,
        tableStructure: tableStructure,
        insertTest: insertTest,
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('❌ 数据库修复过程出错:', error);
    res.status(500).json({
      success: false,
      message: '数据库修复失败',
      error: {
        message: error.message,
        code: error.code
      }
    });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}