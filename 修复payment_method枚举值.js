// 修复 payment_method 枚举值统一问题
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

async function fixPaymentMethodEnum() {
  let connection;
  
  try {
    console.log('🔧 开始修复 payment_method 枚举值...\n');
    
    connection = await mysql.createConnection(dbConfig);
    
    // 1. 检查当前 primary_sales 表结构
    console.log('1️⃣ 检查 primary_sales 表当前结构...');
    
    const [primaryColumns] = await connection.execute(`
      SHOW COLUMNS FROM primary_sales WHERE Field = 'payment_method'
    `);
    
    if (primaryColumns.length > 0) {
      console.log(`   当前 primary_sales.payment_method: ${primaryColumns[0].Type}`);
    } else {
      console.log('   ❌ primary_sales.payment_method 字段不存在');
    }
    
    // 2. 检查当前 secondary_sales 表结构
    console.log('\n2️⃣ 检查 secondary_sales 表当前结构...');
    
    const [secondaryColumns] = await connection.execute(`
      SHOW COLUMNS FROM secondary_sales WHERE Field = 'payment_method'
    `);
    
    if (secondaryColumns.length > 0) {
      console.log(`   当前 secondary_sales.payment_method: ${secondaryColumns[0].Type}`);
    } else {
      console.log('   ❌ secondary_sales.payment_method 字段不存在');
    }
    
    // 3. 修复 primary_sales 表
    console.log('\n3️⃣ 修复 primary_sales 表 payment_method 字段...');
    
    try {
      await connection.execute(`
        ALTER TABLE primary_sales 
        MODIFY COLUMN payment_method ENUM('alipay', 'crypto') DEFAULT 'alipay' 
        COMMENT '收款方式：alipay=支付宝，crypto=线上地址码'
      `);
      console.log('   ✅ primary_sales.payment_method 修复成功');
    } catch (error) {
      console.log(`   ❌ primary_sales.payment_method 修复失败: ${error.message}`);
      
      // 如果字段不存在，则添加
      if (error.code === 'ER_BAD_FIELD_ERROR') {
        try {
          await connection.execute(`
            ALTER TABLE primary_sales 
            ADD COLUMN payment_method ENUM('alipay', 'crypto') DEFAULT 'alipay' 
            COMMENT '收款方式：alipay=支付宝，crypto=线上地址码'
          `);
          console.log('   ✅ primary_sales.payment_method 字段添加成功');
        } catch (addError) {
          console.log(`   ❌ primary_sales.payment_method 字段添加失败: ${addError.message}`);
        }
      }
    }
    
    // 4. 修复 secondary_sales 表
    console.log('\n4️⃣ 修复 secondary_sales 表 payment_method 字段...');
    
    try {
      await connection.execute(`
        ALTER TABLE secondary_sales 
        MODIFY COLUMN payment_method ENUM('alipay', 'crypto') DEFAULT 'alipay' 
        COMMENT '收款方式：alipay=支付宝，crypto=线上地址码'
      `);
      console.log('   ✅ secondary_sales.payment_method 修复成功');
    } catch (error) {
      console.log(`   ❌ secondary_sales.payment_method 修复失败: ${error.message}`);
      
      // 如果字段不存在，则添加
      if (error.code === 'ER_BAD_FIELD_ERROR') {
        try {
          await connection.execute(`
            ALTER TABLE secondary_sales 
            ADD COLUMN payment_method ENUM('alipay', 'crypto') DEFAULT 'alipay' 
            COMMENT '收款方式：alipay=支付宝，crypto=线上地址码'
          `);
          console.log('   ✅ secondary_sales.payment_method 字段添加成功');
        } catch (addError) {
          console.log(`   ❌ secondary_sales.payment_method 字段添加失败: ${addError.message}`);
        }
      }
    }
    
    // 5. 验证修复结果
    console.log('\n5️⃣ 验证修复结果...');
    
    const [primaryUpdated] = await connection.execute(`
      SHOW COLUMNS FROM primary_sales WHERE Field = 'payment_method'
    `);
    
    const [secondaryUpdated] = await connection.execute(`
      SHOW COLUMNS FROM secondary_sales WHERE Field = 'payment_method'
    `);
    
    console.log(`   primary_sales.payment_method: ${primaryUpdated[0]?.Type || '不存在'}`);
    console.log(`   secondary_sales.payment_method: ${secondaryUpdated[0]?.Type || '不存在'}`);
    
    // 6. 测试修复后的API
    console.log('\n6️⃣ 准备测试修复后的API...');
    console.log('   现在可以使用以下值进行测试:');
    console.log('   - alipay: 支付宝收款');
    console.log('   - crypto: 线上地址码收款');
    
    console.log('\n🎉 payment_method 枚举值修复完成！');
    
  } catch (error) {
    console.error('❌ 修复过程中发生错误:', error);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// 执行修复
if (require.main === module) {
  fixPaymentMethodEnum().catch(console.error);
}

module.exports = { fixPaymentMethodEnum };