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

async function checkDatabaseTables() {
  console.log('🔍 检查数据库表结构...\n');
  
  try {
    const connection = await mysql.createConnection(dbConfig);
    console.log('✅ 数据库连接成功');
    
    // 检查sales表
    console.log('\n📋 检查sales表...');
    try {
      const [salesRows] = await connection.execute('DESCRIBE sales');
      console.log('✅ sales表存在');
      console.log('📊 表结构:');
      salesRows.forEach(row => {
        console.log(`  - ${row.Field}: ${row.Type} ${row.Null === 'NO' ? 'NOT NULL' : 'NULL'} ${row.Key === 'PRI' ? 'PRIMARY KEY' : ''}`);
      });
    } catch (error) {
      console.log('❌ sales表不存在:', error.message);
    }
    
    // 检查orders表
    console.log('\n📋 检查orders表...');
    try {
      const [ordersRows] = await connection.execute('DESCRIBE orders');
      console.log('✅ orders表存在');
      console.log('📊 表结构:');
      ordersRows.forEach(row => {
        console.log(`  - ${row.Field}: ${row.Type} ${row.Null === 'NO' ? 'NOT NULL' : 'NULL'} ${row.Key === 'PRI' ? 'PRIMARY KEY' : ''}`);
      });
    } catch (error) {
      console.log('❌ orders表不存在:', error.message);
    }
    
    // 检查admins表
    console.log('\n📋 检查admins表...');
    try {
      const [adminsRows] = await connection.execute('DESCRIBE admins');
      console.log('✅ admins表存在');
    } catch (error) {
      console.log('❌ admins表不存在:', error.message);
    }
    
    // 检查system_config表
    console.log('\n📋 检查system_config表...');
    try {
      const [configRows] = await connection.execute('DESCRIBE system_config');
      console.log('✅ system_config表存在');
    } catch (error) {
      console.log('❌ system_config表不存在:', error.message);
    }
    
    // 检查lifetime_limit表
    console.log('\n📋 检查lifetime_limit表...');
    try {
      const [limitRows] = await connection.execute('DESCRIBE lifetime_limit');
      console.log('✅ lifetime_limit表存在');
    } catch (error) {
      console.log('❌ lifetime_limit表不存在:', error.message);
    }
    
    // 检查sales表中的数据
    console.log('\n📋 检查sales表数据...');
    try {
      const [salesData] = await connection.execute('SELECT COUNT(*) as count FROM sales');
      console.log(`📊 sales表中有 ${salesData[0].count} 条记录`);
      
      if (salesData[0].count > 0) {
        const [recentSales] = await connection.execute('SELECT * FROM sales ORDER BY created_at DESC LIMIT 3');
        console.log('📊 最近的销售记录:');
        recentSales.forEach((sale, index) => {
          console.log(`  ${index + 1}. ${sale.wechat_name} - ${sale.payment_method} - ${sale.link_code}`);
        });
      }
    } catch (error) {
      console.log('❌ 查询sales表数据失败:', error.message);
    }
    
    await connection.end();
    console.log('\n✅ 数据库检查完成');
    
  } catch (error) {
    console.error('❌ 数据库连接失败:', error.message);
  }
}

// 运行检查
checkDatabaseTables().catch(console.error); 