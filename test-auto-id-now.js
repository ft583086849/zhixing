const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './client/.env' });

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function testAutoIdNow() {
  console.log('====== 测试当前自动ID分配 ======\n');
  
  try {
    // 清理之前的测试记录
    await supabase
      .from('orders_optimized')
      .delete()
      .eq('id', 338);
    
    console.log('1. 测试自动ID分配（不指定ID）：');
    
    const testOrder = {
      // 不指定ID，让数据库自动分配
      order_number: `AUTO_TEST_${Date.now()}`,
      created_at: new Date().toISOString(),
      status: 'pending',
      payment_status: 'pending',
      sales_code: 'AUTO_TEST',
      customer_name: 'auto_test_user',
      tradingview_username: `auto_test_${Date.now()}`,
      duration: '7天',
      purchase_type: 'immediate',
      amount: 0,
      actual_payment_amount: 0,
      commission_rate: 0,
      commission_amount: 0,
      primary_commission_amount: 0,
      secondary_commission_amount: 0
    };
    
    const { data: result, error } = await supabase
      .from('orders_optimized')
      .insert([testOrder])
      .select('id')
      .single();
    
    if (error) {
      console.error('❌ 自动ID分配失败:', error.message);
      console.error('错误代码:', error.code);
      
      if (error.code === '23505' && error.message.includes('orders_optimized_pkey')) {
        console.log('\n🔍 确认序列问题仍然存在');
        console.log('序列试图分配一个已存在的ID');
        
        // 查看冲突的ID
        const duplicateMatch = error.message.match(/Key \(id\)=\((\d+)\)/);
        if (duplicateMatch) {
          const conflictId = duplicateMatch[1];
          console.log(`冲突的ID: ${conflictId}`);
          
          // 检查这个ID是否真的存在
          const { data: existing } = await supabase
            .from('orders_optimized')
            .select('id, created_at')
            .eq('id', conflictId)
            .single();
          
          if (existing) {
            console.log(`确认ID ${conflictId} 已存在，创建时间: ${new Date(existing.created_at).toLocaleString('zh-CN')}`);
          }
        }
        
        return false;
      }
    } else {
      console.log('✅ 自动ID分配成功！');
      console.log('分配的ID:', result.id);
      
      // 清理测试数据
      await supabase
        .from('orders_optimized')
        .delete()
        .eq('id', result.id);
      
      console.log('✅ 测试数据已清理');
      return true;
    }
    
  } catch (error) {
    console.error('测试过程出错:', error);
    return false;
  }
}

async function finalTest() {
  console.log('====== 最终测试：模拟用户实际操作 ======\n');
  
  // 完全模拟用户的订单创建过程
  const userOrder = {
    order_number: `ORD${Date.now()}`, // 用应用的格式
    created_at: new Date().toISOString(),
    status: 'pending',
    payment_status: 'pending',
    sales_code: 'PRI17547196352594604',
    link_code: 'PRI17547196352594604',
    customer_name: '真实测试用户',
    customer_wechat: 'real_test_wechat',
    tradingview_username: `real_test_${Date.now()}`,
    duration: '7天', // 使用修复后的中文值
    purchase_type: 'immediate',
    effective_time: null,
    amount: 0,
    actual_payment_amount: 0,
    alipay_amount: null,
    crypto_amount: null,
    payment_method: null,
    payment_time: new Date().toISOString(),
    screenshot_data: null,
    commission_rate: 0,
    commission_amount: 0,
    primary_commission_amount: 0,
    secondary_commission_amount: 0
  };
  
  console.log('模拟用户创建7天免费订单...');
  
  const { data: userResult, error: userError } = await supabase
    .from('orders_optimized')
    .insert([userOrder])
    .select()
    .single();
  
  if (userError) {
    console.error('❌ 用户订单创建失败:', userError.message);
    console.error('这就是用户会看到的"数据已存在，请检查输入"错误');
    return false;
  } else {
    console.log('✅ 用户订单创建成功！');
    console.log('订单ID:', userResult.id);
    console.log('订单详情:', {
      duration: userResult.duration,
      amount: userResult.amount,
      status: userResult.status
    });
    
    // 清理
    await supabase
      .from('orders_optimized')
      .delete()
      .eq('id', userResult.id);
    
    return true;
  }
}

async function runAllTests() {
  const autoIdSuccess = await testAutoIdNow();
  console.log('\n' + '='.repeat(50) + '\n');
  const userSuccess = await finalTest();
  
  console.log('\n====== 最终结论 ======');
  if (autoIdSuccess && userSuccess) {
    console.log('🎉 序列问题已经解决！用户可以正常创建订单了！');
  } else {
    console.log('❌ 序列问题仍然存在，用户会遇到"数据已存在"错误');
    console.log('需要在数据库中执行: SELECT setval(\'orders_optimized_id_seq\', 400, false);');
  }
}

runAllTests();