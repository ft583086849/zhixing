// 🔍深度排查054282b数据问题.js
// 排查销售微信号空值和数据概览为0的根本原因

console.log('=== 🔍 深度排查054282b数据问题 ===\n');

async function deepTroubleshooting() {
  try {
    if (typeof window === 'undefined' || !window.supabaseClient) {
      console.log('❌ Supabase客户端不可用');
      return;
    }

    console.log('✅ Supabase客户端可用\n');

    // === 1. 直接检查订单表数据 ===
    console.log('📊 === 直接检查订单表数据 ===');
    
    const { data: orders, error: ordersError } = await window.supabaseClient
      .from('orders')
      .select('*')
      .limit(5);
    
    if (ordersError) {
      console.log('❌ 订单表查询失败:', ordersError.message);
      return;
    }
    
    if (!orders || orders.length === 0) {
      console.log('❌ 订单表确实无数据');
      return;
    }
    
    console.log(`✅ 订单表有数据: ${orders.length} 条样本`);
    console.log('\n📋 订单表字段详情:');
    
    orders.forEach((order, index) => {
      console.log(`\n订单${index + 1}:`);
      console.log(`  ID: ${order.id}`);
      console.log(`  sales_code: ${order.sales_code || '空'}`);
      console.log(`  status: ${order.status || '空'}`);
      console.log(`  amount: ${order.amount || '空'}`);
      console.log(`  actual_payment_amount: ${order.actual_payment_amount || '空'}`);
      console.log(`  commission_amount: ${order.commission_amount || '空'}`);
      console.log(`  customer_wechat: ${order.customer_wechat || '空'}`);
      console.log(`  sales_wechat_name: ${order.sales_wechat_name || '空'}`);
      console.log(`  sales_name: ${order.sales_name || '空'}`);
      console.log(`  created_at: ${order.created_at || '空'}`);
      console.log(`  payment_time: ${order.payment_time || '空'}`);
      console.log(`  updated_at: ${order.updated_at || '空'}`);
    });

    // === 2. 检查销售表数据 ===
    console.log('\n👥 === 检查销售表数据 ===');
    
    const { data: primarySales } = await window.supabaseClient
      .from('primary_sales')
      .select('*')
      .limit(3);
      
    const { data: secondarySales } = await window.supabaseClient
      .from('secondary_sales')
      .select('*')
      .limit(3);
    
    console.log(`一级销售样本: ${primarySales?.length || 0} 条`);
    if (primarySales && primarySales.length > 0) {
      primarySales.forEach((sale, index) => {
        console.log(`\n一级销售${index + 1}:`);
        console.log(`  ID: ${sale.id}`);
        console.log(`  sales_code: ${sale.sales_code || '空'}`);
        console.log(`  wechat_name: ${sale.wechat_name || '空'}`);
        console.log(`  name: ${sale.name || '空'}`);
        console.log(`  phone: ${sale.phone || '空'}`);
      });
    }
    
    console.log(`\n二级销售样本: ${secondarySales?.length || 0} 条`);
    if (secondarySales && secondarySales.length > 0) {
      secondarySales.forEach((sale, index) => {
        console.log(`\n二级销售${index + 1}:`);
        console.log(`  ID: ${sale.id}`);
        console.log(`  sales_code: ${sale.sales_code || '空'}`);
        console.log(`  wechat_name: ${sale.wechat_name || '空'}`);
        console.log(`  name: ${sale.name || '空'}`);
        console.log(`  phone: ${sale.phone || '空'}`);
      });
    }

    // === 3. 测试sales_code关联逻辑 ===
    console.log('\n🔗 === 测试sales_code关联逻辑 ===');
    
    if (orders && orders.length > 0) {
      const allSales = [...(primarySales || []), ...(secondarySales || [])];
      
      console.log('\n🧪 测试关联结果:');
      orders.forEach(order => {
        if (order.sales_code) {
          const matchingSale = allSales.find(sale => sale.sales_code === order.sales_code);
          
          console.log(`\n订单sales_code: ${order.sales_code}`);
          if (matchingSale) {
            console.log(`  ✅ 找到匹配销售:`);
            console.log(`    wechat_name: ${matchingSale.wechat_name || '空'}`);
            console.log(`    name: ${matchingSale.name || '空'}`);
            console.log(`    phone: ${matchingSale.phone || '空'}`);
            
            // 测试我们的备选逻辑
            const finalWechatName = matchingSale.wechat_name || matchingSale.name || matchingSale.phone || `销售-${matchingSale.sales_code}`;
            console.log(`    最终微信号: ${finalWechatName}`);
          } else {
            console.log(`  ❌ 未找到匹配销售 - 这可能是问题所在!`);
          }
        } else {
          console.log(`\n订单无sales_code - 这可能是问题所在!`);
        }
      });
    }

    // === 4. 手动测试新的getStats API ===
    console.log('\n📈 === 手动测试新的getStats API ===');
    
    try {
      // 模拟新API的直接查询逻辑
      console.log('🔄 执行新API逻辑...');
      
      const { data: allOrders, error: statsError } = await window.supabaseClient
        .from('orders')
        .select('*');
      
      if (statsError) {
        console.log('❌ 新API查询失败:', statsError.message);
      } else {
        console.log(`✅ 新API查询成功: ${allOrders?.length || 0} 个订单`);
        
        if (allOrders && allOrders.length > 0) {
          // 手动计算统计
          const today = new Date().toDateString();
          
          const pending_payment = allOrders.filter(order => 
            ['pending_payment', 'pending', 'pending_review'].includes(order.status)
          ).length;
          
          const confirmed_payment = allOrders.filter(order => 
            ['confirmed_payment', 'confirmed'].includes(order.status)
          ).length;
          
          let total_amount = 0;
          allOrders.forEach(order => {
            const amount = parseFloat(order.actual_payment_amount || order.amount || 0);
            if (order.payment_method === 'alipay') {
              total_amount += (amount / 7.15);
            } else {
              total_amount += amount;
            }
          });
          
          console.log('\n📊 手动计算的统计结果:');
          console.log(`  总订单数: ${allOrders.length}`);
          console.log(`  待付款确认: ${pending_payment}`);
          console.log(`  已付款确认: ${confirmed_payment}`);
          console.log(`  总金额: $${total_amount.toFixed(2)}`);
          
          if (allOrders.length > 0 && total_amount === 0) {
            console.log('\n⚠️  订单有数据但总金额为0，可能原因:');
            console.log('  1. amount/actual_payment_amount字段都为空或0');
            console.log('  2. 数据类型转换问题');
            console.log('  3. 字段名不匹配');
          }
        }
      }
    } catch (apiError) {
      console.log('❌ 新API测试异常:', apiError.message);
    }

    // === 5. 检查Redux当前状态 ===
    console.log('\n🔄 === 检查Redux当前状态 ===');
    
    if (window.store) {
      const state = window.store.getState();
      const adminState = state.admin;
      
      console.log('\nRedux admin状态:');
      console.log(`  loading: ${adminState?.loading}`);
      console.log(`  orders数量: ${adminState?.orders?.length || 0}`);
      console.log(`  sales数量: ${adminState?.sales?.length || 0}`);
      console.log(`  customers数量: ${adminState?.customers?.length || 0}`);
      console.log(`  stats: ${adminState?.stats ? JSON.stringify(adminState.stats) : '无'}`);
      
      // 检查sales数据的微信号情况
      if (adminState?.sales && adminState.sales.length > 0) {
        console.log('\n👥 Redux中的销售数据微信号:');
        adminState.sales.slice(0, 3).forEach((sale, index) => {
          console.log(`  销售${index + 1}: sales_code=${sale.sales_code}, wechat_name=${sale.wechat_name || '空'}`);
        });
      }
      
      // 检查customers数据的微信号情况
      if (adminState?.customers && adminState.customers.length > 0) {
        console.log('\n👤 Redux中的客户数据微信号:');
        adminState.customers.slice(0, 3).forEach((customer, index) => {
          console.log(`  客户${index + 1}: sales_wechat_name=${customer.sales_wechat_name || '空'}`);
        });
      }
    }

    // === 6. 问题诊断结论 ===
    console.log('\n🎯 === 问题诊断结论 ===');
    
    console.log('\n可能的问题原因:');
    
    // 数据概览为0的可能原因
    if (orders && orders.length > 0) {
      console.log('\n📊 数据概览为0可能原因:');
      console.log('1. ❓ amount/actual_payment_amount字段为空或格式问题');
      console.log('2. ❓ 新API调用没有正确更新到Redux');
      console.log('3. ❓ 组件没有正确读取新的stats数据');
      console.log('4. ❓ 缓存问题导致显示旧数据');
    }
    
    // 销售微信号为空的可能原因
    console.log('\n👥 销售微信号为空可能原因:');
    console.log('1. ❓ primary_sales/secondary_sales表的wechat_name/name/phone字段都为空');
    console.log('2. ❓ sales_code关联不成功 (订单表sales_code与销售表不匹配)');
    console.log('3. ❓ AdminAPI.getSales()的修复逻辑没有生效');
    console.log('4. ❓ Redux没有正确更新销售数据');

    // === 7. 下一步调试建议 ===
    console.log('\n🔧 === 下一步调试建议 ===');
    
    console.log('\n需要用户配合的调试步骤:');
    console.log('1. 🔍 查看上面的订单表字段详情，告诉我:');
    console.log('   - sales_code是否有值?');
    console.log('   - amount/actual_payment_amount是否有值?');
    console.log('   - sales_wechat_name是否有值?');
    
    console.log('\n2. 🔍 查看销售表字段详情，告诉我:');
    console.log('   - wechat_name/name/phone是否有值?');
    console.log('   - sales_code与订单表是否匹配?');
    
    console.log('\n3. 🧪 我可以提供专门的修复脚本:');
    console.log('   - 强制刷新数据的脚本');
    console.log('   - 直接调用API的测试脚本');
    console.log('   - 字段映射修复脚本');

  } catch (error) {
    console.error('❌ 排查过程发生错误:', error);
  }
}

// 执行深度排查
deepTroubleshooting();

console.log('\n💻 使用说明:');
console.log('1. 在管理后台按F12打开控制台');
console.log('2. 粘贴此脚本并回车执行');
console.log('3. 查看详细的数据排查结果');
console.log('4. 告诉我具体的字段值情况');
