const axios = require('axios');

async function testDirectRender() {
  console.log('🔧 测试直接渲染 - 方案4实施\n');
  
  try {
    // 1. 检查前端服务
    console.log('1️⃣ 检查前端服务...');
    const frontendResponse = await axios.get('http://localhost:3000/');
    console.log('✅ 前端服务正常');
    
    // 2. 等待编译完成
    console.log('\n2️⃣ 等待编译完成...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // 3. 检查JavaScript bundle
    console.log('\n3️⃣ 检查JavaScript bundle...');
    try {
      const bundleResponse = await axios.get('http://localhost:3000/static/js/bundle.js');
      console.log('✅ JavaScript bundle可访问');
      
      // 检查是否包含直接渲染测试代码
      const hasDirectRender = bundleResponse.data.includes('直接渲染组件（不通过路由）') && 
                             bundleResponse.data.includes('4CAF50');
      console.log('包含直接渲染测试代码:', hasDirectRender ? '✅ 是' : '❌ 否');
      
      if (hasDirectRender) {
        console.log('🎉 太好了！直接渲染测试代码已经成功添加！');
      }
      
    } catch (error) {
      console.log('❌ JavaScript bundle不可访问');
    }
    
    console.log('\n🎯 现在请按照以下步骤操作：');
    
    console.log('\n1️⃣ 访问页面：');
    console.log('   - 访问：http://localhost:3000/#/admin');
    console.log('   - 如果已登录，直接进入数据概览页面');
    console.log('   - 如果未登录，使用：知行 / Zhixing Universal Trading Signal');
    
    console.log('\n2️⃣ 观察结果：');
    console.log('   - 如果看到绿色、红色、绿色、蓝色的测试框，说明直接渲染正常');
    console.log('   - 如果还是只有橙色框，说明简化组件有问题');
    console.log('   - 如果看到错误信息，请告诉我具体内容');
    
    console.log('\n3️⃣ 预期结果：');
    console.log('   - 橙色框：🔥 AdminDashboardPage Content区域测试');
    console.log('   - 绿色框：🧪 测试：直接渲染组件（不通过路由）');
    console.log('   - 红色框：🔥 简化测试组件 - 如果你看到这个，说明组件渲染正常！');
    console.log('   - 绿色框：✅ 组件渲染成功！这说明基本的React渲染没有问题');
    console.log('   - 蓝色框：📊 数据概览页面 简化版本 - 用于测试渲染');
    console.log('   - 蓝色框：📋 路由测试区域（暂时注释）');
    
    console.log('\n💡 如果看到所有测试框：');
    console.log('   说明简化组件渲染正常，问题在React Router的嵌套路由');
    console.log('   我们可以修复路由配置');
    
    console.log('\n💡 如果只看到橙色框：');
    console.log('   说明简化组件本身有问题');
    console.log('   可能是组件代码或依赖的问题');
    
    console.log('\n💡 如果看到错误信息：');
    console.log('   请告诉我具体的错误内容');
    console.log('   这样我们就能准确定位问题');
    
    console.log('\n🎉 现在请访问页面，然后告诉我结果！');
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
  }
}

testDirectRender(); 