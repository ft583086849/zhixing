// 在浏览器控制台运行此脚本验证部署版本和功能

console.log('🔍 开始验证部署版本和功能...\n');

// 1. 检查代码版本
async function checkCodeVersion() {
  console.log('📦 检查部署的代码版本...');
  
  try {
    // 获取JS文件查看是否包含修复的代码
    const response = await fetch('/static/js/main.*.js');
    const jsFiles = document.querySelectorAll('script[src*="static/js/main"]');
    
    if (jsFiles.length > 0) {
      const mainJsUrl = jsFiles[0].src;
      console.log('主JS文件:', mainJsUrl);
      
      // 获取JS内容
      const jsResponse = await fetch(mainJsUrl);
      const jsContent = await jsResponse.text();
      
      // 检查关键修复代码
      const hasOldBug = jsContent.includes('SupabaseService.getPrimarySales(),SupabaseService.getSecondarySales()');
      const hasNewFix = jsContent.includes('primaryQuery.then') || jsContent.includes('secondaryQuery.then');
      
      if (hasOldBug) {
        console.error('❌ 检测到旧版本代码（包含bug）');
        console.log('建议：清除Vercel缓存并重新部署');
        return false;
      }
      
      if (hasNewFix) {
        console.log('✅ 检测到新版本代码（已修复）');
        return true;
      }
      
      console.warn('⚠️ 无法确定代码版本');
    }
  } catch (error) {
    console.warn('⚠️ 无法检查代码版本:', error.message);
  }
  
  return null;
}

// 2. 测试API功能
async function testAPIFunction() {
  console.log('\n📡 测试API搜索功能...');
  
  const token = localStorage.getItem('token');
  if (!token) {
    console.error('❌ 未登录，请先登录管理员账号');
    return false;
  }
  
  // 获取所有销售数据
  console.log('获取所有销售...');
  const allResponse = await fetch('https://zhixing-seven.vercel.app/api/admin/sales', {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  
  if (!allResponse.ok) {
    console.error('❌ 无法获取销售数据');
    return false;
  }
  
  const allData = await allResponse.json();
  console.log(`✅ 获取到 ${allData.data?.length || 0} 条销售数据`);
  
  // 找一个一级销售来测试
  const primarySales = allData.data?.filter(s => s.sales_type === 'primary') || [];
  if (primarySales.length === 0) {
    console.warn('⚠️ 没有一级销售数据，无法测试');
    return null;
  }
  
  const testPrimary = primarySales[0];
  console.log(`\n测试搜索一级销售: ${testPrimary.sales?.wechat_name}`);
  
  // 搜索这个一级销售
  const searchResponse = await fetch(`https://zhixing-seven.vercel.app/api/admin/sales?wechat_name=${encodeURIComponent(testPrimary.sales?.wechat_name)}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  
  if (!searchResponse.ok) {
    console.error('❌ 搜索API调用失败');
    return false;
  }
  
  const searchData = await searchResponse.json();
  const searchResults = searchData.data || [];
  console.log(`搜索结果: ${searchResults.length} 条`);
  
  // 分析搜索结果
  const foundPrimary = searchResults.filter(s => s.sales_type === 'primary');
  const foundSecondary = searchResults.filter(s => s.sales_type === 'secondary');
  const relatedSecondary = foundSecondary.filter(s => 
    s.sales?.primary_sales_id === testPrimary.sales?.id
  );
  
  console.log(`- 一级销售: ${foundPrimary.length} 条`);
  console.log(`- 二级销售: ${foundSecondary.length} 条`);
  console.log(`- 相关二级销售: ${relatedSecondary.length} 条`);
  
  if (relatedSecondary.length > 0) {
    console.log('✅ 功能正常：搜索一级销售时包含了其下属二级销售');
    relatedSecondary.forEach(s => {
      console.log(`  - ${s.sales?.wechat_name}`);
    });
    return true;
  } else if (foundPrimary.length > 0) {
    console.warn('⚠️ 找到了一级销售，但没有包含其下属（可能该销售没有下属）');
    return null;
  } else {
    console.error('❌ 搜索功能异常');
    return false;
  }
}

// 3. 清除缓存建议
function showCacheClearGuide() {
  console.log('\n🧹 清除缓存方法：');
  console.log('1. 浏览器端:');
  console.log('   - Ctrl+Shift+R (Windows) 或 Cmd+Shift+R (Mac) 强制刷新');
  console.log('   - 开发者工具 > Network > 勾选 Disable cache');
  console.log('   - 清除浏览器缓存和Cookie');
  console.log('\n2. Vercel端:');
  console.log('   - 访问 Vercel 控制台');
  console.log('   - 进入项目设置');
  console.log('   - Functions > Purge Cache');
  console.log('   - 或重新部署: Deployments > Redeploy');
}

// 4. 执行所有检查
async function runAllChecks() {
  console.log('='.repeat(50));
  
  // 检查代码版本
  const versionOK = await checkCodeVersion();
  
  // 测试API功能
  const apiOK = await testAPIFunction();
  
  // 总结
  console.log('\n' + '='.repeat(50));
  console.log('📊 检查结果总结：');
  
  if (versionOK === false || apiOK === false) {
    console.error('❌ 发现问题，需要处理缓存');
    showCacheClearGuide();
    
    console.log('\n💡 快速解决方案：');
    console.log('1. 在Vercel控制台点击 "Redeploy" 按钮');
    console.log('2. 选择最新的提交 (3b6e76d)');
    console.log('3. 等待部署完成后再测试');
  } else if (versionOK === true && apiOK === true) {
    console.log('✅ 一切正常！功能已经生效');
  } else {
    console.warn('⚠️ 无法完全确定状态');
    console.log('建议手动测试搜索功能');
  }
  
  console.log('='.repeat(50));
}

// 运行检查
runAllChecks();
