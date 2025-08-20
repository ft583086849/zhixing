/**
 * 获取管理员登录信息
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://ksacrjrgmcbdwwjrkcws.supabase.co';
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtzYWNyanJnbWNiZHd3anJrY3dzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDk4OTk4MDMsImV4cCI6MjAyNTQ3NTgwM30.tHBHWNjBQ3A3JJSZ3tVE_RGkP_YfzJJ2rjQjhQZhRZ8';

const supabase = createClient(supabaseUrl, supabaseKey);

async function getAdminInfo() {
  try {
    console.log('📋 获取管理员登录信息...\n');

    // 查询管理员表
    const { data: admins, error } = await supabase
      .from('admins')
      .select('*');
    
    if (error) {
      console.error('查询失败:', error.message);
      return;
    }

    if (!admins || admins.length === 0) {
      console.log('❌ 没有找到管理员账户');
      return;
    }

    console.log('✅ 找到管理员账户:');
    admins.forEach(admin => {
      console.log(`用户名: ${admin.username}`);
      console.log(`邮箱: ${admin.email || '未设置'}`);
      console.log(`创建时间: ${admin.created_at}`);
      console.log(`是否激活: ${admin.is_active ? '是' : '否'}`);
      console.log('---');
    });

    console.log('\n💡 提示: 密码通常是 "admin123" 或 "123456"');
    console.log('如果忘记密码，请查看项目文档或联系开发者');

  } catch (error) {
    console.error('❌ 获取管理员信息失败:', error);
  }
}

// 运行查询
getAdminInfo();