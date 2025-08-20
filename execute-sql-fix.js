const { createClient } = require('@supabase/supabase-js');
const path = require('path');

// 尝试多个配置文件
require('dotenv').config({ path: path.join(__dirname, 'client', '.env') });

const supabaseUrl = 'https://itvmeamoqthfqtkpubdv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0dm1lYW1vcXRoZnF0a3B1YmR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0ODEyMzUsImV4cCI6MjA3MDA1NzIzNX0.ypBF3lJJTJtSPLEu1zWXqPorS-FDSZzRUy_0ge_Y-r0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function executeSQL() {
  console.log('🔧 开始添加催单字段...\n');

  try {
    // 1. 先检查字段是否存在
    console.log('📊 检查字段是否已存在...');
    
    const { data: checkData, error: checkError } = await supabase
      .from('orders_optimized')
      .select('is_reminded')
      .limit(1);
    
    if (checkError && checkError.message.includes('column orders_optimized.is_reminded does not exist')) {
      console.log('⚠️ 字段不存在，需要添加');
      console.log('\n请在 Supabase 控制台执行以下 SQL:');
      console.log('=' .repeat(60));
      console.log(`
-- 添加催单相关字段
ALTER TABLE orders_optimized 
ADD COLUMN is_reminded BOOLEAN DEFAULT FALSE,
ADD COLUMN reminder_time TIMESTAMP;

-- 添加索引以提高查询性能
CREATE INDEX idx_orders_reminder 
ON orders_optimized(is_reminded, status, expiry_time) 
WHERE status IN ('confirmed_config', 'active');
      `);
      console.log('=' .repeat(60));
      console.log('\n步骤:');
      console.log('1. 登录 Supabase 控制台');
      console.log('2. 进入 SQL Editor');
      console.log('3. 复制上面的 SQL 语句');
      console.log('4. 执行 SQL');
      console.log('5. 刷新页面测试催单功能');
    } else if (!checkError) {
      console.log('✅ 催单字段已存在，无需添加');
      
      // 测试催单功能
      console.log('\n📊 测试催单功能...');
      
      const { data: testOrder, error: testError } = await supabase
        .from('orders_optimized')
        .select('id, is_reminded, reminder_time')
        .in('status', ['confirmed_config', 'active'])
        .limit(1)
        .single();
      
      if (testOrder) {
        console.log('✅ 找到可测试的订单:', testOrder.id);
        console.log('  is_reminded:', testOrder.is_reminded || false);
        console.log('  reminder_time:', testOrder.reminder_time || '未设置');
        
        // 测试更新
        const { error: updateError } = await supabase
          .from('orders_optimized')
          .update({ 
            is_reminded: true,
            reminder_time: new Date().toISOString()
          })
          .eq('id', testOrder.id);
        
        if (!updateError) {
          console.log('✅ 催单功能测试成功');
          
          // 恢复原状
          await supabase
            .from('orders_optimized')
            .update({ 
              is_reminded: testOrder.is_reminded || false,
              reminder_time: testOrder.reminder_time
            })
            .eq('id', testOrder.id);
        } else {
          console.log('❌ 催单功能测试失败:', updateError.message);
        }
      }
    }
    
    // 2. 检查其他问题
    console.log('\n📊 检查其他配置...');
    
    // 检查销售人员数据
    const { data: sales, error: salesError } = await supabase
      .from('sales_optimized')
      .select('sales_code, wechat_name')
      .limit(5);
    
    if (sales && sales.length > 0) {
      console.log('\n✅ 销售人员数据正常');
      console.log('示例数据:');
      sales.forEach(sale => {
        console.log(`  ${sale.wechat_name} (${sale.sales_code})`);
      });
    }
    
    // 检查订单金额
    const { data: amounts, error: amountsError } = await supabase
      .from('orders_optimized')
      .select('total_amount')
      .not('total_amount', 'is', null);
    
    if (amounts) {
      const uniqueAmounts = [...new Set(amounts.map(a => a.total_amount))].sort((a, b) => a - b);
      console.log('\n✅ 订单金额列表:', uniqueAmounts);
    }
    
    console.log('\n🎉 检查完成！');
    console.log('\n下一步:');
    console.log('1. 如果需要添加字段，请在 Supabase 控制台执行上述 SQL');
    console.log('2. 刷新页面测试所有功能');
    console.log('3. 验证催单功能是否正常工作');

  } catch (error) {
    console.error('❌ 执行出错:', error);
  }
}

// 执行
executeSQL();