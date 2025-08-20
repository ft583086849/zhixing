// 在浏览器控制台运行此脚本，详细检查佣金数据问题

console.log('🔍 开始检查销售返佣数据...\n');

// 1. 直接调用API查看原始返回数据
console.log('📡 步骤1: 调用API获取统计数据');
console.log('=' .repeat(60));

fetch('/api/admin/stats', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('admin_token') || localStorage.getItem('token')}`
  },
  body: JSON.stringify({
    timeRange: 'all',
    usePaymentTime: true
  })
})
.then(response => response.json())
.then(data => {
  console.log('✅ API返回的完整数据:');
  console.log(data);
  
  console.log('\n📊 佣金相关字段分析:');
  console.log('--------------------------------');
  console.log(`total_commission: ${data.total_commission}`);
  console.log(`commission_amount: ${data.commission_amount}`);
  console.log(`pending_commission: ${data.pending_commission}`);
  console.log(`pending_commission_amount: ${data.pending_commission_amount}`);
  console.log(`paid_commission_amount: ${data.paid_commission_amount}`);
  
  console.log('\n📈 其他统计数据:');
  console.log('--------------------------------');
  console.log(`valid_orders: ${data.valid_orders}`);
  console.log(`total_amount: ${data.total_amount}`);
  console.log(`paid_amount: ${data.paid_amount}`);
  console.log(`primary_sales_count: ${data.primary_sales_count}`);
  console.log(`secondary_sales_count: ${data.secondary_sales_count}`);
  
  // 2. 调用销售API查看销售数据
  console.log('\n📡 步骤2: 调用销售API查看原始数据');
  console.log('=' .repeat(60));
  
  return fetch('/api/admin/sales', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('admin_token') || localStorage.getItem('token')}`
    }
  });
})
.then(response => response.json())
.then(salesData => {
  console.log('✅ 销售API返回的数据:');
  
  if (salesData.success && salesData.data) {
    console.log(`总销售数: ${salesData.data.length}`);
    
    // 计算总佣金
    let totalCommission = 0;
    let totalPaid = 0;
    
    console.log('\n前5个销售的佣金数据:');
    salesData.data.slice(0, 5).forEach((sale, index) => {
      console.log(`\n${index + 1}. ${sale.wechat_name || sale.name}`);
      console.log(`   sales_code: ${sale.sales_code}`);
      console.log(`   total_amount: ${sale.total_amount}`);
      console.log(`   total_commission: ${sale.total_commission}`);
      console.log(`   commission_amount: ${sale.commission_amount}`);
      console.log(`   primary_commission_amount: ${sale.primary_commission_amount}`);
      console.log(`   secondary_commission_amount: ${sale.secondary_commission_amount}`);
      console.log(`   paid_commission: ${sale.paid_commission}`);
    });
    
    // 计算所有销售的总佣金
    salesData.data.forEach(sale => {
      const commission = sale.total_commission || sale.commission_amount || 0;
      const paid = sale.paid_commission || 0;
      totalCommission += commission;
      totalPaid += paid;
    });
    
    console.log('\n💰 从销售数据计算的总佣金:');
    console.log('--------------------------------');
    console.log(`应返佣金总额: $${totalCommission.toFixed(2)}`);
    console.log(`已返佣金总额: $${totalPaid.toFixed(2)}`);
    console.log(`待返佣金总额: $${(totalCommission - totalPaid).toFixed(2)}`);
  }
  
  // 3. 检查Redux Store
  console.log('\n📡 步骤3: 检查Redux Store中的数据');
  console.log('=' .repeat(60));
  
  if (window.store) {
    const state = window.store.getState();
    if (state.admin && state.admin.stats) {
      console.log('Redux中的stats数据:');
      console.log(`total_commission: ${state.admin.stats.total_commission}`);
      console.log(`commission_amount: ${state.admin.stats.commission_amount}`);
      console.log(`pending_commission: ${state.admin.stats.pending_commission}`);
    } else {
      console.log('❌ Redux中没有stats数据');
    }
  } else {
    console.log('❌ 无法访问Redux store');
  }
  
  // 4. 检查页面DOM显示
  console.log('\n📡 步骤4: 检查页面DOM元素');
  console.log('=' .repeat(60));
  
  const statisticDivs = document.querySelectorAll('.ant-statistic');
  let foundCommission = false;
  
  statisticDivs.forEach(div => {
    const title = div.querySelector('.ant-statistic-title');
    const value = div.querySelector('.ant-statistic-content-value');
    
    if (title && title.textContent.includes('销售返佣')) {
      foundCommission = true;
      console.log('找到销售返佣元素:');
      console.log(`  标题: ${title.textContent}`);
      console.log(`  显示值: ${value ? value.textContent : '无'}`);
      
      // 获取实际数值
      if (value) {
        const spans = value.querySelectorAll('span');
        spans.forEach(span => {
          console.log(`    span内容: ${span.textContent}`);
        });
      }
    }
  });
  
  if (!foundCommission) {
    console.log('❌ 页面上未找到"销售返佣"元素');
  }
  
  // 5. 直接调用优化后的销售API
  console.log('\n📡 步骤5: 调用优化后的销售API');
  console.log('=' .repeat(60));
  
  return fetch('/api/admin/sales-optimized', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('admin_token') || localStorage.getItem('token')}`
    },
    body: JSON.stringify({})
  });
})
.then(response => response.json())
.then(optimizedData => {
  console.log('✅ 优化API返回的数据:');
  
  if (optimizedData.success && optimizedData.data) {
    console.log(`总销售数: ${optimizedData.data.length}`);
    
    // 计算总佣金
    let totalCommission = 0;
    let totalPaid = 0;
    
    optimizedData.data.forEach(sale => {
      const commission = sale.total_commission || 0;
      const paid = sale.paid_commission || 0;
      totalCommission += commission;
      totalPaid += paid;
    });
    
    console.log('\n💰 从优化API计算的总佣金:');
    console.log('--------------------------------');
    console.log(`应返佣金总额: $${totalCommission.toFixed(2)}`);
    console.log(`已返佣金总额: $${totalPaid.toFixed(2)}`);
    console.log(`待返佣金总额: $${(totalCommission - totalPaid).toFixed(2)}`);
  }
  
  console.log('\n\n🔍 诊断结果总结:');
  console.log('=' .repeat(60));
  console.log('请检查以上数据，找出以下问题:');
  console.log('1. API返回的total_commission是否为0？');
  console.log('2. 销售表中的total_commission字段是否有值？');
  console.log('3. Redux中的数据是否正确？');
  console.log('4. 页面显示的值是否与API返回值一致？');
})
.catch(error => {
  console.error('❌ 执行过程出错:', error);
});