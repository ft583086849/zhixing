require('dotenv').config({ path: './client/.env' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY
);

async function checkSyncAndDataFlow() {
  console.log('检查数据同步机制和数据流向');
  console.log('='.repeat(100));
  
  // 1. 测试触发器是否工作
  console.log('【一、测试触发器是否工作】');
  console.log('-'.repeat(100));
  
  // 获取orders表和orders_optimized表的最后一条相同记录
  const { data: lastSyncedOrder } = await supabase
    .from('orders_optimized')
    .select('id, order_number, created_at, updated_at')
    .order('id', { ascending: false })
    .limit(1)
    .single();
  
  console.log('orders_optimized表最后一条记录:');
  console.log(`  ID: ${lastSyncedOrder?.id}`);
  console.log(`  订单号: ${lastSyncedOrder?.order_number}`);
  console.log(`  创建时间: ${lastSyncedOrder ? new Date(lastSyncedOrder.created_at).toLocaleString('zh-CN') : 'N/A'}`);
  console.log(`  更新时间: ${lastSyncedOrder ? new Date(lastSyncedOrder.updated_at).toLocaleString('zh-CN') : 'N/A'}`);
  
  // 检查orders表中对应的记录
  if (lastSyncedOrder) {
    const { data: ordersRecord } = await supabase
      .from('orders')
      .select('id, order_number, created_at, updated_at')
      .eq('id', lastSyncedOrder.id)
      .single();
    
    console.log('\norders表中对应记录:');
    console.log(`  ID: ${ordersRecord?.id}`);
    console.log(`  更新时间: ${ordersRecord ? new Date(ordersRecord.updated_at).toLocaleString('zh-CN') : 'N/A'}`);
    
    if (ordersRecord && ordersRecord.updated_at !== lastSyncedOrder.updated_at) {
      console.log('  ⚠️ 两表更新时间不一致，可能触发器有问题');
    }
  }
  
  // 2. 检查缺失订单的特征
  console.log('\n【二、分析缺失订单的特征】');
  console.log('-'.repeat(100));
  
  const missingIds = [315, 316, 317, 318, 319, 320, 321, 322, 323, 324, 325, 326, 327];
  const { data: missingOrders } = await supabase
    .from('orders')
    .select('*')
    .in('id', missingIds);
  
  console.log('缺失的订单详情:');
  console.log('ID | 用户 | 金额 | 一级销售ID | 二级销售ID | 创建时间 | 销售代码');
  console.log('-'.repeat(100));
  
  missingOrders?.forEach(order => {
    console.log(`${order.id} | ${order.tradingview_username} | $${order.amount} | ${order.primary_sales_id || '无'} | ${order.secondary_sales_id || '无'} | ${new Date(order.created_at).toLocaleString('zh-CN')} | ${order.sales_code?.substring(0, 10) || '无'}...`);
  });
  
  // 检查这些订单的创建模式
  const createdDates = new Set();
  missingOrders?.forEach(order => {
    const date = new Date(order.created_at).toLocaleDateString('zh-CN');
    createdDates.add(date);
  });
  
  console.log('\n缺失订单的创建日期分布:');
  Array.from(createdDates).forEach(date => {
    const count = missingOrders?.filter(o => new Date(o.created_at).toLocaleDateString('zh-CN') === date).length;
    console.log(`  ${date}: ${count}条`);
  });
  
  // 3. 同步缺失的订单
  console.log('\n【三、同步缺失的订单到orders_optimized表】');
  console.log('-'.repeat(100));
  
  let syncSuccess = 0;
  let syncFailed = 0;
  
  for (const order of missingOrders || []) {
    // 检查是否已存在
    const { data: existing } = await supabase
      .from('orders_optimized')
      .select('id')
      .eq('id', order.id)
      .single();
    
    if (!existing) {
      // 插入到orders_optimized
      const { error } = await supabase
        .from('orders_optimized')
        .insert([order]);
      
      if (!error) {
        console.log(`✅ 同步订单 ${order.id} 成功`);
        syncSuccess++;
      } else {
        console.log(`❌ 同步订单 ${order.id} 失败: ${error.message}`);
        syncFailed++;
      }
    } else {
      console.log(`⏭️ 订单 ${order.id} 已存在，跳过`);
    }
  }
  
  console.log(`\n同步结果: ${syncSuccess}个成功, ${syncFailed}个失败`);
  
  // 4. 验证同步后的数据
  console.log('\n【四、验证同步后的数据】');
  console.log('-'.repeat(100));
  
  const { count: ordersCount } = await supabase
    .from('orders')
    .select('*', { count: 'exact', head: true });
  
  const { count: optimizedCount } = await supabase
    .from('orders_optimized')
    .select('*', { count: 'exact', head: true });
  
  console.log(`orders表: ${ordersCount}条记录`);
  console.log(`orders_optimized表: ${optimizedCount}条记录`);
  console.log(`差异: ${ordersCount - optimizedCount}条`);
  
  if (ordersCount === optimizedCount) {
    console.log('✅ 两表数据已同步');
  } else {
    console.log('⚠️ 仍有数据不一致');
  }
}

checkSyncAndDataFlow();