const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './client/.env' });

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSequenceStatus() {
  console.log('====== 检查ID序列状态 ======\n');
  
  try {
    // 1. 检查当前最大ID
    console.log('1. 检查当前数据状态：');
    const { data: maxIdData, error: maxIdError } = await supabase
      .from('orders_optimized')
      .select('id')
      .order('id', { ascending: false })
      .limit(1)
      .single();
    
    if (!maxIdError && maxIdData) {
      console.log('当前最大ID:', maxIdData.id);
    }
    
    // 2. 尝试插入不指定ID的记录，看看自动分配的ID
    console.log('\n2. 测试自动ID分配：');
    const testData = {
      order_number: `TEST_${Date.now()}`,
      created_at: new Date().toISOString(),
      status: 'pending',
      payment_status: 'pending',
      sales_code: 'TEST',
      customer_name: 'test',
      tradingview_username: `test_${Date.now()}`,
      duration: '1个月',
      purchase_type: 'immediate',
      amount: 100,
      actual_payment_amount: 100,
      commission_rate: 0,
      commission_amount: 0,
      primary_commission_amount: 0,
      secondary_commission_amount: 0
    };
    
    const { data: newRecord, error: insertError } = await supabase
      .from('orders_optimized')
      .insert([testData])
      .select('id')
      .single();
    
    if (insertError) {
      console.error('❌ 自动ID分配失败:', insertError.message);
      console.error('错误代码:', insertError.code);
      
      if (insertError.code === '23505' && insertError.message.includes('orders_optimized_pkey')) {
        console.log('\n🔍 确认是主键冲突！');
        console.log('说明数据库的ID序列没有正确更新');
        console.log('这通常发生在：');
        console.log('1. 手动插入了指定ID的记录');
        console.log('2. 数据导入时没有更新序列');
        console.log('3. 并发插入导致序列不同步');
      }
    } else {
      console.log('✅ 自动分配的ID:', newRecord.id);
      
      // 立即删除测试记录
      await supabase
        .from('orders_optimized')
        .delete()
        .eq('id', newRecord.id);
      console.log('✅ 测试记录已删除');
    }
    
    // 3. 检查最近几条记录的ID分布
    console.log('\n3. 检查最近记录的ID分布：');
    const { data: recentRecords, error: recentError } = await supabase
      .from('orders_optimized')
      .select('id, created_at')
      .order('id', { ascending: false })
      .limit(10);
    
    if (!recentError && recentRecords) {
      console.log('最近10条记录的ID：');
      recentRecords.forEach((record, index) => {
        console.log(`${index + 1}. ID: ${record.id}, 时间: ${new Date(record.created_at).toLocaleString('zh-CN')}`);
      });
      
      // 检查ID是否连续
      const ids = recentRecords.map(r => r.id).sort((a, b) => a - b);
      const gaps = [];
      for (let i = 1; i < ids.length; i++) {
        if (ids[i] - ids[i-1] > 1) {
          gaps.push(`${ids[i-1]} 到 ${ids[i]} 之间有间隔`);
        }
      }
      
      if (gaps.length > 0) {
        console.log('\n发现ID间隔:', gaps);
      } else {
        console.log('\n✅ ID基本连续');
      }
    }
    
  } catch (error) {
    console.error('检查失败:', error);
  }
}

checkSequenceStatus();