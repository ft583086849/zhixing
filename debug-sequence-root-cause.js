const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './client/.env' });

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function debugSequenceRootCause() {
  console.log('====== 查找序列问题的根本原因 ======\n');
  
  try {
    // 1. 查看表中实际的ID分布
    console.log('1. 查看实际ID分布：');
    const { data: allIds, error: idsError } = await supabase
      .from('orders_optimized')
      .select('id, created_at')
      .order('id', { ascending: true });
    
    if (idsError) {
      console.error('查询ID失败:', idsError);
      return;
    }
    
    const ids = allIds.map(r => r.id);
    console.log(`总记录数: ${ids.length}`);
    console.log(`ID范围: ${Math.min(...ids)} - ${Math.max(...ids)}`);
    
    // 2. 找出ID间隔
    console.log('\n2. 查找ID间隔：');
    const gaps = [];
    for (let i = Math.min(...ids); i <= Math.max(...ids); i++) {
      if (!ids.includes(i)) {
        gaps.push(i);
      }
    }
    
    if (gaps.length > 0) {
      console.log(`发现 ${gaps.length} 个ID间隔:`, gaps.slice(0, 10), gaps.length > 10 ? '...' : '');
    } else {
      console.log('ID连续，无间隔');
    }
    
    // 3. 查看最近创建的记录
    console.log('\n3. 最近创建的记录：');
    const recent = allIds.slice(-10);
    recent.forEach(r => {
      console.log(`ID ${r.id}: ${new Date(r.created_at).toLocaleString('zh-CN')}`);
    });
    
    // 4. 检查是否有手动插入的记录
    console.log('\n4. 查找可能手动插入的记录模式：');
    const sortedByTime = [...allIds].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    
    let manualInserts = [];
    for (let i = 1; i < sortedByTime.length; i++) {
      const prev = sortedByTime[i - 1];
      const curr = sortedByTime[i];
      
      // 如果时间顺序和ID顺序不一致，可能是手动插入
      if (curr.id < prev.id) {
        manualInserts.push({
          id: curr.id,
          time: new Date(curr.created_at).toLocaleString('zh-CN'),
          issue: `ID ${curr.id} 的时间晚于 ID ${prev.id}，可能是手动插入`
        });
      }
    }
    
    if (manualInserts.length > 0) {
      console.log('🔍 发现可能的手动插入记录:');
      manualInserts.forEach(m => console.log(`- ${m.issue}`));
    } else {
      console.log('✅ ID和时间顺序一致');
    }
    
    // 5. 尝试理解序列当前状态
    console.log('\n5. 分析序列状态：');
    const maxId = Math.max(...ids);
    console.log(`当前最大ID: ${maxId}`);
    console.log(`序列应该设置为: ${maxId + 1}`);
    
    // 6. 验证问题：尝试插入一个最大ID+1的记录
    console.log('\n6. 验证序列问题：');
    const nextId = maxId + 1;
    console.log(`尝试插入ID ${nextId}...`);
    
    const testRecord = {
      id: nextId,
      order_number: `SEQUENCE_TEST_${Date.now()}`,
      created_at: new Date().toISOString(),
      status: 'pending',
      payment_status: 'pending',
      sales_code: 'TEST_SEQ',
      customer_name: 'sequence_test',
      tradingview_username: `seq_test_${Date.now()}`,
      duration: '7天',
      purchase_type: 'immediate',
      amount: 0,
      actual_payment_amount: 0,
      commission_rate: 0,
      commission_amount: 0,
      primary_commission_amount: 0,
      secondary_commission_amount: 0
    };
    
    const { data: insertResult, error: insertError } = await supabase
      .from('orders_optimized')
      .insert([testRecord])
      .select('id');
    
    if (insertError) {
      if (insertError.message.includes('duplicate key')) {
        console.log(`❌ 确认：ID ${nextId} 已存在，这解释了序列冲突`);
        console.log(`说明序列值小于实际最大ID`);
      } else {
        console.log(`其他错误: ${insertError.message}`);
      }
    } else {
      console.log(`✅ ID ${nextId} 插入成功，序列可能没问题`);
      
      // 清理测试记录
      await supabase
        .from('orders_optimized')
        .delete()
        .eq('id', insertResult[0].id);
    }
    
    // 7. 给出根本原因分析
    console.log('\n====== 根本原因分析 ======');
    console.log('序列问题的可能原因：');
    console.log('1. 曾经有人手动插入过指定ID的记录');
    console.log('2. 数据导入时没有正确更新序列');
    console.log('3. 并发操作导致序列不同步');
    console.log('4. 数据库被直接操作过（不通过应用）');
    
    console.log('\n解决方案：');
    console.log('在数据库中执行以下SQL来彻底修复：');
    console.log(`SELECT setval('orders_optimized_id_seq', ${maxId + 1}, false);`);
    
  } catch (error) {
    console.error('调试失败:', error);
  }
}

debugSequenceRootCause();