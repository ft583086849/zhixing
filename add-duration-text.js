/**
 * 添加duration_text文本字段并规范化时长数据
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ksacrjrgmcbdwwjrkcws.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtzYWNyanJnbWNiZHd3anJrY3dzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDk4OTk4MDMsImV4cCI6MjAyNTQ3NTgwM30.tHBHWNjBQ3A3JJSZ3tVE_RGkP_YfzJJ2rjQjhQZhRZ8';

const supabase = createClient(supabaseUrl, supabaseKey);

async function addDurationText() {
  console.log('📝 添加duration_text字段并规范化时长数据...\n');
  
  try {
    // 1. 获取所有订单数据
    console.log('1️⃣ 获取orders_optimized表数据...');
    const { data: optimizedOrders, error: fetchError1 } = await supabase
      .from('orders_optimized')
      .select('id, duration, order_number');
      
    if (fetchError1) {
      console.error('获取orders_optimized失败:', fetchError1);
      return;
    }
    
    console.log(`  找到 ${optimizedOrders.length} 条记录\n`);
    
    console.log('2️⃣ 获取orders表数据...');
    const { data: orders, error: fetchError2 } = await supabase
      .from('orders')
      .select('id, duration, order_number');
      
    if (fetchError2) {
      console.error('获取orders失败:', fetchError2);
      return;
    }
    
    console.log(`  找到 ${orders.length} 条记录\n`);
    
    // 2. 更新orders_optimized表
    console.log('3️⃣ 更新orders_optimized表...');
    let updateCount = 0;
    let errorCount = 0;
    
    for (const order of optimizedOrders) {
      let durationText;
      let standardDuration;
      
      // 根据duration值确定文本和标准数值
      if (order.duration === null || order.duration === undefined) {
        durationText = '3个月';
        standardDuration = 3;
      } else if (order.duration < 0.5 || order.duration === 0.25) {
        durationText = '7天';
        standardDuration = 0.25;
      } else if (order.duration >= 0.5 && order.duration <= 2) {
        durationText = '1个月';
        standardDuration = 1;
      } else if (order.duration > 2 && order.duration <= 4.5) {
        durationText = '3个月';
        standardDuration = 3;
      } else if (order.duration > 4.5 && order.duration < 9) {
        durationText = '6个月';
        standardDuration = 6;
      } else {
        durationText = '1年';
        standardDuration = 12;
      }
      
      // 更新记录
      const { error: updateError } = await supabase
        .from('orders_optimized')
        .update({ 
          duration: standardDuration,
          duration_text: durationText 
        })
        .eq('id', order.id);
        
      if (updateError) {
        // 如果duration_text字段不存在，可能会报错
        if (updateError.message.includes('column') && updateError.message.includes('duration_text')) {
          console.log('\n⚠️  duration_text字段不存在，需要先添加字段');
          console.log('请在Supabase Dashboard执行以下SQL:');
          console.log('ALTER TABLE orders_optimized ADD COLUMN duration_text VARCHAR(20);');
          console.log('ALTER TABLE orders ADD COLUMN duration_text VARCHAR(20);');
          return;
        }
        errorCount++;
      } else {
        updateCount++;
        if (updateCount % 50 === 0) {
          console.log(`  已更新 ${updateCount} 条...`);
        }
      }
    }
    
    console.log(`  ✅ orders_optimized更新完成: ${updateCount} 条成功, ${errorCount} 条失败\n`);
    
    // 3. 更新orders表
    console.log('4️⃣ 更新orders表...');
    updateCount = 0;
    errorCount = 0;
    
    for (const order of orders) {
      let durationText;
      let standardDuration;
      
      // 根据duration值确定文本和标准数值
      if (order.duration === null || order.duration === undefined) {
        durationText = '3个月';
        standardDuration = 3;
      } else if (order.duration < 0.5 || order.duration === 0.25) {
        durationText = '7天';
        standardDuration = 0.25;
      } else if (order.duration >= 0.5 && order.duration <= 2) {
        durationText = '1个月';
        standardDuration = 1;
      } else if (order.duration > 2 && order.duration <= 4.5) {
        durationText = '3个月';
        standardDuration = 3;
      } else if (order.duration > 4.5 && order.duration < 9) {
        durationText = '6个月';
        standardDuration = 6;
      } else {
        durationText = '1年';
        standardDuration = 12;
      }
      
      // 更新记录
      const { error: updateError } = await supabase
        .from('orders')
        .update({ 
          duration: standardDuration,
          duration_text: durationText 
        })
        .eq('id', order.id);
        
      if (updateError) {
        errorCount++;
      } else {
        updateCount++;
        if (updateCount % 50 === 0) {
          console.log(`  已更新 ${updateCount} 条...`);
        }
      }
    }
    
    console.log(`  ✅ orders更新完成: ${updateCount} 条成功, ${errorCount} 条失败\n`);
    
    // 4. 验证结果
    console.log('5️⃣ 验证更新结果...');
    const { data: verifyData, error: verifyError } = await supabase
      .from('orders_optimized')
      .select('duration, duration_text')
      .limit(20);
      
    if (!verifyError && verifyData) {
      console.log('\n示例数据:');
      const grouped = {};
      verifyData.forEach(item => {
        const key = `${item.duration} -> ${item.duration_text || '(空)'}`;
        grouped[key] = (grouped[key] || 0) + 1;
      });
      
      Object.entries(grouped).forEach(([key, count]) => {
        console.log(`  ${key}: ${count}条`);
      });
    }
    
    console.log('\n✅ 完成！duration_text字段已添加并规范化');
    console.log('\n标准时长值:');
    console.log('  0.25 -> 7天');
    console.log('  1 -> 1个月');
    console.log('  3 -> 3个月');
    console.log('  6 -> 6个月');
    console.log('  12 -> 1年');
    
  } catch (error) {
    console.error('❌ 执行失败:', error);
  }
}

// 执行
addDurationText();