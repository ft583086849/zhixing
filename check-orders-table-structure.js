const mysql = require('mysql2/promise');

(async () => {
  const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 3306,
    ssl: { rejectUnauthorized: false }
  };

  try {
    const connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.execute('SHOW CREATE TABLE orders');
    console.log('--- orders表结构 ---');
    console.log(rows[0]['Create Table']);
    const [descRows] = await connection.execute('DESCRIBE orders');
    console.log('\n--- 字段类型 ---');
    descRows.forEach(row => {
      console.log(`${row.Field}: ${row.Type}`);
    });
    await connection.end();
  } catch (error) {
    console.error('查询orders表结构失败:', error.message);
  }
})();