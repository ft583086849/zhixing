// 修复认证问题的验证脚本
(async () => {
  console.log('========================================');
  console.log('🔍 开始验证（修复认证版）');
  console.log('========================================');
  
  // 1. 先检查当前登录状态
  console.log('\n🔐 1. 检查登录状态...');
  const token = localStorage.getItem('token') || localStorage.getItem('admin_token');
  const adminInfo = localStorage.getItem('adminInfo');
  
  console.log('Token存在:', !!token);
  console.log('Token长度:', token ? token.length : 0);
  console.log('AdminInfo:', adminInfo);
  
  if (!token) {
    console.error('❌ 未找到token，请重新登录');
    console.log('建议：刷新页面重新登录');
    return;
  }
  
  // 2. 测试API认证
  console.log('\n🔑 2. 测试API认证...');
  try {
    // 尝试不同的认证方式
    const headers1 = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
    
    const headers2 = {
      'x-auth-token': token,
      'Content-Type': 'application/json'
    };
    
    console.log('尝试方式1: Bearer token...');
    let response = await fetch('/api/admin/stats', {
      method: 'GET',
      headers: headers1,
      credentials: 'include'
    });
    
    if (response.status === 403) {
      console.log('Bearer token失败，尝试方式2: x-auth-token...');
      response = await fetch('/api/admin/stats', {
        method: 'GET',
        headers: headers2,
        credentials: 'include'
      });
    }
    
    console.log('响应状态:', response.status);
    console.log('响应headers:', response.headers);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ API认证成功，数据:', data);
      
      // 3. 检查关键字段
      console.log('\n📊 3. 检查关键字段...');
      console.log('总佣金 (total_commission):', data.total_commission);
      console.log('已返佣金 (paid_commission):', data.paid_commission);
      console.log('待返佣金 (计算值):', (data.total_commission || 0) - (data.paid_commission || 0));
      
      // 4. 检查销售层级
      console.log('\n📈 4. 销售层级统计...');
      console.log('一级销售数量:', data.primary_sales_count);
      console.log('一级销售业绩:', data.primary_sales_amount);
      console.log('二级销售数量:', data.linked_secondary_sales_count);
      console.log('二级销售业绩:', data.linked_secondary_sales_amount);
      
    } else {
      console.error('❌ API认证失败:', response.status, response.statusText);
      const text = await response.text();
      console.error('错误响应:', text);
    }
  } catch (error) {
    console.error('❌ API调用失败:', error);
  }
  
  // 5. 直接从Redux获取数据（如果有）
  console.log('\n🗃️ 5. 尝试从Redux Store获取数据...');
  
  // 尝试从React DevTools获取
  try {
    const reactRoot = document.getElementById('root');
    if (reactRoot && reactRoot._reactRootContainer) {
      const fiber = reactRoot._reactRootContainer._internalRoot.current;
      let node = fiber;
      while (node) {
        if (node.memoizedState && node.memoizedState.store) {
          const state = node.memoizedState.store.getState();
          console.log('找到Redux State:', state);
          if (state.admin) {
            console.log('Admin state:', state.admin);
            if (state.admin.stats) {
              console.log('Stats数据:', state.admin.stats);
            }
            if (state.admin.sales) {
              console.log('Sales数量:', state.admin.sales.length);
            }
          }
          break;
        }
        node = node.child;
      }
    }
  } catch (e) {
    console.log('无法从React DevTools获取');
  }
  
  // 6. 检查页面实际显示
  console.log('\n🖥️ 6. 检查页面实际显示...');
  
  // 查找所有统计卡片
  const allStats = document.querySelectorAll('.ant-statistic');
  allStats.forEach(stat => {
    const title = stat.querySelector('.ant-statistic-title')?.textContent;
    const value = stat.querySelector('.ant-statistic-content')?.textContent;
    if (title && title.includes('佣金')) {
      console.log(`${title}: ${value}`);
    }
  });
  
  // 查找销售层级统计
  const cards = document.querySelectorAll('.ant-card');
  cards.forEach(card => {
    const hasStats = card.querySelector('.ant-statistic');
    if (hasStats) {
      const titles = card.querySelectorAll('.ant-statistic-title');
      titles.forEach(title => {
        if (title.textContent.includes('销售') || title.textContent.includes('业绩')) {
          const value = title.nextElementSibling?.textContent;
          console.log(`${title.textContent}: ${value}`);
        }
      });
    }
  });
  
  console.log('\n========================================');
  console.log('✅ 验证完成');
  console.log('========================================');
})();