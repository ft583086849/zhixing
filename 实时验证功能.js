// 在管理员页面控制台运行，实时验证功能是否生效

console.log('🔄 等待新部署生效...\n');
console.log('预计需要1-2分钟，请稍候...\n');

// 实时检查部署状态
async function checkDeploymentStatus() {
  const startTime = Date.now();
  let checkCount = 0;
  
  const checkInterval = setInterval(async () => {
    checkCount++;
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    
    console.log(`\n[${elapsed}秒] 第${checkCount}次检查...`);
    
    try {
      // 检查主页面是否更新
      const response = await fetch('https://zhixing-seven.vercel.app/', {
        cache: 'no-cache',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      
      const html = await response.text();
      
      // 查找JS文件版本
      const jsMatch = html.match(/main\.([a-z0-9]+)\.js/);
      if (jsMatch) {
        const currentVersion = jsMatch[1];
        console.log(`当前JS版本: main.${currentVersion}.js`);
        
        // 如果版本变化，说明部署生效
        if (window.lastVersion && window.lastVersion !== currentVersion) {
          console.log('✅ 检测到新版本！部署已生效');
          clearInterval(checkInterval);
          
          // 自动刷新页面
          console.log('3秒后自动刷新页面...');
          setTimeout(() => {
            location.reload(true);
          }, 3000);
          
          return;
        }
        
        window.lastVersion = currentVersion;
      }
      
    } catch (error) {
      console.error('检查失败:', error.message);
    }
    
    // 超过3分钟停止检查
    if (elapsed > 180) {
      console.log('⏱️ 检查超时，请手动刷新页面');
      clearInterval(checkInterval);
    }
    
  }, 10000); // 每10秒检查一次
}

// 快速测试搜索功能
window.quickTest = async function(wechatName) {
  console.log(`\n🧪 快速测试搜索: "${wechatName}"`);
  
  const token = localStorage.getItem('token');
  if (!token) {
    console.error('请先登录');
    return;
  }
  
  // 测试搜索
  const response = await fetch(`https://zhixing-seven.vercel.app/api/admin/sales?wechat_name=${encodeURIComponent(wechatName)}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Cache-Control': 'no-cache'
    }
  });
  
  const data = await response.json();
  const results = data.data || [];
  
  console.log(`搜索结果: ${results.length} 条`);
  
  // 显示结果
  const primary = results.filter(s => s.sales_type === 'primary');
  const secondary = results.filter(s => s.sales_type === 'secondary');
  
  console.log(`- 一级销售: ${primary.map(s => s.sales?.wechat_name).join(', ')}`);
  console.log(`- 二级销售: ${secondary.map(s => s.sales?.wechat_name).join(', ')}`);
  
  // 检查关联
  primary.forEach(p => {
    const related = secondary.filter(s => s.sales?.primary_sales_id === p.sales?.id);
    if (related.length > 0) {
      console.log(`✅ ${p.sales?.wechat_name} 的下属: ${related.map(s => s.sales?.wechat_name).join(', ')}`);
    }
  });
  
  return results.length > 0;
};

console.log('🚀 开始监控部署状态...');
console.log('💡 提示: 使用 quickTest("微信号") 快速测试搜索功能');

// 开始检查
checkDeploymentStatus();
