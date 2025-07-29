const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

async function testCompleteFlow() {
  try {
    console.log('🔍 开始完整流程测试...\n');
    
    // 1. 测试收款配置API
    console.log('1️⃣ 测试收款配置API...');
    const configResponse = await axios.get('http://localhost:5000/api/payment-config');
    console.log('✅ 收款配置获取成功');
    console.log(`- 支付宝账号: ${configResponse.data.data.alipay_account}`);
    console.log(`- 收款码图片: ${configResponse.data.data.alipay_qr_code ? '已配置' : '未配置'}\n`);
    
    // 2. 测试管理员登录
    console.log('2️⃣ 测试管理员登录...');
    const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
      username: '知行',
      password: 'Zhixing Universal Trading Signal'
    });
    console.log('✅ 管理员登录成功');
    const token = loginResponse.data.data.token;
    
    // 3. 测试获取订单列表
    console.log('3️⃣ 测试获取订单列表...');
    const ordersResponse = await axios.get('http://localhost:5000/api/admin/orders?page=1&limit=5', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    console.log('✅ 订单列表获取成功');
    console.log(`- 订单数量: ${ordersResponse.data.data.orders.length}`);
    
    // 检查是否有带截图的订单
    const ordersWithScreenshots = ordersResponse.data.data.orders.filter(order => order.screenshot_path);
    console.log(`- 带截图的订单: ${ordersWithScreenshots.length}个`);
    
    if (ordersWithScreenshots.length > 0) {
      console.log('📸 截图路径示例:');
      ordersWithScreenshots.slice(0, 3).forEach((order, index) => {
        console.log(`  ${index + 1}. ${order.screenshot_path}`);
      });
    }
    
    // 4. 测试截图访问
    if (ordersWithScreenshots.length > 0) {
      console.log('\n4️⃣ 测试截图访问...');
      const screenshotPath = ordersWithScreenshots[0].screenshot_path;
      try {
        const screenshotResponse = await axios.get(`http://localhost:5000${screenshotPath}`, {
          responseType: 'stream'
        });
        console.log('✅ 截图访问成功');
        console.log(`- 截图大小: ${screenshotResponse.headers['content-length']} bytes`);
      } catch (error) {
        console.log('❌ 截图访问失败:', error.message);
      }
    }
    
    console.log('\n🎉 测试完成！');
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    if (error.response) {
      console.error('响应数据:', error.response.data);
    }
  }
}

// 等待服务启动
setTimeout(testCompleteFlow, 3000); 