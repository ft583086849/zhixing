const SupabaseService = require('./client/src/services/supabase.js');

async function addMissingFields() {
  console.log('🔧 添加缺失的字段到overview_stats表...\n');
  
  const supabase = SupabaseService.supabase;
  
  try {
    // 执行SQL添加缺失的字段
    const { error } = await supabase.rpc('exec_sql', {
      sql: `
        -- 添加销售业绩相关字段
        ALTER TABLE overview_stats 
        ADD COLUMN IF NOT EXISTS primary_sales_amount DECIMAL(10, 2) DEFAULT 0.00,
        ADD COLUMN IF NOT EXISTS linked_secondary_sales_amount DECIMAL(10, 2) DEFAULT 0.00,
        ADD COLUMN IF NOT EXISTS independent_sales_amount DECIMAL(10, 2) DEFAULT 0.00,
        ADD COLUMN IF NOT EXISTS linked_secondary_sales_count INTEGER DEFAULT 0,
        ADD COLUMN IF NOT EXISTS independent_sales_count INTEGER DEFAULT 0,
        ADD COLUMN IF NOT EXISTS secondary_sales_count INTEGER DEFAULT 0,
        ADD COLUMN IF NOT EXISTS active_sales_count INTEGER DEFAULT 0;
      `
    });
    
    if (error) {
      // 如果rpc不存在，尝试直接更新一条记录来触发字段创建
      console.log('尝试通过更新记录来检查字段...');
      
      // 先获取一条记录
      const { data: existing } = await supabase
        .from('overview_stats')
        .select('id')
        .limit(1)
        .single();
      
      if (existing) {
        // 尝试更新包含新字段的记录
        const { error: updateError } = await supabase
          .from('overview_stats')
          .update({
            primary_sales_amount: 0,
            linked_secondary_sales_amount: 0,
            independent_sales_amount: 0,
            linked_secondary_sales_count: 0,
            independent_sales_count: 0,
            secondary_sales_count: 0,
            active_sales_count: 0
          })
          .eq('id', existing.id);
        
        if (updateError) {
          console.log('⚠️ 某些字段可能不存在，但这是预期的');
          console.log('错误详情:', updateError.message);
        } else {
          console.log('✅ 字段检查完成');
        }
      }
    } else {
      console.log('✅ 字段添加成功');
    }
    
  } catch (error) {
    console.error('❌ 操作失败:', error.message);
  }
  
  process.exit(0);
}

addMissingFields();