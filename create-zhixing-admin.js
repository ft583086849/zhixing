// 创建知行管理员账号脚本
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

async function createZhixingAdmin() {
  try {
    console.log('🔧 开始检查并创建知行管理员账号...');
    
    const connection = await mysql.createConnection(dbConfig);
    
    // 检查是否已存在知行管理员账号
    const [existingAdmins] = await connection.execute(
      'SELECT * FROM admins WHERE username = ?',
      ['知行']
    );
    
    if (existingAdmins.length > 0) {
      console.log('✅ 知行管理员账号已存在');
      console.log('用户名: 知行');
      console.log('密码: Zhixing Universal Trading Signal');
      await connection.end();
      return;
    }
    
    // 创建知行管理员账号
    const username = '知行';
    const password = 'Zhixing Universal Trading Signal';
    const hashedPassword = await bcrypt.hash(password, 10);
    
    await connection.execute(
      'INSERT INTO admins (username, password_hash, created_at) VALUES (?, ?, NOW())',
      [username, hashedPassword]
    );
    
    console.log('✅ 知行管理员账号创建成功！');
    console.log('用户名: 知行');
    console.log('密码: Zhixing Universal Trading Signal');
    console.log('请使用此账号登录管理员系统');
    
    await connection.end();
    
  } catch (error) {
    console.error('❌ 创建知行管理员账号失败:', error.message);
    console.error('错误详情:', error);
  }
}

// 运行脚本
if (require.main === module) {
  createZhixingAdmin();
}

module.exports = createZhixingAdmin; 