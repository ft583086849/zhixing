/**
 * 完整检查表结构
 * 确保orders_optimized表有所有必需的字段
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://itvmeamoqthfqtkpubdv.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0dm1lYW1vcXRoZnF0a3B1YmR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0ODEyMzUsImV4cCI6MjA3MDA1NzIzNX0.ypBF3lJJTJtSPLEu1zWXqPorS-FDSZzRUy_0ge_Y-r0';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// 必需的字段列表（基于orders表）
const requiredFields = [
  'id',
  'link_code',
  'sales_code',
  'parent_link_code',
  'parent_sales_code',
  'tradingview_username',
  'tv_username',
  'created_at',
  'updated_at',
  'status',
  'payment_method',
  'payment_image_url',
  'payment_amount',
  'duration',
  'expiry_time',
  'commission_amount',
  'config_time',  // 配置确认时间
  'payment_time', // 支付时间
  'reject_reason' // 拒绝原因
];

async function checkTableStructure() {
  console.log('========================================');
  console.log('表结构完整性检查');
  console.log(`时间: ${new Date().toLocaleString('zh-CN')}`);
  console.log('========================================\n');

  const missingFields = [];
  const existingFields = [];

  // 1. 获取orders表结构
  console.log('【1. 检查orders表结构】');
  console.log('----------------------------------------');
  
  // RPC可能不可用，跳过这部分
  
  // 2. 获取orders_optimized表结构
  console.log('\n【2. 检查orders_optimized表结构】');
  console.log('----------------------------------------');
  
  // 尝试查询一条记录来检查字段
  const { data: sampleData, error: sampleError } = await supabase
    .from('orders_optimized')
    .select('*')
    .limit(1)
    .single();
  
  if (sampleData) {
    const actualFields = Object.keys(sampleData);
    console.log(`实际字段数量: ${actualFields.length}`);
    
    // 检查必需字段
    requiredFields.forEach(field => {
      if (actualFields.includes(field)) {
        existingFields.push(field);
      } else {
        missingFields.push(field);
      }
    });
    
    console.log(`\n✅ 存在的字段 (${existingFields.length}):`);
    existingFields.forEach(field => console.log(`  - ${field}`));
    
    if (missingFields.length > 0) {
      console.log(`\n❌ 缺失的字段 (${missingFields.length}):`);
      missingFields.forEach(field => console.log(`  - ${field}`));
    }
    
    // 检查额外字段
    const extraFields = actualFields.filter(f => !requiredFields.includes(f));
    if (extraFields.length > 0) {
      console.log(`\n📝 额外的字段 (${extraFields.length}):`);
      extraFields.forEach(field => console.log(`  - ${field}`));
    }
  } else if (sampleError) {
    console.error('无法获取表结构:', sampleError.message);
  }

  // 3. 生成修复SQL
  if (missingFields.length > 0) {
    console.log('\n========================================');
    console.log('生成修复SQL');
    console.log('========================================\n');
    
    console.log('-- 在Supabase SQL Editor中执行以下SQL：\n');
    
    missingFields.forEach(field => {
      let dataType = 'TEXT'; // 默认类型
      
      // 根据字段名推测数据类型
      if (field.includes('time')) {
        dataType = 'TIMESTAMP WITH TIME ZONE';
      } else if (field.includes('amount')) {
        dataType = 'DECIMAL(10,2)';
      } else if (field === 'id') {
        dataType = 'BIGINT';
      }
      
      console.log(`ALTER TABLE orders_optimized ADD COLUMN IF NOT EXISTS ${field} ${dataType};`);
    });
    
    console.log('\n-- 创建索引');
    if (missingFields.includes('config_time')) {
      console.log('CREATE INDEX IF NOT EXISTS idx_orders_optimized_config_time ON orders_optimized(config_time);');
    }
    if (missingFields.includes('payment_time')) {
      console.log('CREATE INDEX IF NOT EXISTS idx_orders_optimized_payment_time ON orders_optimized(payment_time);');
    }
  }

  // 4. 功能测试建议
  console.log('\n========================================');
  console.log('功能测试清单');
  console.log('========================================\n');
  
  const functionalTests = [
    { field: 'config_time', test: '配置确认功能' },
    { field: 'payment_time', test: '支付确认功能' },
    { field: 'reject_reason', test: '拒绝订单功能' },
    { field: 'commission_amount', test: '佣金计算功能' },
    { field: 'expiry_time', test: '过期时间显示' }
  ];
  
  functionalTests.forEach(({ field, test }) => {
    if (missingFields.includes(field)) {
      console.log(`❌ ${test} - 缺少${field}字段`);
    } else {
      console.log(`✅ ${test} - ${field}字段存在`);
    }
  });

  // 5. 总结
  console.log('\n========================================');
  console.log('检查结果');
  console.log('========================================\n');
  
  if (missingFields.length === 0) {
    console.log('✅ 表结构完整，所有必需字段都存在');
  } else {
    console.log(`❌ 缺少 ${missingFields.length} 个必需字段`);
    console.log('\n请执行上面生成的SQL来修复表结构');
    console.log('修复后需要重新测试所有功能');
  }
  
  return {
    missingFields,
    existingFields,
    isComplete: missingFields.length === 0
  };
}

// 执行检查
checkTableStructure().then(result => {
  if (!result.isComplete) {
    console.log('\n⚠️ 警告：不要在修复表结构前使用系统！');
  }
});