// 直接连接数据库执行字段添加
const mysql = require('mysql2/promise');

// 从环境变量获取数据库配置
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

async function addDatabaseFields() {
  let connection;
  try {
    console.log('🔧 开始数据库字段修复...');
    console.log('🔍 数据库配置检查:');
    console.log('  Host:', process.env.DB_HOST ? '✅' : '❌ 缺失');
    console.log('  User:', process.env.DB_USER ? '✅' : '❌ 缺失');
    console.log('  Password:', process.env.DB_PASSWORD ? '✅' : '❌ 缺失');
    console.log('  Database:', process.env.DB_NAME ? '✅' : '❌ 缺失');
    console.log('');

    if (!process.env.DB_HOST || !process.env.DB_USER || !process.env.DB_PASSWORD || !process.env.DB_NAME) {
      throw new Error('数据库环境变量缺失');
    }

    console.log('🔌 连接数据库...');
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ 数据库连接成功');
    console.log('');

    // 检查primary_sales表结构
    console.log('🔍 检查primary_sales表当前结构...');
    const [columns] = await connection.execute('SHOW COLUMNS FROM primary_sales');
    const existingColumns = columns.map(col => col.Field);
    console.log('📋 现有字段:', existingColumns.join(', '));
    console.log('');

    // 1. 添加sales_code字段
    if (!existingColumns.includes('sales_code')) {
      console.log('➕ 添加primary_sales.sales_code字段...');
      await connection.execute(`
        ALTER TABLE primary_sales 
        ADD COLUMN sales_code VARCHAR(16) UNIQUE 
        COMMENT '用户购买时使用的销售代码'
      `);
      console.log('✅ sales_code字段添加成功');
    } else {
      console.log('ℹ️  sales_code字段已存在');
    }

    // 2. 添加secondary_registration_code字段
    if (!existingColumns.includes('secondary_registration_code')) {
      console.log('➕ 添加primary_sales.secondary_registration_code字段...');
      await connection.execute(`
        ALTER TABLE primary_sales 
        ADD COLUMN secondary_registration_code VARCHAR(16) UNIQUE 
        COMMENT '二级销售注册时使用的代码'
      `);
      console.log('✅ secondary_registration_code字段添加成功');
    } else {
      console.log('ℹ️  secondary_registration_code字段已存在');
    }

    // 3. 检查secondary_sales表并添加字段
    console.log('');
    console.log('🔍 检查secondary_sales表...');
    try {
      const [secColumns] = await connection.execute('SHOW COLUMNS FROM secondary_sales');
      const secExistingColumns = secColumns.map(col => col.Field);
      console.log('📋 secondary_sales现有字段:', secExistingColumns.join(', '));

      if (!secExistingColumns.includes('sales_code')) {
        console.log('➕ 添加secondary_sales.sales_code字段...');
        await connection.execute(`
          ALTER TABLE secondary_sales 
          ADD COLUMN sales_code VARCHAR(16) UNIQUE 
          COMMENT '用户购买时使用的销售代码'
        `);
        console.log('✅ secondary_sales.sales_code字段添加成功');
      } else {
        console.log('ℹ️  secondary_sales.sales_code字段已存在');
      }
    } catch (error) {
      console.log('⚠️  secondary_sales表不存在或无法访问，跳过...');
    }

    // 4. 为现有记录生成sales_code
    console.log('');
    console.log('🔄 为现有primary_sales记录生成sales_code...');
    const [needsCode] = await connection.execute(
      'SELECT id, wechat_name FROM primary_sales WHERE sales_code IS NULL OR sales_code = ""'
    );

    if (needsCode.length > 0) {
      console.log(`📝 发现${needsCode.length}条记录需要生成sales_code`);
      for (const record of needsCode) {
        // 生成16位随机代码
        const salesCode = Math.random().toString(36).substr(2, 16).padEnd(16, Math.random().toString(36).substr(2, 1));
        
        await connection.execute(
          'UPDATE primary_sales SET sales_code = ? WHERE id = ?',
          [salesCode, record.id]
        );
        console.log(`  ✅ ${record.wechat_name} -> ${salesCode}`);
      }
    } else {
      console.log('ℹ️  所有记录都已有sales_code');
    }

    // 5. 为现有记录生成secondary_registration_code
    console.log('');
    console.log('🔄 为现有primary_sales记录生成secondary_registration_code...');
    const [needsRegCode] = await connection.execute(
      'SELECT id, wechat_name FROM primary_sales WHERE secondary_registration_code IS NULL OR secondary_registration_code = ""'
    );

    if (needsRegCode.length > 0) {
      console.log(`📝 发现${needsRegCode.length}条记录需要生成secondary_registration_code`);
      for (const record of needsRegCode) {
        // 生成16位随机注册代码
        const regCode = Math.random().toString(36).substr(2, 16).padEnd(16, Math.random().toString(36).substr(2, 1));
        
        await connection.execute(
          'UPDATE primary_sales SET secondary_registration_code = ? WHERE id = ?',
          [regCode, record.id]
        );
        console.log(`  ✅ ${record.wechat_name} -> ${regCode}`);
      }
    } else {
      console.log('ℹ️  所有记录都已有secondary_registration_code');
    }

    // 6. 验证最终结果
    console.log('');
    console.log('🔍 验证修复结果...');
    const [finalColumns] = await connection.execute('SHOW COLUMNS FROM primary_sales');
    
    console.log('📋 修复后的primary_sales表结构:');
    finalColumns.forEach(col => {
      const isNew = ['sales_code', 'secondary_registration_code'].includes(col.Field);
      console.log(`  ${isNew ? '🆕' : '  '} ${col.Field} (${col.Type}) ${col.Key ? '[' + col.Key + ']' : ''}`);
    });

    console.log('');
    console.log('🎉 数据库字段修复完成！');
    console.log('');
    console.log('✅ 修复内容总结:');
    console.log('  1. ✅ primary_sales.sales_code 字段');
    console.log('  2. ✅ primary_sales.secondary_registration_code 字段');
    console.log('  3. ✅ secondary_sales.sales_code 字段（如果表存在）');
    console.log('  4. ✅ 为现有记录生成唯一代码');
    console.log('');
    console.log('🚀 现在可以正常使用：');
    console.log('  - 用户购买页面订单创建');
    console.log('  - 销售代码统一查找标准');
    console.log('  - 二级销售注册流程');

  } catch (error) {
    console.error('❌ 数据库字段修复失败:');
    console.error('🔍 错误信息:', error.message);
    console.error('📋 错误详情:', error);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 数据库连接已关闭');
    }
  }
}

// 执行修复
addDatabaseFields().catch(console.error);