require('dotenv').config({ path: './client/.env' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY
);

async function fixOriginalId() {
  console.log('修复sales_optimized表的original_id字段');
  console.log('='.repeat(50));
  
  // 1. 获取所有sales_optimized记录
  const { data: salesOptimized } = await supabase
    .from('sales_optimized')
    .select('*');
    
  console.log(`找到 ${salesOptimized?.length || 0} 条记录`);
  
  // 2. 获取primary_sales和secondary_sales的映射
  const { data: primarySales } = await supabase
    .from('primary_sales')
    .select('id, sales_code, wechat_name');
    
  const { data: secondarySales } = await supabase
    .from('secondary_sales')
    .select('id, sales_code, wechat_name');
    
  // 创建映射：sales_code -> {table, id}
  const salesMapping = new Map();
  
  primarySales?.forEach(p => {
    salesMapping.set(p.sales_code, {
      table: 'primary_sales',
      id: p.id,
      wechat_name: p.wechat_name
    });
  });
  
  secondarySales?.forEach(s => {
    salesMapping.set(s.sales_code, {
      table: 'secondary_sales',
      id: s.id,
      wechat_name: s.wechat_name
    });
  });
  
  // 3. 修复每条记录
  let fixedCount = 0;
  for (const record of salesOptimized || []) {
    const mapping = salesMapping.get(record.sales_code);
    
    if (mapping) {
      // 检查是否需要更新
      const needUpdate = !record.original_id || !record.original_table;
      
      if (needUpdate) {
        const { error } = await supabase
          .from('sales_optimized')
          .update({
            original_table: mapping.table,
            original_id: mapping.id
          })
          .eq('id', record.id);
          
        if (error) {
          console.error(`更新记录${record.id}失败:`, error);
        } else {
          console.log(`✓ 修复 ${record.wechat_name}: ${mapping.table} -> ${mapping.id}`);
          fixedCount++;
        }
      }
    } else {
      console.log(`⚠️  未找到 ${record.wechat_name} (${record.sales_code}) 的原始记录`);
    }
  }
  
  console.log(`\n✅ 修复完成，共修复 ${fixedCount} 条记录`);
  
  // 4. 验证结果
  const { data: verify } = await supabase
    .from('sales_optimized')
    .select('id, wechat_name, original_table, original_id')
    .is('original_id', null);
    
  if (verify && verify.length > 0) {
    console.log('\n⚠️  仍有记录缺少original_id:');
    verify.forEach(v => {
      console.log(`  - ${v.wechat_name}`);
    });
  } else {
    console.log('\n✅ 所有记录都已有original_id');
  }
}

fixOriginalId();