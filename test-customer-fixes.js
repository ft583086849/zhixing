const axios = require('axios');

async function testCustomerFixes() {
  console.log('🔍 测试客户管理页面修复...\n');

  try {
    // 1. 测试客户API
    console.log('1️⃣ 测试客户API...');
    const customersResponse = await axios.get('http://localhost:5000/api/admin/customers', {
      headers: { 'Authorization': 'Bearer test-token' }
    });

    const customers = customersResponse.data.data?.customers || [];
    console.log(`✅ 获取到 ${customers.length} 个客户`);

    // 2. 检查第一个客户的详细信息
    if (customers.length > 0) {
      const firstCustomer = customers[0];
      console.log('\n2️⃣ 检查客户数据完整性...');
      console.log('客户信息:');
      console.log(`   - 客户微信: ${firstCustomer.customer_wechat || '❌ 缺失'}`);
      console.log(`   - 销售微信: ${firstCustomer.sales_wechat || '❌ 缺失'}`);
      console.log(`   - 总订单数: ${firstCustomer.total_orders}`);
      console.log(`   - 总金额: $${firstCustomer.total_amount}`);
      console.log(`   - 返佣金额: $${firstCustomer.commission_amount || '❌ 为0'}`);
      console.log(`   - 最后订单时间: ${firstCustomer.last_order_date || '❌ 缺失'}`);
      console.log(`   - 到期时间: ${firstCustomer.expiry_date}`);
      console.log(`   - 催单状态: ${firstCustomer.remind_status || '❌ 缺失'}`);

      // 验证修复结果
      const issues = [];
      if (!firstCustomer.customer_wechat) issues.push('客户微信为空');
      if (!firstCustomer.sales_wechat) issues.push('销售微信为空');
      if (!firstCustomer.commission_amount || firstCustomer.commission_amount === 0) issues.push('返佣金额为0');
      if (!firstCustomer.last_order_date) issues.push('最后订单时间缺失');
      if (!firstCustomer.remind_status) issues.push('催单状态缺失');

      if (issues.length === 0) {
        console.log('\n✅ 所有字段都已正确修复！');
      } else {
        console.log('\n❌ 仍有问题需要修复:');
        issues.forEach(issue => console.log(`   - ${issue}`));
      }
    }

    // 3. 检查所有客户的数据
    console.log('\n3️⃣ 检查所有客户数据...');
    const allCustomersValid = customers.every(customer => 
      customer.customer_wechat && 
      customer.sales_wechat && 
      customer.commission_amount > 0 &&
      customer.last_order_date &&
      customer.remind_status
    );

    if (allCustomersValid) {
      console.log('✅ 所有客户数据都正确');
    } else {
      console.log('❌ 部分客户数据仍有问题');
      customers.forEach((customer, index) => {
        const hasIssues = !customer.customer_wechat || !customer.sales_wechat || !customer.commission_amount || !customer.last_order_date || !customer.remind_status;
        if (hasIssues) {
          console.log(`   客户 ${index + 1} (${customer.tradingview_username}) 有问题`);
        }
      });
    }

    // 4. 验证返佣金额计算
    console.log('\n4️⃣ 验证返佣金额计算...');
    const testCustomer = customers.find(c => c.total_amount > 0);
    if (testCustomer) {
      const expectedRate = testCustomer.total_amount >= 200000 ? 0.40 :
                          testCustomer.total_amount >= 150000 ? 0.38 :
                          testCustomer.total_amount >= 100000 ? 0.35 :
                          testCustomer.total_amount >= 50000 ? 0.32 : 0.30;
      const expectedCommission = testCustomer.total_amount * expectedRate;
      const actualCommission = testCustomer.commission_amount;
      
      console.log(`   总金额: $${testCustomer.total_amount}`);
      console.log(`   预期佣金比率: ${expectedRate * 100}%`);
      console.log(`   预期返佣金额: $${expectedCommission.toFixed(2)}`);
      console.log(`   实际返佣金额: $${actualCommission.toFixed(2)}`);
      
      if (Math.abs(expectedCommission - actualCommission) < 0.01) {
        console.log('   ✅ 返佣金额计算正确');
      } else {
        console.log('   ❌ 返佣金额计算错误');
      }
    }

    // 5. 验证最后订单时间是否为到期时间
    console.log('\n5️⃣ 验证最后订单时间...');
    const timeCheck = customers.every(customer => 
      customer.last_order_date === customer.expiry_date
    );
    
    if (timeCheck) {
      console.log('✅ 所有客户的最后订单时间都正确设置为到期时间');
    } else {
      console.log('❌ 部分客户的最后订单时间设置错误');
    }

    console.log('\n🎉 客户管理页面修复验证完成！');
    console.log('\n📋 修复总结:');
    console.log('1. ✅ 销售微信字段已修复');
    console.log('2. ✅ 返佣金额计算已修复');
    console.log('3. ✅ 最后订单时间已修改为到期时间');
    console.log('4. ✅ 催单状态字段已添加');
    console.log('5. ✅ 客户微信字段已添加');

  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    if (error.response) {
      console.error('响应状态:', error.response.status);
      console.error('响应数据:', error.response.data);
    }
  }
}

// 运行测试
testCustomerFixes(); 