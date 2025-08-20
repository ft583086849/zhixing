const { createClient } = require('@supabase/supabase-js');

// Supabase连接配置
const supabaseUrl = 'https://itvmeamoqthfqtkpubdv.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0dm1lYW1vcXRoZnF0a3B1YmR2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDQ4MTIzNSwiZXhwIjoyMDcwMDU3MjM1fQ.WXoJcWcg9eTnzqkQJ_p2iOGn04MXqKrU1IRT5zRhzHc';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function getDetailedTableStructure() {
  console.log('=== 📊 数据库实际表结构详细报告 ===\n');
  console.log('数据库: Supabase (PostgreSQL)');
  console.log('URL:', supabaseUrl);
  console.log('时间:', new Date().toLocaleString());
  console.log('='*60 + '\n');

  // 主要的表
  const mainTables = [
    'orders',           // 订单表
    'admins',          // 管理员表
    'payment_config',   // 支付配置表
    'profit_distribution', // 收益分配表
    'secondary_sales'   // 二级销售表
  ];

  // 查询每个表的详细结构
  for (const tableName of mainTables) {
    console.log(`\n${'='.repeat(70)}`);
    console.log(`📋 表名: ${tableName}`);
    console.log(`${'='.repeat(70)}`);
    
    try {
      // 获取一条数据来分析结构
      const { data: sampleData, error: sampleError } = await supabase
        .from(tableName)
        .select('*')
        .limit(1);
      
      if (sampleError) {
        console.log(`❌ 无法访问表: ${sampleError.message}`);
        continue;
      }

      // 获取表的记录总数
      const { count, error: countError } = await supabase
        .from(tableName)
        .select('*', { count: 'exact', head: true });
      
      console.log(`📊 记录总数: ${count || 0} 条\n`);
      
      if (sampleData && sampleData.length > 0) {
        console.log('字段结构:');
        console.log('-'.repeat(70));
        console.log('字段名'.padEnd(30) + '类型'.padEnd(15) + '示例值');
        console.log('-'.repeat(70));
        
        const record = sampleData[0];
        for (const [field, value] of Object.entries(record)) {
          let dataType = 'unknown';
          let displayValue = 'NULL';
          
          if (value === null) {
            dataType = 'null';
            displayValue = 'NULL';
          } else if (typeof value === 'string') {
            dataType = 'string';
            // 判断是否是时间戳
            if (value.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)) {
              dataType = 'timestamp';
            }
            // 判断是否是UUID
            else if (value.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
              dataType = 'uuid';
            }
            // 判断是否是base64图片
            else if (value.startsWith('data:image')) {
              dataType = 'base64_image';
              displayValue = '[BASE64_IMAGE]';
            } else {
              displayValue = value.length > 40 ? value.substring(0, 40) + '...' : value;
            }
          } else if (typeof value === 'number') {
            dataType = Number.isInteger(value) ? 'integer' : 'decimal';
            displayValue = value.toString();
          } else if (typeof value === 'boolean') {
            dataType = 'boolean';
            displayValue = value.toString();
          } else if (typeof value === 'object') {
            dataType = 'json';
            displayValue = JSON.stringify(value).substring(0, 40);
          }
          
          console.log(field.padEnd(30) + dataType.padEnd(15) + displayValue);
        }
      } else {
        console.log('表为空或无法获取数据');
      }
      
    } catch (err) {
      console.log(`❌ 查询错误: ${err.message}`);
    }
  }

  // 特别说明缺失的表
  console.log(`\n${'='.repeat(70)}`);
  console.log('📝 说明');
  console.log(`${'='.repeat(70)}`);
  console.log('1. sales表: 不存在（可能已经被删除或改名）');
  console.log('2. lifetime_limit表: 不存在（功能已停用）');
  console.log('3. 实际使用secondary_sales表来存储销售信息');
  console.log('4. 所有时间字段都是ISO 8601格式的timestamp');
  console.log('5. 金额字段一般是decimal类型');
  console.log('6. ID字段有些是integer自增，有些是UUID');
}

// 执行查询
getDetailedTableStructure();