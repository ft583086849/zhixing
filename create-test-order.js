const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

async function createTestOrder() {
  try {
    console.log('🔍 创建测试订单...\n');
    
    // 1. 管理员登录
    console.log('1️⃣ 管理员登录...');
    const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
      username: '知行',
      password: 'Zhixing Universal Trading Signal'
    });
    const token = loginResponse.data.data.token;
    console.log('✅ 登录成功');
    
    // 2. 创建销售记录
    console.log('2️⃣ 创建销售记录...');
    const salesResponse = await axios.post('http://localhost:5000/api/sales/create', {
      wechat_name: '测试销售',
      payment_method: 'alipay',
      payment_address: '752304285@qq.com',
      alipay_surname: '梁'
    }, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const salesId = salesResponse.data.data.id;
    console.log('✅ 销售记录创建成功，ID:', salesId);
    
    // 3. 获取销售链接
    console.log('3️⃣ 获取销售链接...');
    const linksResponse = await axios.get('http://localhost:5000/api/admin/links', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const links = linksResponse.data.data.links;
    if (links.length === 0) {
      console.log('❌ 没有找到销售链接，需要先创建');
      return;
    }
    
    const linkCode = links[0].link_code;
    console.log('✅ 找到销售链接:', linkCode);
    
    // 4. 创建测试订单
    console.log('4️⃣ 创建测试订单...');
    
    // 创建一个简单的测试图片（base64格式）
    const testImageBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
    
    const orderData = new FormData();
    orderData.append('link_code', linkCode);
    orderData.append('tradingview_username', 'testuser');
    orderData.append('duration', '1month');
    orderData.append('payment_method', 'alipay');
    orderData.append('payment_time', new Date().toISOString());
    orderData.append('purchase_type', 'immediate');
    
    // 创建一个测试图片文件
    const testImagePath = path.join(__dirname, 'test-screenshot.png');
    const imageBuffer = Buffer.from(testImageBase64.split(',')[1], 'base64');
    fs.writeFileSync(testImagePath, imageBuffer);
    
    orderData.append('screenshot', fs.createReadStream(testImagePath));
    
    const orderResponse = await axios.post('http://localhost:5000/api/orders/create', orderData, {
      headers: {
        ...orderData.getHeaders()
      }
    });
    
    console.log('✅ 测试订单创建成功');
    console.log('订单ID:', orderResponse.data.data.order_id);
    
    // 5. 验证订单和截图
    console.log('5️⃣ 验证订单和截图...');
    const ordersResponse = await axios.get('http://localhost:5000/api/admin/orders?page=1&limit=5', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const orders = ordersResponse.data.data.orders;
    console.log(`订单数量: ${orders.length}`);
    
    if (orders.length > 0) {
      const latestOrder = orders[0];
      console.log('最新订单信息:');
      console.log('- ID:', latestOrder.id);
      console.log('- 状态:', latestOrder.status);
      console.log('- 截图路径:', latestOrder.screenshot_path);
      
      if (latestOrder.screenshot_path) {
        console.log('✅ 截图路径存在，可以正常显示');
        
        // 测试截图访问
        try {
          const screenshotResponse = await axios.get(`http://localhost:5000${latestOrder.screenshot_path}`, {
            responseType: 'stream'
          });
          console.log('✅ 截图访问成功，大小:', screenshotResponse.headers['content-length'], 'bytes');
        } catch (error) {
          console.log('❌ 截图访问失败:', error.message);
        }
      }
    }
    
    // 清理测试文件
    fs.unlinkSync(testImagePath);
    
    console.log('\n🎉 测试完成！');
    console.log('现在您可以在管理员页面看到这个测试订单和截图了。');
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    if (error.response) {
      console.error('响应数据:', error.response.data);
    }
  }
}

setTimeout(createTestOrder, 2000); 