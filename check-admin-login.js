const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');

const supabase = createClient(
  'https://itvmeamoqthfqtkpubdv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0dm1lYW1vcXRoZnF0a3B1YmR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0ODEyMzUsImV4cCI6MjA3MDA1NzIzNX0.ypBF3lJJTJtSPLEu1zWXqPorS-FDSZzRUy_0ge_Y-r0'
);

async function checkAdminLogin() {
  console.log('🔍 检查管理员登录信息...\n');
  
  try {
    // 1. 获取所有管理员
    console.log('1️⃣ 获取管理员列表...');
    const { data: admins, error } = await supabase
      .from('admins')
      .select('*');
    
    if (error) {
      console.error('❌ 获取失败:', error.message);
      return;
    }
    
    console.log(`✅ 找到 ${admins.length} 个管理员账户:\n`);
    
    admins.forEach(admin => {
      console.log(`📌 管理员 #${admin.id}:`);
      console.log(`   用户名: ${admin.username}`);
      console.log(`   角色: ${admin.role}`);
      console.log(`   密码哈希: ${admin.password_hash}`);
      console.log(`   创建时间: ${admin.created_at}`);
      console.log('');
    });
    
    // 2. 生成正确的密码哈希
    console.log('2️⃣ 生成密码哈希...');
    
    // 测试不同的密码
    const passwords = ['123456', 'admin123', 'admin'];
    
    for (const password of passwords) {
      const hash = await bcrypt.hash(password, 10);
      console.log(`\n密码 "${password}" 的哈希:`);
      console.log(`   ${hash}`);
      
      // 测试是否匹配现有哈希
      for (const admin of admins) {
        try {
          // 尝试使用bcrypt比较
          if (admin.password_hash.startsWith('$2')) {
            const match = await bcrypt.compare(password, admin.password_hash);
            if (match) {
              console.log(`   ✅ 匹配管理员 "${admin.username}"`);
            }
          }
          // 检查是否是明文
          else if (admin.password_hash === password) {
            console.log(`   ⚠️ 管理员 "${admin.username}" 使用明文密码！`);
          }
        } catch (e) {
          // 忽略比较错误
        }
      }
    }
    
    // 3. 创建或更新admin账户
    console.log('\n3️⃣ 创建/更新admin账户...');
    
    const adminUser = admins.find(a => a.username === 'admin');
    const newHash = await bcrypt.hash('123456', 10);
    
    if (adminUser) {
      console.log('更新现有admin账户...');
      const { error: updateError } = await supabase
        .from('admins')
        .update({ 
          password_hash: newHash,
          role: 'super_admin'
        })
        .eq('username', 'admin');
      
      if (updateError) {
        console.error('❌ 更新失败:', updateError.message);
      } else {
        console.log('✅ admin账户已更新');
        console.log('   用户名: admin');
        console.log('   密码: 123456');
      }
    } else {
      console.log('创建新的admin账户...');
      const { error: insertError } = await supabase
        .from('admins')
        .insert({
          username: 'admin',
          password_hash: newHash,
          role: 'super_admin'
        });
      
      if (insertError) {
        console.error('❌ 创建失败:', insertError.message);
      } else {
        console.log('✅ admin账户已创建');
        console.log('   用户名: admin');
        console.log('   密码: 123456');
      }
    }
    
    console.log('\n✨ 完成！');
    console.log('\n📝 登录信息:');
    console.log('   URL: http://localhost:3000/admin');
    console.log('   用户名: admin');
    console.log('   密码: 123456');
    
  } catch (error) {
    console.error('❌ 错误:', error);
  }
}

// 检查bcryptjs是否安装
try {
  require.resolve('bcryptjs');
  checkAdminLogin();
} catch (e) {
  console.log('📦 需要先安装bcryptjs:');
  console.log('   npm install bcryptjs');
}