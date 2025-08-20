const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcrypt');

const supabaseUrl = 'https://itwpzsmqdxfluhfqsnwr.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0d3B6c21xZHhmbHVoZnFzbndyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ0Mzk2NDksImV4cCI6MjA1MDAxNTY0OX0.6sFI8OTcrP0ErjLs3XIRNeQnGeWH97xygILqfI6NWGI';
const supabase = createClient(supabaseUrl, supabaseKey);

async function createAdminAccount() {
  try {
    // 检查是否已有管理员
    const { data: existingAdmins } = await supabase
      .from('admins')
      .select('*')
      .limit(1);
    
    if (existingAdmins && existingAdmins.length > 0) {
      console.log('已存在管理员账号:');
      console.log('用户名:', existingAdmins[0].username);
      console.log('');
      console.log('请访问: http://localhost:3000/admin/login');
      console.log('用户名:', existingAdmins[0].username);
      console.log('密码: admin123');
      return;
    }
    
    // 创建新管理员
    const username = 'admin';
    const password = 'admin123';
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const { data, error } = await supabase
      .from('admins')
      .insert([{
        username: username,
        password_hash: hashedPassword,
        role: 'admin',
        created_at: new Date().toISOString()
      }])
      .select();
    
    if (error) {
      console.error('创建管理员失败:', error);
      return;
    }
    
    console.log('✅ 管理员账号创建成功!');
    console.log('用户名:', username);
    console.log('密码:', password);
    console.log('');
    console.log('请访问: http://localhost:3000/admin/login');
    
  } catch (error) {
    console.error('创建管理员出错:', error);
  }
}

createAdminAccount();