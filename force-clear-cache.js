const axios = require('axios');

async function forceClearCache() {
  console.log('🔥 强制清除浏览器缓存\n');
  
  try {
    // 1. 检查前端服务
    console.log('1️⃣ 检查前端服务...');
    const frontendResponse = await axios.get('http://localhost:3000/');
    console.log('✅ 前端服务正常');
    
    // 2. 检查JavaScript bundle的修改时间
    console.log('\n2️⃣ 检查JavaScript bundle...');
    try {
      const bundleResponse = await axios.get('http://localhost:3000/static/js/bundle.js');
      console.log('✅ JavaScript bundle可访问');
      console.log('Bundle大小:', (bundleResponse.data.length / 1024 / 1024).toFixed(2), 'MB');
      
      // 检查是否包含我们的调试代码
      const hasDebugCode = bundleResponse.data.includes('AdminOverview组件被加载了') && 
                          bundleResponse.data.includes('组件开始渲染');
      console.log('包含调试代码:', hasDebugCode ? '✅ 是' : '❌ 否');
      
    } catch (error) {
      console.log('❌ JavaScript bundle不可访问');
    }
    
    console.log('\n🎯 现在请按照以下步骤操作：');
    console.log('\n1️⃣ 强制清除浏览器缓存：');
    console.log('   - 按 Cmd+Shift+Delete (Mac)');
    console.log('   - 选择"所有时间"');
    console.log('   - 勾选"缓存的图片和文件"');
    console.log('   - 点击"清除数据"');
    
    console.log('\n2️⃣ 或者使用开发者工具：');
    console.log('   - 按 F12 打开开发者工具');
    console.log('   - 右键点击刷新按钮');
    console.log('   - 选择"清空缓存并硬性重新加载"');
    
    console.log('\n3️⃣ 或者使用快捷键：');
    console.log('   - 按 Cmd+Shift+R (Mac)');
    console.log('   - 这会强制刷新并清除缓存');
    
    console.log('\n4️⃣ 然后访问页面：');
    console.log('   - 访问：http://localhost:3000/#/admin');
    console.log('   - 使用登录信息：知行 / Zhixing Universal Trading Signal');
    
    console.log('\n🔍 清除缓存后应该能看到：');
    console.log('1. 🔥 红色的测试信息框："测试：AdminOverview组件正在渲染！"');
    console.log('2. 蓝色的调试信息框，显示数据状态');
    console.log('3. Console中的详细调试信息');
    console.log('4. "数据概览"标题和统计数据卡片');
    
    console.log('\n📋 如果清除缓存后还是看不到，说明：');
    console.log('1. 前端代码没有正确编译');
    console.log('2. 需要重启前端服务');
    console.log('3. 需要检查Console中的错误信息');
    
    console.log('\n💡 如果还是有问题，请告诉我：');
    console.log('1. 清除缓存后Console中有什么信息？');
    console.log('2. 是否看到了红色的测试框？');
    console.log('3. Network标签页是否有API请求？');
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
  }
}

forceClearCache(); 