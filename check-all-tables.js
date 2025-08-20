const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://itvmeamoqthfqtkpubdv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0dm1lYW1vcXRoZnF0a3B1YmR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0ODEyMzUsImV4cCI6MjA3MDA1NzIzNX0.ypBF3lJJTJtSPLEu1zWXqPorS-FDSZzRUy_0ge_Y-r0'
);

async function checkAllTables() {
  console.log('🔍 检查数据库中的所有表...\n');
  
  // 根据文档列出的表
  const documentedTables = [
    'orders',           // 订单表
    'secondary_sales',  // 销售信息表（原sales表）
    'primary_sales',    // 一级销售表（文档中未提及但可能存在）
    'admins',          // 管理员表
    'payment_config',  // 支付配置表
    'profit_distribution', // 收益分配表
    'overview_stats',  // 新创建的统计表
    'sales',           // 原sales表（已废弃）
    'payment_links',   // 支付链接表（可能存在）
    'lifetime_limit'   // 永久授权表（已废弃）
  ];
  
  console.log('📋 检查以下表的存在性：\n');
  
  for (const table of documentedTables) {
    try {
      const { data, error, count } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });
      
      if (error) {
        if (error.message.includes('not find')) {
          console.log(`❌ ${table.padEnd(20)} - 不存在`);
        } else {
          console.log(`⚠️  ${table.padEnd(20)} - 错误: ${error.message}`);
        }
      } else {
        console.log(`✅ ${table.padEnd(20)} - 存在 (${count || 0} 条记录)`);
      }
    } catch (e) {
      console.log(`❌ ${table.padEnd(20)} - 错误: ${e.message}`);
    }
  }
  
  console.log('\n📊 汇总：');
  console.log('- 文档中说 sales 表已不存在，改为 secondary_sales');
  console.log('- 文档中说 lifetime_limit 表已不存在');
  console.log('- primary_sales 表文档中未提及，但实际存在');
  console.log('- overview_stats 是我们新创建的表');
}

checkAllTables();