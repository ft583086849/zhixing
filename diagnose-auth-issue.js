const axios = require('axios');

async function diagnoseAuthIssue() {
  console.log('🔍 诊断认证问题 - 登录页面一闪而过\n');
  
  try {
    // 1. 检查前端服务
    console.log('1️⃣ 检查前端服务...');
    const frontendResponse = await axios.get('http://localhost:3000/');
    console.log('✅ 前端服务正常');
    
    // 2. 检查后端服务
    console.log('\n2️⃣ 检查后端服务...');
    const backendResponse = await axios.get('http://localhost:5000/api/health');
    console.log('✅ 后端服务正常');
    console.log('后端响应:', backendResponse.data);
    
    // 3. 尝试登录获取新token
    console.log('\n3️⃣ 尝试登录获取新token...');
    try {
      const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
        username: '知行',
        password: 'Zhixing Universal Trading Signal'
      });
      
      console.log('✅ 登录成功');
      console.log('Token:', loginResponse.data.data.token.substring(0, 20) + '...');
      console.log('Admin:', loginResponse.data.data.admin.username);
      
      const token = loginResponse.data.data.token;
      
      // 4. 验证token
      console.log('\n4️⃣ 验证token...');
      const verifyResponse = await axios.get('http://localhost:5000/api/auth/verify', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('✅ Token验证成功');
      console.log('Admin信息:', verifyResponse.data.data.admin.username);
      
      // 5. 测试admin/stats接口
      console.log('\n5️⃣ 测试admin/stats接口...');
      const statsResponse = await axios.get('http://localhost:5000/api/admin/stats', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('✅ Admin stats接口正常');
      console.log('Stats数据:', JSON.stringify(statsResponse.data, null, 2));
      
      console.log('\n🎯 问题分析：');
      console.log('1. 后端API都正常工作');
      console.log('2. 登录和token验证都成功');
      console.log('3. Admin stats数据正常返回');
      console.log('4. 问题可能在前端认证状态管理');
      
      console.log('\n🔧 解决方案：');
      console.log('1. 清除浏览器localStorage');
      console.log('2. 重新登录');
      console.log('3. 检查Redux状态');
      
      console.log('\n📋 操作步骤：');
      console.log('1. 打开浏览器开发者工具 (F12)');
      console.log('2. 进入Application/Storage标签');
      console.log('3. 找到Local Storage');
      console.log('4. 删除所有项目');
      console.log('5. 刷新页面');
      console.log('6. 重新登录');
      
      console.log('\n💡 或者使用以下命令清除localStorage：');
      console.log('在浏览器控制台执行：');
      console.log('localStorage.clear();');
      console.log('location.reload();');
      
    } catch (error) {
      console.log('❌ 登录失败:', error.response?.data?.message || error.message);
    }
    
  } catch (error) {
    console.error('❌ 诊断失败:', error.message);
  }
}

diagnoseAuthIssue(); 