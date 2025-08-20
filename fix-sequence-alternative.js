const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './client/.env' });

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function alternativeSequenceFix() {
  console.log('====== 尝试其他序列修复方法 ======\n');
  
  try {
    // 1. 查找当前序列的"空档"
    console.log('1. 查找ID序列空档：');
    const { data: recentIds, error: idsError } = await supabase
      .from('orders_optimized')
      .select('id')
      .order('id', { ascending: false })
      .limit(20);
    
    if (idsError) {
      console.error('查询ID失败:', idsError);
      return;
    }
    
    const ids = recentIds.map(r => r.id).sort((a, b) => a - b);
    console.log('最近20个ID:', ids);
    
    // 寻找空档
    let availableId = null;
    for (let i = ids[0]; i < ids[ids.length - 1]; i++) {
      if (!ids.includes(i)) {
        availableId = i;
        console.log('找到可用ID:', i);
        break;
      }
    }
    
    // 2. 如果没有空档，尝试更高的ID
    if (!availableId) {
      console.log('没有找到空档，尝试更高的ID...');
      const maxId = Math.max(...ids);
      
      // 尝试从 maxId + 10 开始
      for (let testId = maxId + 10; testId < maxId + 100; testId++) {
        console.log(`测试ID ${testId}...`);
        
        const testOrder = {
          id: testId, // 显式指定ID
          order_number: `TEST_${testId}_${Date.now()}`,
          created_at: new Date().toISOString(),
          status: 'pending',
          payment_status: 'pending',
          sales_code: 'TEST',
          customer_name: 'test_user',
          tradingview_username: `test_${testId}`,
          duration: '7天',
          purchase_type: 'immediate',
          amount: 0,
          actual_payment_amount: 0,
          commission_rate: 0,
          commission_amount: 0,
          primary_commission_amount: 0,
          secondary_commission_amount: 0
        };
        
        const { data: testResult, error: testError } = await supabase
          .from('orders_optimized')
          .insert([testOrder])
          .select('id');
        
        if (testError) {
          console.log(`ID ${testId} 失败:`, testError.message);
          continue;
        } else {
          console.log(`✅ 成功使用ID ${testId}`);
          availableId = testId;
          
          // 清理测试记录
          await supabase
            .from('orders_optimized')
            .delete()
            .eq('id', testId);
          console.log('✅ 测试记录已清理');
          break;
        }
      }
    }
    
    if (availableId) {
      console.log(`\n🎯 发现序列问题的解决方案：`);
      console.log(`使用ID ${availableId} 可以正常创建记录`);
      console.log(`这表明序列值需要设置为至少 ${availableId + 1}`);
      
      // 3. 尝试创建一个临时记录来"推进"序列
      console.log('\n3. 尝试推进序列：');
      const pushOrder = {
        id: availableId + 50, // 用一个更大的ID
        order_number: `PUSH_SEQ_${Date.now()}`,
        created_at: new Date().toISOString(),
        status: 'pending',
        payment_status: 'pending',
        sales_code: 'PUSH',
        customer_name: 'push_sequence',
        tradingview_username: `push_${Date.now()}`,
        duration: '7天',
        purchase_type: 'immediate',
        amount: 0,
        actual_payment_amount: 0,
        commission_rate: 0,
        commission_amount: 0,
        primary_commission_amount: 0,
        secondary_commission_amount: 0
      };
      
      const { data: pushResult, error: pushError } = await supabase
        .from('orders_optimized')
        .insert([pushOrder])
        .select('id');
      
      if (pushError) {
        console.error('推进序列失败:', pushError.message);
      } else {
        console.log('✅ 成功推进序列到ID:', pushResult[0].id);
        
        // 清理推进记录
        await supabase
          .from('orders_optimized')
          .delete()
          .eq('id', pushResult[0].id);
        
        // 4. 现在测试正常的自动ID分配
        console.log('\n4. 测试自动ID分配：');
        const normalOrder = {
          // 不指定ID，让数据库自动分配
          order_number: `AUTO_${Date.now()}`,
          created_at: new Date().toISOString(),
          status: 'pending',
          payment_status: 'pending',
          sales_code: 'AUTO',
          customer_name: 'auto_test',
          tradingview_username: `auto_${Date.now()}`,
          duration: '7天',
          purchase_type: 'immediate',
          amount: 0,
          actual_payment_amount: 0,
          commission_rate: 0,
          commission_amount: 0,
          primary_commission_amount: 0,
          secondary_commission_amount: 0
        };
        
        const { data: autoResult, error: autoError } = await supabase
          .from('orders_optimized')
          .insert([normalOrder])
          .select('id');
        
        if (autoError) {
          console.error('❌ 自动ID分配仍失败:', autoError.message);
          return false;
        } else {
          console.log('✅ 自动ID分配成功！新ID:', autoResult[0].id);
          
          // 清理测试记录
          await supabase
            .from('orders_optimized')
            .delete()
            .eq('id', autoResult[0].id);
          console.log('✅ 测试记录已清理');
          return true;
        }
      }
    } else {
      console.log('❌ 找不到可用的ID，序列问题严重');
      return false;
    }
    
  } catch (error) {
    console.error('修复过程出错:', error);
    return false;
  }
}

alternativeSequenceFix();