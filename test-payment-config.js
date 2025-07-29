const axios = require('axios');

async function testPaymentConfig() {
  try {
    console.log('🔍 测试收款配置API...');
    
    // 测试获取收款配置
    const response = await axios.get('http://localhost:5000/api/payment-config');
    console.log('✅ 获取收款配置成功:');
    console.log(JSON.stringify(response.data, null, 2));
    
    // 检查是否有支付宝收款码
    if (response.data.success && response.data.data) {
      const config = response.data.data;
      console.log('\n📱 支付宝收款码状态:');
      console.log(`- 支付宝账号: ${config.alipay_account}`);
      console.log(`- 收款人姓氏: ${config.alipay_surname}`);
      console.log(`- 收款码图片: ${config.alipay_qr_code ? '已配置' : '未配置'}`);
      
      if (config.alipay_qr_code) {
        console.log(`- 收款码长度: ${config.alipay_qr_code.length} 字符`);
      }
    }
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    if (error.response) {
      console.error('响应数据:', error.response.data);
    }
  }
}

// 等待服务启动
setTimeout(testPaymentConfig, 5000); 