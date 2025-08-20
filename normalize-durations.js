/**
 * 规范化购买时长字段数据
 * 将duration字段规范化为: 0.25(7天), 3(3个月), 6(6个月), 12(1年)
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ksacrjrgmcbdwwjrkcws.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtzYWNyanJnbWNiZHd3anJrY3dzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDk4OTk4MDMsImV4cCI6MjAyNTQ3NTgwM30.tHBHWNjBQ3A3JJSZ3tVE_RGkP_YfzJJ2rjQjhQZhRZ8';

const supabase = createClient(supabaseUrl, supabaseKey);

async function normalizeDurations() {
  console.log('🔧 开始规范化购买时长数据...\n');
  
  try {
    // 1. 首先获取所有订单
    console.log('1️⃣ 获取所有订单数据...');
    const { data: orders, error: fetchError } = await supabase
      .from('orders_optimized')
      .select('id, duration, order_number, tradingview_username');
      
    if (fetchError) {
      console.error('获取订单失败:', fetchError);
      return;
    }
    
    console.log(`找到 ${orders.length} 个订单\n`);
    
    // 2. 统计当前duration分布
    console.log('2️⃣ 当前duration分布:');
    const currentDistribution = {};
    orders.forEach(order => {
      const duration = order.duration || 'null';
      currentDistribution[duration] = (currentDistribution[duration] || 0) + 1;
    });
    
    Object.entries(currentDistribution)
      .sort((a, b) => parseFloat(a[0]) - parseFloat(b[0]))
      .forEach(([duration, count]) => {
        console.log(`  ${duration}个月: ${count}条`);
      });
    
    // 3. 规范化映射规则
    console.log('\n3️⃣ 应用映射规则:');
    console.log('  <= 2个月 -> 0.25 (7天试用)');
    console.log('  3个月 -> 3 (3个月)');
    console.log('  4-5个月 -> 6 (6个月)');
    console.log('  6个月 -> 6 (6个月)');
    console.log('  7-11个月 -> 12 (1年)');
    console.log('  >= 12个月 -> 12 (1年)');
    
    // 4. 批量更新订单
    console.log('\n4️⃣ 开始更新订单...');
    let updateCount = 0;
    let errorCount = 0;
    
    for (const order of orders) {
      let newDuration;
      const oldDuration = order.duration;
      
      // 映射规则
      if (oldDuration === null || oldDuration === undefined) {
        newDuration = 3; // 默认3个月
      } else if (oldDuration <= 2) {
        newDuration = 0.25; // 7天试用
      } else if (oldDuration === 3) {
        newDuration = 3; // 3个月
      } else if (oldDuration <= 5) {
        newDuration = 6; // 6个月
      } else if (oldDuration === 6) {
        newDuration = 6; // 6个月
      } else if (oldDuration < 12) {
        newDuration = 12; // 1年
      } else {
        newDuration = 12; // 1年
      }
      
      // 只更新需要变更的记录
      if (oldDuration !== newDuration) {
        const { error: updateError } = await supabase
          .from('orders_optimized')
          .update({ duration: newDuration })
          .eq('id', order.id);
          
        if (updateError) {
          console.error(`  ❌ 更新订单 ${order.order_number} 失败:`, updateError.message);
          errorCount++;
        } else {
          updateCount++;
          if (updateCount % 50 === 0) {
            console.log(`  已更新 ${updateCount} 条记录...`);
          }
        }
      }
    }
    
    console.log(`\n✅ 更新完成: 成功 ${updateCount} 条, 失败 ${errorCount} 条`);
    
    // 5. 验证更新后的分布
    console.log('\n5️⃣ 验证更新后的分布:');
    const { data: updatedOrders, error: verifyError } = await supabase
      .from('orders_optimized')
      .select('duration');
      
    if (!verifyError && updatedOrders) {
      const newDistribution = {};
      updatedOrders.forEach(order => {
        const duration = order.duration;
        const label = 
          duration === 0.25 ? '7天试用' :
          duration === 3 ? '3个月' :
          duration === 6 ? '6个月' :
          duration === 12 ? '1年' : `${duration}个月`;
        newDistribution[label] = (newDistribution[label] || 0) + 1;
      });
      
      Object.entries(newDistribution).forEach(([label, count]) => {
        console.log(`  ${label}: ${count}条`);
      });
    }
    
    // 6. 同步更新orders表
    console.log('\n6️⃣ 同步更新orders表...');
    updateCount = 0;
    errorCount = 0;
    
    const { data: ordersToSync, error: syncFetchError } = await supabase
      .from('orders')
      .select('id, duration');
      
    if (!syncFetchError && ordersToSync) {
      for (const order of ordersToSync) {
        let newDuration;
        const oldDuration = order.duration;
        
        // 相同的映射规则
        if (oldDuration === null || oldDuration === undefined) {
          newDuration = 3;
        } else if (oldDuration <= 2) {
          newDuration = 0.25;
        } else if (oldDuration === 3) {
          newDuration = 3;
        } else if (oldDuration <= 5) {
          newDuration = 6;
        } else if (oldDuration === 6) {
          newDuration = 6;
        } else if (oldDuration < 12) {
          newDuration = 12;
        } else {
          newDuration = 12;
        }
        
        if (oldDuration !== newDuration) {
          const { error: updateError } = await supabase
            .from('orders')
            .update({ duration: newDuration })
            .eq('id', order.id);
            
          if (updateError) {
            errorCount++;
          } else {
            updateCount++;
          }
        }
      }
      
      console.log(`  orders表更新完成: 成功 ${updateCount} 条, 失败 ${errorCount} 条`);
    }
    
    console.log('\n🎉 购买时长数据规范化完成！');
    
  } catch (error) {
    console.error('❌ 执行失败:', error);
  }
}

// 执行规范化
normalizeDurations();