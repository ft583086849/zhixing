const { createClient } = require('@supabase/supabase-js');

// Supabase连接配置
const supabaseUrl = 'https://itvmeamoqthfqtkpubdv.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0dm1lYW1vcXRoZnF0a3B1YmR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0ODEyMzUsImV4cCI6MjA3MDA1NzIzNX0.ypBF3lJJTJtSPLEu1zWXqPorS-FDSZzRUy_0ge_Y-r0';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function getTableStructure() {
  console.log('=== 🔍 查询数据库实际表结构 ===\n');

  try {
    // 获取所有表的列信息
    const { data: columns, error } = await supabase
      .rpc('get_table_columns', {});
    
    if (error) {
      console.log('使用备用方法查询表结构...\n');
      
      // 备用方法：直接查询各个表
      const tables = ['sales', 'orders', 'admins', 'payment_config', 'lifetime_limit', 'profit_distribution', 'secondary_sales'];
      
      for (const tableName of tables) {
        console.log(`\n📊 表: ${tableName}`);
        console.log('─'.repeat(60));
        
        // 获取表的一条记录来推断结构
        const { data, error } = await supabase
          .from(tableName)
          .select('*')
          .limit(1);
        
        if (!error) {
          if (data && data.length > 0) {
            const sample = data[0];
            console.log('字段列表：');
            for (const [field, value] of Object.entries(sample)) {
              const type = typeof value;
              const displayValue = value === null ? 'NULL' : 
                                 type === 'string' ? `"${value.substring(0, 50)}${value.length > 50 ? '...' : ''}"` :
                                 value;
              console.log(`  - ${field}: ${type} (示例值: ${displayValue})`);
            }
          } else {
            console.log('  表为空，无法获取字段信息');
          }
        } else {
          console.log(`  错误: ${error.message}`);
        }
      }
    } else {
      // 如果成功获取列信息，按表分组显示
      const tableColumns = {};
      columns.forEach(col => {
        if (!tableColumns[col.table_name]) {
          tableColumns[col.table_name] = [];
        }
        tableColumns[col.table_name].push(col);
      });

      for (const [tableName, cols] of Object.entries(tableColumns)) {
        console.log(`\n📊 表: ${tableName}`);
        console.log('─'.repeat(60));
        console.log('字段名\t\t类型\t\t\t可空\t默认值');
        console.log('─'.repeat(60));
        
        cols.forEach(col => {
          const fieldName = col.column_name.padEnd(20);
          const dataType = col.data_type.padEnd(20);
          const nullable = col.is_nullable ? 'YES' : 'NO';
          const defaultVal = col.column_default || 'NULL';
          console.log(`${fieldName}\t${dataType}\t${nullable}\t${defaultVal}`);
        });
      }
    }

    // 查询表的记录数
    console.log('\n\n📈 表记录统计');
    console.log('─'.repeat(60));
    
    const tables = ['sales', 'orders', 'admins', 'payment_config', 'lifetime_limit', 'profit_distribution'];
    for (const table of tables) {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });
      
      if (!error) {
        console.log(`${table}: ${count || 0} 条记录`);
      }
    }

  } catch (err) {
    console.error('查询出错:', err);
  }
}

// 执行查询
getTableStructure();