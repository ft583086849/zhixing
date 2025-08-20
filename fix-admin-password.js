const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://itvmeamoqthfqtkpubdv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0dm1lYW1vcXRoZnF0a3B1YmR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0ODEyMzUsImV4cCI6MjA3MDA1NzIzNX0.ypBF3lJJTJtSPLEu1zWXqPorS-FDSZzRUy_0ge_Y-r0'
);

async function fixAdminPassword() {
  console.log('🔧 修复管理员密码...\n');
  
  try {
    // 1. 查看当前管理员
    console.log('1️⃣ 当前管理员账户:');
    const { data: admins } = await supabase
      .from('admins')
      .select('*');
    
    admins.forEach(admin => {
      console.log(`   ${admin.username}: "${admin.password_hash}"`);
    });
    
    // 2. 修复admin账户 - 改回明文密码（因为系统使用明文比较）
    console.log('\n2️⃣ 更新admin账户密码为明文...');
    const { error: updateError } = await supabase
      .from('admins')
      .update({ 
        password_hash: '123456',  // 使用明文密码
        role: 'super_admin'
      })
      .eq('username', 'admin');
    
    if (updateError) {
      console.error('❌ 更新失败:', updateError.message);
    } else {
      console.log('✅ admin账户已更新');
    }
    
    // 3. 验证更新
    console.log('\n3️⃣ 验证更新...');
    const { data: updatedAdmins } = await supabase
      .from('admins')
      .select('*');
    
    console.log('📋 更新后的管理员账户:');
    updatedAdmins.forEach(admin => {
      console.log(`   用户名: ${admin.username}`);
      console.log(`   密码: ${admin.password_hash}`);
      console.log(`   角色: ${admin.role}`);
      console.log('');
    });
    
    console.log('✨ 修复完成！\n');
    console.log('📝 可用的登录凭证:');
    console.log('');
    console.log('选项1 - admin账户:');
    console.log('   用户名: admin');
    console.log('   密码: 123456');
    console.log('');
    console.log('选项2 - 知行账户:');
    console.log('   用户名: 知行');
    console.log('   密码: Zhixing Universal Trading Signal');
    console.log('');
    console.log('🌐 登录地址: http://localhost:3000/admin');
    
  } catch (error) {
    console.error('❌ 错误:', error);
  }
}

fixAdminPassword();