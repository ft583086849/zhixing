// 修复ProductConfigAPI - 先检查表是否存在
const { SupabaseService } = require('./client/src/services/supabase');

async function checkAndFixProductConfig() {
  console.log('🔍 检查数据库表状态...');
  
  try {
    // 检查 product_config 表是否存在
    const { data: tables, error: tableError } = await SupabaseService.supabase
      .rpc('check_table_exists', { table_name: 'product_config' });
    
    if (tableError) {
      console.log('⚠️ 无法检查表存在性，直接尝试查询...');
    }
    
    // 尝试查询 product_config 表
    const { data, error } = await SupabaseService.supabase
      .from('product_config')
      .select('*')
      .limit(1);
    
    if (error) {
      console.log('❌ product_config 表不存在或无法访问:', error.message);
      console.log('📋 需要在Supabase控制台执行 create-tables.sql');
      return false;
    }
    
    console.log('✅ product_config 表存在，包含', data?.length || 0, '条数据');
    
    // 检查 product_features 表
    const { data: features, error: featuresError } = await SupabaseService.supabase
      .from('product_features') 
      .select('*')
      .limit(1);
    
    if (featuresError) {
      console.log('❌ product_features 表不存在:', featuresError.message);
      return false;
    }
    
    console.log('✅ product_features 表存在，包含', features?.length || 0, '条数据');
    return true;
    
  } catch (error) {
    console.error('❌ 检查表状态失败:', error);
    return false;
  }
}

// 执行检查
checkAndFixProductConfig();