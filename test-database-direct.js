const mysql = require('mysql2/promise');

// 使用Vercel环境中的数据库配置
const dbConfig = {
  host: 'aws.connect.psdb.cloud',  // PlanetScale默认主机
  user: 'ft583086849',             // 从debug-env看到的用户名长度
  password: 'pscale_pw_...',       // 需要实际密码
  database: 'zhixing',             // 从debug-env看到的数据库名长度
  port: 3306,
  ssl: {
    rejectUnauthorized: false
  }
};

async function testDatabaseDirect() {
  console.log('🔍 直接测试数据库连接...\n');
  
  try {
    console.log('📋 尝试连接数据库...');
    const connection = await mysql.createConnection(dbConfig);
    console.log('✅ 数据库连接成功！');
    
    // 检查数据库中的表
    console.log('\n📋 检查数据库中的表...');
    const [tables] = await connection.execute('SHOW TABLES');
    console.log('📊 数据库中的表:');
    tables.forEach(table => {
      const tableName = Object.values(table)[0];
      console.log(`  - ${tableName}`);
    });
    
    // 检查sales表结构
    if (tables.some(table => Object.values(table)[0] === 'sales')) {
      console.log('\n📋 检查sales表结构...');
      const [columns] = await connection.execute('DESCRIBE sales');
      console.log('📊 sales表结构:');
      columns.forEach(col => {
        console.log(`  - ${col.Field}: ${col.Type} ${col.Null === 'NO' ? 'NOT NULL' : 'NULL'}`);
      });
      
      // 尝试插入测试数据
      console.log('\n📋 尝试插入测试数据...');
      try {
        const testData = {
          wechat_name: '测试用户',
          payment_method: 'alipay',
          payment_address: 'test@alipay.com',
          alipay_surname: '张',
          chain_name: null,
          link_code: 'test123456789'
        };
        
        const [result] = await connection.execute(
          `INSERT INTO sales (wechat_name, payment_method, payment_address, alipay_surname, chain_name, link_code) 
           VALUES (?, ?, ?, ?, ?, ?)`,
          [testData.wechat_name, testData.payment_method, testData.payment_address, 
           testData.alipay_surname, testData.chain_name, testData.link_code]
        );
        
        console.log('✅ 测试数据插入成功！');
        console.log(`📊 插入ID: ${result.insertId}`);
        
        // 删除测试数据
        await connection.execute('DELETE FROM sales WHERE link_code = ?', [testData.link_code]);
        console.log('✅ 测试数据已清理');
        
      } catch (insertError) {
        console.log('❌ 插入测试数据失败:', insertError.message);
        console.log('📋 错误详情:', insertError);
      }
    } else {
      console.log('❌ sales表不存在！');
      
      // 尝试创建sales表
      console.log('\n📋 尝试创建sales表...');
      try {
        const createTableSQL = `
          CREATE TABLE sales (
            id INT AUTO_INCREMENT PRIMARY KEY,
            wechat_name VARCHAR(100) NOT NULL COMMENT '微信号',
            payment_method ENUM('alipay', 'crypto') NOT NULL COMMENT '收款方式',
            payment_address VARCHAR(500) NOT NULL COMMENT '收款地址',
            alipay_surname VARCHAR(10) DEFAULT NULL COMMENT '支付宝收款人姓氏',
            chain_name VARCHAR(50) DEFAULT NULL COMMENT '加密货币链名',
            link_code VARCHAR(100) UNIQUE NOT NULL COMMENT '唯一链接代码',
            total_orders INT DEFAULT 0 COMMENT '总订单数',
            total_revenue DECIMAL(10,2) DEFAULT 0.00 COMMENT '总收入',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_link_code (link_code),
            INDEX idx_wechat_name (wechat_name)
          ) COMMENT '销售员收款信息表'
        `;
        
        await connection.execute(createTableSQL);
        console.log('✅ sales表创建成功！');
        
      } catch (createError) {
        console.log('❌ 创建sales表失败:', createError.message);
        console.log('📋 错误详情:', createError);
      }
    }
    
    await connection.end();
    console.log('\n✅ 数据库测试完成');
    
  } catch (error) {
    console.error('❌ 数据库连接失败:', error.message);
    console.log('📋 错误详情:', error);
  }
}

// 运行测试
testDatabaseDirect().catch(console.error); 