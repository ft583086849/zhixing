const axios = require('axios');

async function forceClearCacheUltimate() {
  console.log('🔥 终极强制清除缓存 - 解决白板问题\n');
  
  try {
    // 1. 检查前端服务
    console.log('1️⃣ 检查前端服务...');
    const frontendResponse = await axios.get('http://localhost:3000/');
    console.log('✅ 前端服务正常');
    
    // 2. 检查JavaScript bundle
    console.log('\n2️⃣ 检查JavaScript bundle...');
    try {
      const bundleResponse = await axios.get('http://localhost:3000/static/js/bundle.js');
      console.log('✅ JavaScript bundle可访问');
      console.log('Bundle大小:', (bundleResponse.data.length / 1024 / 1024).toFixed(2), 'MB');
      
      // 检查是否包含我们的调试代码
      const hasDebugCode = bundleResponse.data.includes('AdminOverview组件被加载了') && 
                          bundleResponse.data.includes('组件开始渲染') &&
                          bundleResponse.data.includes('ff6b6b');
      console.log('包含完整调试代码:', hasDebugCode ? '✅ 是' : '❌ 否');
      
      if (!hasDebugCode) {
        console.log('🚨 问题确认：JavaScript bundle不包含最新调试代码！');
        console.log('这说明浏览器在使用缓存的旧版本代码。');
      }
      
    } catch (error) {
      console.log('❌ JavaScript bundle不可访问');
    }
    
    console.log('\n🎯 现在请按照以下步骤操作：');
    
    console.log('\n方法1️⃣ - 强制清除所有浏览器数据（推荐）：');
    console.log('1. 按 Cmd+Shift+Delete (Mac)');
    console.log('2. 选择"所有时间"');
    console.log('3. 勾选所有选项：');
    console.log('   - 浏览记录');
    console.log('   - Cookie及其他网站数据');
    console.log('   - 缓存的图片和文件');
    console.log('   - 密码及其他登录数据');
    console.log('   - 网站设置');
    console.log('4. 点击"清除数据"');
    console.log('5. 完全关闭浏览器');
    console.log('6. 重新打开浏览器');
    
    console.log('\n方法2️⃣ - 使用无痕模式（推荐）：');
    console.log('1. 按 Cmd+Shift+N (Mac) 打开无痕窗口');
    console.log('2. 访问：http://localhost:3000/#/admin');
    console.log('3. 使用登录信息：知行 / Zhixing Universal Trading Signal');
    
    console.log('\n方法3️⃣ - 强制刷新：');
    console.log('1. 按 Cmd+Shift+R (Mac) 强制刷新');
    console.log('2. 这会强制清除缓存并重新加载');
    
    console.log('\n方法4️⃣ - 开发者工具强制清除：');
    console.log('1. 按 F12 打开开发者工具');
    console.log('2. 右键点击刷新按钮');
    console.log('3. 选择"清空缓存并硬性重新加载"');
    
    console.log('\n🔍 清除缓存后应该能看到：');
    console.log('1. 🔥 红色的测试信息框："测试：AdminOverview组件正在渲染！"');
    console.log('2. 蓝色的调试信息框，显示数据状态');
    console.log('3. Console中的详细调试信息：');
    console.log('   - "🔍 AdminOverview: 组件开始渲染"');
    console.log('   - "🔍 adminSlice: 开始调用getStats API"');
    console.log('   - "🔍 adminSlice: getStats API调用成功"');
    console.log('4. "数据概览"标题和统计数据卡片');
    
    console.log('\n📊 预期看到的统计数据：');
    console.log('- 总订单数：1');
    console.log('- 待支付订单：0');
    console.log('- 待配置订单：0');
    console.log('- 已确认订单：1');
    console.log('- 总金额：$0.00');
    
    console.log('\n🚨 如果还是看不到，说明：');
    console.log('1. 浏览器缓存没有完全清除');
    console.log('2. 需要重启前端服务');
    console.log('3. 需要检查Console中的错误信息');
    
    console.log('\n💡 如果还是有问题，请告诉我：');
    console.log('1. 清除缓存后Console中有什么信息？');
    console.log('2. 是否看到了红色的测试框？');
    console.log('3. Network标签页是否有API请求？');
    console.log('4. 是否尝试了无痕模式？');
    
    console.log('\n🎯 现在就去清除浏览器缓存，然后告诉我结果！');
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
  }
}

forceClearCacheUltimate(); 