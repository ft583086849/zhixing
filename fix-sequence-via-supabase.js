const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './client/.env' });

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function fixSequenceIssue() {
  console.log('====== 修复数据库ID序列问题 ======\n');
  
  try {
    // 1. 查看当前最大ID
    console.log('1. 查看当前最大ID：');
    const { data: maxIdData, error: maxIdError } = await supabase
      .from('orders_optimized')
      .select('id')
      .order('id', { ascending: false })
      .limit(1)
      .single();
    
    if (maxIdError) {
      console.error('查询最大ID失败:', maxIdError);
      return;
    }
    
    const maxId = maxIdData.id;
    console.log('当前最大ID:', maxId);
    
    // 2. 尝试执行SQL修复序列
    console.log('\n2. 尝试修复序列：');
    const newSequenceValue = maxId + 1;
    
    // 使用RPC函数执行SQL
    const { data: rpcResult, error: rpcError } = await supabase
      .rpc('fix_orders_sequence', { new_value: newSequenceValue });
    
    if (rpcError) {
      console.error('RPC修复失败:', rpcError.message);
      console.log('尝试其他方法...');
      
      // 尝试直接创建一个测试记录来更新序列
      console.log('\n3. 尝试通过插入记录更新序列：');
      const testOrder = {
        order_number: `SEQUENCE_FIX_${Date.now()}`,
        created_at: new Date().toISOString(),
        status: 'pending',
        payment_status: 'pending',
        sales_code: 'TEST',
        customer_name: 'sequence_fix_test',
        tradingview_username: `seq_fix_${Date.now()}`,
        duration: '1个月',
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
        .insert([testOrder])
        .select('id')
        .single();
      
      if (insertError) {
        if (insertError.code === '23505' && insertError.message.includes('orders_optimized_pkey')) {
          console.error('❌ 序列问题依然存在 - 主键冲突:', insertError.message);
          console.log('\n🔧 需要手动在数据库中执行以下SQL:');
          console.log(`SELECT setval('orders_optimized_id_seq', ${newSequenceValue}, false);`);
          return false;
        } else {
          console.error('插入测试记录失败:', insertError.message);
          return false;
        }
      } else {
        console.log('✅ 成功插入测试记录，新ID:', insertResult.id);
        
        // 立即删除测试记录
        const { error: deleteError } = await supabase
          .from('orders_optimized')
          .delete()
          .eq('id', insertResult.id);
        
        if (!deleteError) {
          console.log('✅ 测试记录已清理');
        }
        
        console.log('✅ 序列已通过插入测试更新');
        return true;
      }
    } else {
      console.log('✅ RPC修复成功:', rpcResult);
      return true;
    }
    
  } catch (error) {
    console.error('修复过程出错:', error);
    return false;
  }
}

// 执行修复并验证
async function runFix() {
  const success = await fixSequenceIssue();
  
  if (success) {
    console.log('\n====== 验证修复结果 ======');
    
    // 创建一个真实的测试订单
    const verifyOrder = {
      order_number: `VERIFY_${Date.now()}`,
      created_at: new Date().toISOString(),
      status: 'pending',
      payment_status: 'pending',
      sales_code: 'PRI17547196352594604',
      customer_name: 'verify_test',
      tradingview_username: `verify_${Date.now()}`,
      duration: '7天',
      purchase_type: 'immediate',
      amount: 0,
      actual_payment_amount: 0,
      commission_rate: 0,
      commission_amount: 0,
      primary_commission_amount: 0,
      secondary_commission_amount: 0
    };
    
    const { data: verifyResult, error: verifyError } = await supabase
      .from('orders_optimized')
      .insert([verifyOrder])
      .select('id')
      .single();
    
    if (verifyError) {
      console.error('❌ 验证失败，序列问题未解决:', verifyError.message);
    } else {
      console.log('✅ 验证成功！新订单ID:', verifyResult.id);
      
      // 清理验证记录
      await supabase
        .from('orders_optimized')
        .delete()
        .eq('id', verifyResult.id);
      console.log('✅ 验证记录已清理');
    }
  }
}

runFix();