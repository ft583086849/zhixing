// 在管理员页面控制台运行此脚本测试所有重置功能

console.log('🔍 开始测试管理系统重置功能...\n');

// 测试销售管理页面的重置
async function testSalesReset() {
  console.log('📊 测试销售管理页面重置...');
  
  const token = localStorage.getItem('token');
  if (!token) {
    console.error('❌ 未登录，请先登录管理员账号');
    return false;
  }
  
  try {
    // 1. 先进行一次搜索
    console.log('1️⃣ 执行搜索（只搜索一级销售）...');
    const searchResponse = await fetch('https://zhixing-seven.vercel.app/api/admin/sales?sales_type=primary', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    const searchData = await searchResponse.json();
    const searchCount = searchData.data?.length || 0;
    console.log(`搜索结果: ${searchCount} 条（只有一级销售）`);
    
    // 2. 执行重置（获取所有数据）
    console.log('2️⃣ 执行重置（应该获取所有销售）...');
    const resetResponse = await fetch('https://zhixing-seven.vercel.app/api/admin/sales', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache'
      }
    });
    
    const resetData = await resetResponse.json();
    const resetCount = resetData.data?.length || 0;
    const primaryCount = resetData.data?.filter(s => s.sales_type === 'primary').length || 0;
    const secondaryCount = resetData.data?.filter(s => s.sales_type === 'secondary').length || 0;
    
    console.log(`重置后结果: 总计 ${resetCount} 条`);
    console.log(`  - 一级销售: ${primaryCount} 条`);
    console.log(`  - 二级销售: ${secondaryCount} 条`);
    
    // 3. 验证结果
    if (resetCount > searchCount) {
      console.log('✅ 销售管理重置功能正常（重置后显示了更多数据）');
      return true;
    } else if (resetCount === 0) {
      console.error('❌ 销售管理重置功能异常（没有返回数据）');
      return false;
    } else {
      console.warn('⚠️ 销售管理重置功能可能有问题（数据量没有增加）');
      return null;
    }
    
  } catch (error) {
    console.error('❌ 测试失败:', error);
    return false;
  }
}

// 测试客户管理页面的重置
async function testCustomersReset() {
  console.log('\n👥 测试客户管理页面重置...');
  
  const token = localStorage.getItem('token');
  
  try {
    // 1. 先进行搜索
    console.log('1️⃣ 执行搜索（搜索特定客户）...');
    const searchResponse = await fetch('https://zhixing-seven.vercel.app/api/admin/customers?customer_wechat=test', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    const searchData = await searchResponse.json();
    const searchCount = searchData.data?.length || 0;
    console.log(`搜索结果: ${searchCount} 条`);
    
    // 2. 执行重置
    console.log('2️⃣ 执行重置（应该获取所有客户）...');
    const resetResponse = await fetch('https://zhixing-seven.vercel.app/api/admin/customers', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache'
      }
    });
    
    const resetData = await resetResponse.json();
    const resetCount = resetData.data?.length || 0;
    console.log(`重置后结果: ${resetCount} 条`);
    
    // 3. 验证结果
    if (resetCount >= searchCount) {
      console.log('✅ 客户管理重置功能正常');
      return true;
    } else {
      console.error('❌ 客户管理重置功能异常');
      return false;
    }
    
  } catch (error) {
    console.error('❌ 测试失败:', error);
    return false;
  }
}

// 测试订单管理页面的重置
async function testOrdersReset() {
  console.log('\n📦 测试订单管理页面重置...');
  
  const token = localStorage.getItem('token');
  
  try {
    // 1. 先进行搜索
    console.log('1️⃣ 执行搜索（只搜索待付款订单）...');
    const searchResponse = await fetch('https://zhixing-seven.vercel.app/api/admin/orders?status=pending_payment&page=1&limit=100', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    const searchData = await searchResponse.json();
    const searchCount = searchData.data?.length || 0;
    console.log(`搜索结果: ${searchCount} 条（只有待付款订单）`);
    
    // 2. 执行重置
    console.log('2️⃣ 执行重置（应该获取所有订单）...');
    const resetResponse = await fetch('https://zhixing-seven.vercel.app/api/admin/orders?page=1&limit=100', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache'
      }
    });
    
    const resetData = await resetResponse.json();
    const resetCount = resetData.data?.length || 0;
    const statusCounts = {};
    resetData.data?.forEach(order => {
      statusCounts[order.status] = (statusCounts[order.status] || 0) + 1;
    });
    
    console.log(`重置后结果: ${resetCount} 条`);
    console.log('状态分布:', statusCounts);
    
    // 3. 验证结果
    if (resetCount >= searchCount) {
      console.log('✅ 订单管理重置功能正常');
      return true;
    } else {
      console.error('❌ 订单管理重置功能异常');
      return false;
    }
    
  } catch (error) {
    console.error('❌ 测试失败:', error);
    return false;
  }
}

// 运行所有测试
async function runAllTests() {
  console.log('='.repeat(50));
  console.log('📋 测试管理系统所有重置功能');
  console.log('='.repeat(50));
  
  const results = {
    sales: await testSalesReset(),
    customers: await testCustomersReset(),
    orders: await testOrdersReset()
  };
  
  console.log('\n' + '='.repeat(50));
  console.log('📊 测试结果总结：');
  console.log('='.repeat(50));
  
  console.log(`销售管理重置: ${results.sales === true ? '✅ 正常' : results.sales === false ? '❌ 异常' : '⚠️ 需要检查'}`);
  console.log(`客户管理重置: ${results.customers ? '✅ 正常' : '❌ 异常'}`);
  console.log(`订单管理重置: ${results.orders ? '✅ 正常' : '❌ 异常'}`);
  
  if (Object.values(results).some(r => r === false)) {
    console.log('\n💡 建议解决方案：');
    console.log('1. 清除浏览器缓存 (Ctrl+Shift+R)');
    console.log('2. 检查是否有缓存导致的问题');
    console.log('3. 确认最新代码已部署');
  }
  
  console.log('='.repeat(50));
}

// 执行测试
runAllTests();
