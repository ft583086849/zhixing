// 在管理员页面控制台运行此脚本验证修复

console.log('=== 开始验证销售搜索修复 ===');

// 1. 获取store
const store = window.store || window.__REDUX_STORE__;
if (!store) {
  console.error('❌ Redux store未找到，请在管理员页面运行');
  return;
}

// 2. 测试搜索功能
async function testSearch(wechatName) {
  console.log(`\n📡 测试搜索: "${wechatName}"`);
  
  // 调用搜索
  await store.dispatch({
    type: 'admin/getSales/pending'
  });
  
  // 模拟API调用
  const token = localStorage.getItem('token');
  const response = await fetch(`https://zhixing-seven.vercel.app/api/admin/sales?wechat_name=${encodeURIComponent(wechatName)}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  
  if (!response.ok) {
    console.error('❌ API调用失败:', response.status);
    return;
  }
  
  const data = await response.json();
  console.log('✅ API响应:', data);
  
  // 分析结果
  if (data && data.data) {
    const results = data.data;
    console.log(`📊 搜索结果: ${results.length} 条`);
    
    // 显示一级销售
    const primarySales = results.filter(s => s.sales_type === 'primary');
    console.log(`\n一级销售 (${primarySales.length} 条):`);
    primarySales.forEach(s => {
      console.log(`  - ${s.sales?.wechat_name} (${s.sales?.sales_code})`);
    });
    
    // 显示二级销售
    const secondarySales = results.filter(s => s.sales_type === 'secondary');
    console.log(`\n二级销售 (${secondarySales.length} 条):`);
    secondarySales.forEach(s => {
      const parentInfo = s.sales?.primary_sales_id ? `[上级ID: ${s.sales?.primary_sales_id}]` : '[独立]';
      console.log(`  - ${s.sales?.wechat_name} (${s.sales?.sales_code}) ${parentInfo}`);
    });
    
    // 验证关联关系
    console.log('\n🔗 验证关联关系:');
    primarySales.forEach(primary => {
      const relatedSecondary = secondarySales.filter(s => 
        s.sales?.primary_sales_id === primary.sales?.id
      );
      if (relatedSecondary.length > 0) {
        console.log(`✅ ${primary.sales?.wechat_name} 的下属 (${relatedSecondary.length} 个):`);
        relatedSecondary.forEach(s => {
          console.log(`    - ${s.sales?.wechat_name}`);
        });
      }
    });
    
    return results.length > 0;
  }
  
  return false;
}

// 3. 运行测试
async function runTests() {
  console.log('\n🧪 开始测试...\n');
  
  // 测试1: 搜索一级销售（应该包含其下属）
  const test1Name = prompt('请输入一个一级销售的微信号（用于测试）:');
  if (test1Name) {
    const result1 = await testSearch(test1Name);
    if (result1) {
      console.log('✅ 测试1通过: 搜索一级销售返回了结果');
    } else {
      console.log('⚠️ 测试1: 未找到数据');
    }
  }
  
  // 测试2: 搜索二级销售
  const test2Name = prompt('请输入一个二级销售的微信号（用于测试）:');
  if (test2Name) {
    const result2 = await testSearch(test2Name);
    if (result2) {
      console.log('✅ 测试2通过: 搜索二级销售返回了结果');
    } else {
      console.log('⚠️ 测试2: 未找到数据');
    }
  }
  
  console.log('\n=== 测试完成 ===');
  console.log('如果搜索一级销售时包含了其下属的二级销售，说明修复成功！');
}

// 执行测试
runTests();
