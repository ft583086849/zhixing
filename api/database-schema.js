// Vercel Serverless Function - 数据库Schema管理API
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

  // 只允许POST请求
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      message: '只允许POST请求'
    });
  }

  let connection;
  try {
    console.log('🔧 开始数据库Schema修复...');
    connection = await mysql.createConnection(dbConfig);
    
    const { action } = req.body;
    
    if (action === 'add_sales_code_fields') {
      return await addSalesCodeFields(connection, res);
    } else if (action === 'check_schema') {
      return await checkCurrentSchema(connection, res);
    } else {
      return res.status(400).json({
        success: false,
        message: '未知的操作类型'
      });
    }

  } catch (error) {
    console.error('❌ Schema管理失败:', error);
    return res.status(500).json({
      success: false,
      message: 'Schema管理失败',
      error: error.message
    });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// 检查当前数据库schema
async function checkCurrentSchema(connection, res) {
  try {
    console.log('🔍 检查primary_sales表结构...');
    
    const [columns] = await connection.execute('SHOW COLUMNS FROM primary_sales');
    const existingColumns = columns.map(col => col.Field);
    
    console.log('📋 现有字段:', existingColumns.join(', '));
    
    const needsFields = {
      sales_code: !existingColumns.includes('sales_code'),
      secondary_registration_code: !existingColumns.includes('secondary_registration_code')
    };
    
    // 检查secondary_sales表
    let secondaryNeedsFields = { sales_code: false };
    try {
      const [secColumns] = await connection.execute('SHOW COLUMNS FROM secondary_sales');
      const secExistingColumns = secColumns.map(col => col.Field);
      secondaryNeedsFields.sales_code = !secExistingColumns.includes('sales_code');
    } catch (error) {
      console.log('⚠️  secondary_sales表不存在');
    }
    
    return res.status(200).json({
      success: true,
      data: {
        primary_sales: {
          existing_columns: existingColumns,
          needs_fields: needsFields
        },
        secondary_sales: {
          needs_fields: secondaryNeedsFields
        },
        ready_for_fix: needsFields.sales_code || needsFields.secondary_registration_code
      }
    });
  } catch (error) {
    throw error;
  }
}

// 添加销售代码字段
async function addSalesCodeFields(connection, res) {
  try {
    const results = [];
    
    // 1. 检查并添加primary_sales.sales_code
    console.log('1️⃣ 检查primary_sales.sales_code字段...');
    try {
      const [columns] = await connection.execute('SHOW COLUMNS FROM primary_sales');
      const existingColumns = columns.map(col => col.Field);
      
      if (!existingColumns.includes('sales_code')) {
        console.log('➕ 添加sales_code字段...');
        await connection.execute(`
          ALTER TABLE primary_sales 
          ADD COLUMN sales_code VARCHAR(16) UNIQUE 
          COMMENT '用户购买时使用的销售代码'
        `);
        console.log('✅ sales_code字段添加成功');
        results.push({ field: 'primary_sales.sales_code', status: 'added' });
      } else {
        console.log('ℹ️  sales_code字段已存在');
        results.push({ field: 'primary_sales.sales_code', status: 'exists' });
      }
    } catch (error) {
      console.error('❌ 添加sales_code字段失败:', error.message);
      results.push({ field: 'primary_sales.sales_code', status: 'failed', error: error.message });
    }

    // 2. 检查并添加primary_sales.secondary_registration_code
    console.log('2️⃣ 检查primary_sales.secondary_registration_code字段...');
    try {
      await connection.execute(`
        ALTER TABLE primary_sales 
        ADD COLUMN secondary_registration_code VARCHAR(16) UNIQUE 
        COMMENT '二级销售注册时使用的代码'
      `);
      console.log('✅ secondary_registration_code字段添加成功');
      results.push({ field: 'primary_sales.secondary_registration_code', status: 'added' });
    } catch (error) {
      if (error.message.includes('Duplicate column name')) {
        console.log('ℹ️  secondary_registration_code字段已存在');
        results.push({ field: 'primary_sales.secondary_registration_code', status: 'exists' });
      } else {
        console.error('❌ 添加secondary_registration_code字段失败:', error.message);
        results.push({ field: 'primary_sales.secondary_registration_code', status: 'failed', error: error.message });
      }
    }

    // 3. 检查并添加secondary_sales.sales_code
    console.log('3️⃣ 检查secondary_sales.sales_code字段...');
    try {
      await connection.execute(`
        ALTER TABLE secondary_sales 
        ADD COLUMN sales_code VARCHAR(16) UNIQUE 
        COMMENT '用户购买时使用的销售代码'
      `);
      console.log('✅ secondary_sales.sales_code字段添加成功');
      results.push({ field: 'secondary_sales.sales_code', status: 'added' });
    } catch (error) {
      if (error.message.includes('Duplicate column name')) {
        console.log('ℹ️  secondary_sales.sales_code字段已存在');
        results.push({ field: 'secondary_sales.sales_code', status: 'exists' });
      } else if (error.message.includes("doesn't exist")) {
        console.log('⚠️  secondary_sales表不存在，跳过');
        results.push({ field: 'secondary_sales.sales_code', status: 'table_not_exists' });
      } else {
        console.error('❌ 添加secondary_sales.sales_code字段失败:', error.message);
        results.push({ field: 'secondary_sales.sales_code', status: 'failed', error: error.message });
      }
    }

    // 4. 为现有记录生成sales_code
    console.log('4️⃣ 为现有primary_sales记录生成sales_code...');
    try {
      const [needsCode] = await connection.execute(
        'SELECT id, wechat_name FROM primary_sales WHERE sales_code IS NULL OR sales_code = ""'
      );

      if (needsCode.length > 0) {
        console.log(`📝 发现${needsCode.length}条记录需要生成sales_code`);
        
        const updateResults = [];
        for (const record of needsCode) {
          // 生成16位随机代码
          const salesCode = Math.random().toString(36).substr(2, 16).padEnd(16, Math.random().toString(36).substr(2, 1));
          
          await connection.execute(
            'UPDATE primary_sales SET sales_code = ? WHERE id = ?',
            [salesCode, record.id]
          );
          console.log(`  ✅ ${record.wechat_name} -> ${salesCode}`);
          updateResults.push({ id: record.id, wechat_name: record.wechat_name, sales_code: salesCode });
        }
        results.push({ field: 'primary_sales.sales_code_generation', status: 'completed', updated: updateResults });
      } else {
        console.log('ℹ️  所有记录都已有sales_code');
        results.push({ field: 'primary_sales.sales_code_generation', status: 'not_needed' });
      }
    } catch (error) {
      console.error('❌ 生成sales_code失败:', error.message);
      results.push({ field: 'primary_sales.sales_code_generation', status: 'failed', error: error.message });
    }

    // 5. 为现有记录生成secondary_registration_code
    console.log('5️⃣ 为现有primary_sales记录生成secondary_registration_code...');
    try {
      const [needsRegCode] = await connection.execute(
        'SELECT id, wechat_name FROM primary_sales WHERE secondary_registration_code IS NULL OR secondary_registration_code = ""'
      );

      if (needsRegCode.length > 0) {
        console.log(`📝 发现${needsRegCode.length}条记录需要生成secondary_registration_code`);
        
        const updateResults = [];
        for (const record of needsRegCode) {
          // 生成16位随机注册代码
          const regCode = Math.random().toString(36).substr(2, 16).padEnd(16, Math.random().toString(36).substr(2, 1));
          
          await connection.execute(
            'UPDATE primary_sales SET secondary_registration_code = ? WHERE id = ?',
            [regCode, record.id]
          );
          console.log(`  ✅ ${record.wechat_name} -> ${regCode}`);
          updateResults.push({ id: record.id, wechat_name: record.wechat_name, secondary_registration_code: regCode });
        }
        results.push({ field: 'primary_sales.secondary_registration_code_generation', status: 'completed', updated: updateResults });
      } else {
        console.log('ℹ️  所有记录都已有secondary_registration_code');
        results.push({ field: 'primary_sales.secondary_registration_code_generation', status: 'not_needed' });
      }
    } catch (error) {
      console.error('❌ 生成secondary_registration_code失败:', error.message);
      results.push({ field: 'primary_sales.secondary_registration_code_generation', status: 'failed', error: error.message });
    }

    // 6. 验证最终结果
    console.log('6️⃣ 验证修复结果...');
    const [finalColumns] = await connection.execute('SHOW COLUMNS FROM primary_sales');
    const finalColumnNames = finalColumns.map(col => col.Field);
    
    const isSuccess = finalColumnNames.includes('sales_code') && finalColumnNames.includes('secondary_registration_code');
    
    console.log('🎉 Schema修复完成！');
    
    return res.status(200).json({
      success: true,
      message: '数据库Schema修复完成',
      data: {
        results: results,
        final_columns: finalColumnNames,
        has_required_fields: isSuccess,
        summary: {
          sales_code_added: results.find(r => r.field === 'primary_sales.sales_code')?.status,
          secondary_registration_code_added: results.find(r => r.field === 'primary_sales.secondary_registration_code')?.status,
          ready_for_use: isSuccess
        }
      }
    });

  } catch (error) {
    throw error;
  }
}