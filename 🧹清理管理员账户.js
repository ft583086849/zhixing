#!/usr/bin/env node

/**
 * 🧹 清理多余的管理员账户，只保留"知行"
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://itvmeamoqthfqtkpubdv.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0dm1lYW1vcXRoZnF0a3B1YmR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0ODEyMzUsImV4cCI6MjA3MDA1NzIzNX0.ypBF3lJJTJtSPLEu1zWXqPorS-FDSZzRUy_0ge_Y-r0';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function cleanupAdmins() {
  console.log('🧹 清理多余的管理员账户...\n');
  
  try {
    // 查看所有管理员账户
    console.log('📋 当前所有管理员账户:');
    const { data: allAdmins, error: queryError } = await supabase
      .from('admins')
      .select('*')
      .order('created_at', { ascending: true });
    
    if (queryError) {
      console.log('❌ 查询管理员失败:', queryError.message);
      return;
    }
    
    allAdmins.forEach((admin, index) => {
      console.log(`   ${index + 1}. ID: ${admin.id}, 用户名: "${admin.username}", 创建时间: ${admin.created_at}`);
    });
    
    // 删除非"知行"的管理员账户
    console.log('\n🗑️ 删除非"知行"的管理员账户...');
    const { data: deletedAdmins, error: deleteError } = await supabase
      .from('admins')
      .delete()
      .neq('username', '知行')
      .select();
    
    if (deleteError) {
      console.log('❌ 删除失败:', deleteError.message);
    } else {
      console.log(`✅ 成功删除 ${deletedAdmins?.length || 0} 个多余的管理员账户`);
      if (deletedAdmins?.length > 0) {
        deletedAdmins.forEach(admin => {
          console.log(`   - 已删除: ${admin.username} (ID: ${admin.id})`);
        });
      }
    }
    
    // 验证最终结果
    console.log('\n📊 清理后的管理员账户:');
    const { data: finalAdmins, error: finalError } = await supabase
      .from('admins')
      .select('*');
    
    if (finalError) {
      console.log('❌ 验证查询失败:', finalError.message);
    } else {
      console.log(`✅ 当前管理员账户总数: ${finalAdmins.length}`);
      finalAdmins.forEach(admin => {
        console.log(`   - 用户名: ${admin.username}, ID: ${admin.id}`);
      });
    }
    
    console.log('\n🎯 清理完成！现在只保留"知行"管理员账户。');
    
  } catch (error) {
    console.error('❌ 清理过程出错:', error.message);
  }
}

cleanupAdmins();