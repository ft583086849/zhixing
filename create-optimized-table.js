const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// 直接使用已知的Supabase配置
const supabaseUrl = 'https://itvmeamoqthfqtkpubdv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0dm1lYW1vcXRoZnF0a3B1YmR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0ODEyMzUsImV4cCI6MjA3MDA1NzIzNX0.ypBF3lJJTJtSPLEu1zWXqPorS-FDSZzRUy_0ge_Y-r0';

console.log('🔍 正在连接到Supabase数据库...');
console.log('URL:', supabaseUrl);

const supabase = createClient(supabaseUrl, supabaseKey);

async function createOptimizedTable() {
  try {
    // 读取SQL脚本
    const sqlScript = fs.readFileSync('./create-orders-optimized-table.sql', 'utf8');
    
    console.log('📄 开始执行SQL脚本创建orders_optimized表...');
    
    // 分步执行SQL（因为rpc可能不支持复杂脚本）
    console.log('🚀 步骤1: 检查是否存在orders_optimized表');
    const { data: checkData, error: checkError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_name', 'orders_optimized');
    
    if (checkError) {
      console.error('❌ 检查表存在性失败:', checkError);
    } else {
      console.log('✅ 表检查完成，当前存在orders_optimized表:', checkData?.length > 0);
    }

    // 直接执行SQL创建表（使用原生SQL）
    console.log('🚀 步骤2: 创建orders_optimized表和索引');
    
    // 尝试使用sql方法执行
    const { data, error } = await supabase.sql`${sqlScript}`;
    
    if (error) {
      console.error('❌ 创建表失败:', error);
      // 尝试备用方法
      console.log('🔄 尝试使用RPC方式执行...');
      
      const { data: rpcData, error: rpcError } = await supabase.rpc('exec_sql', {
        sql: sqlScript
      });
      
      if (rpcError) {
        console.error('❌ RPC执行也失败:', rpcError);
        return false;
      }
      
      console.log('✅ RPC执行成功:', rpcData);
      return true;
    }
    
    console.log('✅ orders_optimized表创建成功!');
    console.log('📊 结果:', data);
    
    return true;
  } catch (err) {
    console.error('❌ 执行异常:', err.message);
    return false;
  }
}

async function verifyTableCreation() {
  try {
    console.log('🔍 验证表是否创建成功...');
    
    // 检查表结构
    const { data, error } = await supabase
      .from('orders_optimized')
      .select('*')
      .limit(1);
    
    if (error) {
      if (error.code === 'PGRST116') {
        console.log('⚠️ 表不存在或无访问权限');
        return false;
      }
      console.error('❌ 验证失败:', error);
      return false;
    }
    
    console.log('✅ 表验证成功，可以正常访问');
    return true;
  } catch (err) {
    console.error('❌ 验证异常:', err.message);
    return false;
  }
}

async function main() {
  const createSuccess = await createOptimizedTable();
  
  if (createSuccess) {
    console.log('🎯 表创建任务完成');
    
    // 验证表是否可用
    const verifySuccess = await verifyTableCreation();
    if (verifySuccess) {
      console.log('🎉 orders_optimized表已成功创建并验证完毕');
    } else {
      console.log('⚠️ 表创建完成但验证失败，可能需要权限设置');
    }
  } else {
    console.log('❌ 表创建失败');
  }
  
  process.exit(createSuccess ? 0 : 1);
}

main();