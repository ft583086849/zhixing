/**
 * 创建管理员账户
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ksacrjrgmcbdwwjrkcws.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtzYWNyanJnbWNiZHd3anJrY3dzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDk4OTk4MDMsImV4cCI6MjAyNTQ3NTgwM30.tHBHWNjBQ3A3JJSZ3tVE_RGkP_YfzJJ2rjQjhQZhRZ8';

const supabase = createClient(supabaseUrl, supabaseKey);

async function createAdmin() {
  try {
    console.log('📝 创建管理员账户...\n');

    // 模拟密码哈希 (在真实环境中应该使用bcrypt)
    const passwordHash = 'admin123'; // 简化处理

    const adminData = {
      username: 'admin',
      password_hash: passwordHash,
      email: 'admin@example.com',
      is_active: true,
      created_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('admins')
      .insert([adminData])
      .select();
    
    if (error) {
      console.error('❌ 创建失败:', error.message);
      return;
    }

    console.log('✅ 管理员账户创建成功!');
    console.log('登录信息:');
    console.log('用户名: admin');
    console.log('密码: admin123');
    console.log('');

  } catch (error) {
    console.error('❌ 创建管理员账户失败:', error);
  }
}

// 运行创建
createAdmin();