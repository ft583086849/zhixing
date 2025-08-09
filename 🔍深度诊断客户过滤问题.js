/**
 * 深度诊断为什么"89一级下的直接购买"在客户管理页面看不到
 * 清除缓存后还是看不到，需要检查更深层的问题
 */

// 在浏览器控制台执行此代码

async function deepDiagnosis() {
  console.log('=== 深度诊断客户过滤问题 ===\n');
  
  try {
    // 1. 直接查询订单表
    console.log('1. 直接从Supabase查询订单...');
    const supabaseClient = window.supabaseClient;
    
    if (!supabaseClient) {
      console.error('❌ Supabase客户端未初始化');
      return;
    }
    
    // 查询所有订单，不加任何过滤条件
    const { data: allOrders, error: allError } = await supabaseClient
      .from('orders')
      .select('*')
      .order('id', { ascending: false })
      .limit(100);
    
    if (allError) {
      console.error('查询订单失败:', allError);
      return;
    }
    
    console.log(`✅ 查询到 ${allOrders?.length || 0} 个订单`);
    
    // 2. 查找订单ID 72
    const order72 = allOrders?.find(o => o.id === 72);
    if (order72) {
      console.log('\n2. 找到订单ID 72:');
      console.log('  - ID:', order72.id);
      console.log('  - customer_wechat:', order72.customer_wechat);
      console.log('  - tradingview_username:', order72.tradingview_username);
      console.log('  - sales_code:', order72.sales_code);
      console.log('  - status:', order72.status);
      console.log('  - amount:', order72.amount);
      console.log('  - created_at:', order72.created_at);
    } else {
      console.log('❌ 没有找到订单ID 72');
    }
    
    // 3. 查找所有包含"直接购买"的订单
    console.log('\n3. 查找所有包含"直接购买"的订单...');
    const directPurchaseOrders = allOrders?.filter(o => 
      o.customer_wechat && o.customer_wechat.includes('直接购买')
    ) || [];
    
    console.log(`找到 ${directPurchaseOrders.length} 个包含"直接购买"的订单:`);
    directPurchaseOrders.forEach(o => {
      console.log(`  - ID ${o.id}: "${o.customer_wechat}" (status: ${o.status})`);
    });
    
    // 4. 模拟getCustomers的处理逻辑
    console.log('\n4. 模拟getCustomers函数的处理逻辑...');
    const customerMap = new Map();
    let processedOrders = [];
    let skippedOrders = [];
    
    allOrders?.forEach(order => {
      const customerWechat = order.customer_wechat || '';
      const tradingviewUser = order.tradingview_username || '';
      const key = `${customerWechat}-${tradingviewUser}`;
      
      // 这是api.js第254行的条件
      if (!customerMap.has(key) && (customerWechat || tradingviewUser)) {
        customerMap.set(key, {
          id: order.id,
          customer_wechat: customerWechat,
          tradingview_username: tradingviewUser,
          sales_code: order.sales_code,
          status: order.status
        });
        processedOrders.push(order);
        
        // 特别标记我们关注的订单
        if (order.id === 72 || (customerWechat && customerWechat.includes('直接购买'))) {
          console.log(`  ✅ 处理订单ID ${order.id}: "${customerWechat}" -> key: "${key}"`);
        }
      } else {
        skippedOrders.push(order);
        
        // 记录为什么被跳过
        if (order.id === 72 || (customerWechat && customerWechat.includes('直接购买'))) {
          const reason = customerMap.has(key) ? 'key已存在' : '无customer_wechat和tradingview_username';
          console.log(`  ❌ 跳过订单ID ${order.id}: "${customerWechat}" (原因: ${reason})`);
          
          if (customerMap.has(key)) {
            const existing = customerMap.get(key);
            console.log(`     已存在的记录: ID ${existing.id}, status: ${existing.status}`);
          }
        }
      }
    });
    
    console.log(`\n处理结果统计:`);
    console.log(`  - 处理了 ${processedOrders.length} 个订单`);
    console.log(`  - 跳过了 ${skippedOrders.length} 个订单`);
    console.log(`  - 生成了 ${customerMap.size} 个唯一客户`);
    
    // 5. 检查目标客户是否在最终列表中
    console.log('\n5. 检查目标客户是否在最终列表中...');
    const targetKeys = [
      '89一级下的直接购买-',
      '89一级下的直接购买-undefined',
      '89一级下的直接购买-null',
      '89一级下的直接购买-'
    ];
    
    targetKeys.forEach(key => {
      if (customerMap.has(key)) {
        const customer = customerMap.get(key);
        console.log(`  ✅ 找到key "${key}":`, customer);
      }
    });
    
    // 搜索所有包含"89"或"直接购买"的客户
    const relatedCustomers = Array.from(customerMap.entries()).filter(([key, value]) => 
      key.includes('89') || key.includes('直接购买')
    );
    
    if (relatedCustomers.length > 0) {
      console.log(`\n找到 ${relatedCustomers.length} 个相关客户:`);
      relatedCustomers.forEach(([key, value]) => {
        console.log(`  - Key: "${key}"`);
        console.log(`    Data:`, value);
      });
    } else {
      console.log('\n❌ 没有找到包含"89"或"直接购买"的客户');
    }
    
    // 6. 检查AdminAPI.getCustomers
    console.log('\n6. 调用AdminAPI.getCustomers...');
    if (window.AdminAPI) {
      const customers = await window.AdminAPI.getCustomers();
      console.log(`AdminAPI返回 ${customers?.length || 0} 个客户`);
      
      const targetCustomer = customers?.find(c => 
        c.customer_wechat && c.customer_wechat.includes('89一级下的直接购买')
      );
      
      if (targetCustomer) {
        console.log('✅ 在AdminAPI结果中找到目标客户:', targetCustomer);
      } else {
        console.log('❌ 在AdminAPI结果中没有找到目标客户');
      }
    } else {
      console.log('⚠️ AdminAPI未定义，需要导入');
    }
    
  } catch (error) {
    console.error('诊断过程出错:', error);
  }
}

// 执行诊断
deepDiagnosis();


