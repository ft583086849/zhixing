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

async function checkDatabaseTables() {
  let connection;
  
  try {
    console.log('🔍 检查数据库表结构...');
    
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ 数据库连接成功');
    
    // 检查 primary_sales 表
    try {
      const [primarySalesResult] = await connection.execute('SHOW TABLES LIKE "primary_sales"');
      if (primarySalesResult.length > 0) {
        console.log('✅ primary_sales 表存在');
        
        // 检查表结构
        const [columns] = await connection.execute('DESCRIBE primary_sales');
        console.log('📋 primary_sales 表结构:');
        columns.forEach(col => {
          console.log(`   - ${col.Field}: ${col.Type} ${col.Null === 'YES' ? 'NULL' : 'NOT NULL'}`);
        });
      } else {
        console.log('❌ primary_sales 表不存在');
      }
    } catch (error) {
      console.log('❌ 检查 primary_sales 表失败:', error.message);
    }
    
    // 检查 secondary_sales 表
    try {
      const [secondarySalesResult] = await connection.execute('SHOW TABLES LIKE "secondary_sales"');
      if (secondarySalesResult.length > 0) {
        console.log('✅ secondary_sales 表存在');
        
        // 检查表结构
        const [columns] = await connection.execute('DESCRIBE secondary_sales');
        console.log('📋 secondary_sales 表结构:');
        columns.forEach(col => {
          console.log(`   - ${col.Field}: ${col.Type} ${col.Null === 'YES' ? 'NULL' : 'NOT NULL'}`);
        });
      } else {
        console.log('❌ secondary_sales 表不存在');
      }
    } catch (error) {
      console.log('❌ 检查 secondary_sales 表失败:', error.message);
    }
    
    // 检查 sales_hierarchy 表
    try {
      const [salesHierarchyResult] = await connection.execute('SHOW TABLES LIKE "sales_hierarchy"');
      if (salesHierarchyResult.length > 0) {
        console.log('✅ sales_hierarchy 表存在');
      } else {
        console.log('❌ sales_hierarchy 表不存在');
      }
    } catch (error) {
      console.log('❌ 检查 sales_hierarchy 表失败:', error.message);
    }
    
    // 检查所有表
    const [allTables] = await connection.execute('SHOW TABLES');
    console.log('\n📊 数据库中的所有表:');
    allTables.forEach(table => {
      const tableName = Object.values(table)[0];
      console.log(`   - ${tableName}`);
    });
    
  } catch (error) {
    console.log('❌ 数据库连接失败:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

checkDatabaseTables(); 