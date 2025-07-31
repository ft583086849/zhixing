// 创建管理员账号脚本
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

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

async function createAdminAccount() {
  try {
    console.log('🔧 开始创建管理员账号...');
    
    const connection = await mysql.createConnection(dbConfig);
    
    // 检查是否已存在管理员账号
    const [existingAdmins] = await connection.execute(
      'SELECT * FROM admins WHERE username = ?',
      ['admin']
    );
    
    if (existingAdmins.length > 0) {
      console.log('✅ 管理员账号已存在');
      console.log('用户名: admin');
      console.log('密码: admin123');
      await connection.end();
      return;
    }
    
    // 创建管理员账号
    const username = 'admin';
    const password = 'admin123';
    const hashedPassword = await bcrypt.hash(password, 10);
    
    await connection.execute(
      'INSERT INTO admins (username, password_hash, created_at) VALUES (?, ?, NOW())',
      [username, hashedPassword]
    );
    
    console.log('✅ 管理员账号创建成功！');
    console.log('用户名: admin');
    console.log('密码: admin123');
    console.log('请使用此账号登录管理员系统');
    
    await connection.end();
    
  } catch (error) {
    console.error('❌ 创建管理员账号失败:', error.message);
  }
}

// 运行脚本
if (require.main === module) {
  createAdminAccount();
}

module.exports = createAdminAccount; 