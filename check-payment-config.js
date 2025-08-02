const axios = require('axios');

const baseURL = 'https://zhixing-seven.vercel.app/api';

async function checkPaymentConfig() {
  console.log('🔍 检查支付配置...');
  
  try {
    // 1. 先测试健康检查
    console.log('\n1. 测试健康检查...');
    const healthResponse = await axios.get(`${baseURL}/health`);
    console.log('✅ 健康检查通过:', healthResponse.data.message);
    
    // 2. 测试管理员登录获取token
    console.log('\n2. 获取管理员token...');
    const authResponse = await axios.post(`${baseURL}/auth?path=login`, {
      username: '知行',
      password: 'Zhixing Universal Trading Signal'
    });
    
    if (!authResponse.data.success) {
      console.log('❌ 管理员登录失败:', authResponse.data.message);
      return;
    }
    
    const token = authResponse.data.data.token;
    console.log('✅ 管理员登录成功');
    
    // 3. 测试支付配置API
    console.log('\n3. 测试支付配置API...');
    try {
      const configResponse = await axios.get(`${baseURL}/payment-config?path=get`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      console.log('✅ 支付配置API正常');
      console.log('📋 当前支付配置:');
      const config = configResponse.data.data;
      
      console.log(`   - 支付宝账号: ${config.alipay_account || '未设置'}`);
      console.log(`   - 支付宝姓氏: ${config.alipay_surname || '未设置'}`);
      console.log(`   - 支付宝收款码: ${config.alipay_qr_code ? '已设置' : '未设置'}`);
      if (config.alipay_qr_code) {
        console.log(`   - 收款码长度: ${config.alipay_qr_code.length} 字符`);
        console.log(`   - 收款码类型: ${config.alipay_qr_code.startsWith('data:') ? 'Base64图片' : 'URL链接'}`);
      }
      console.log(`   - 加密货币链名: ${config.crypto_chain_name || '未设置'}`);
      console.log(`   - 加密货币地址: ${config.crypto_address || '未设置'}`);
      console.log(`   - 加密货币收款码: ${config.crypto_qr_code ? '已设置' : '未设置'}`);
      if (config.crypto_qr_code) {
        console.log(`   - 加密货币收款码长度: ${config.crypto_qr_code.length} 字符`);
      }
      
    } catch (error) {
      console.log('❌ 支付配置API失败:', error.response?.data || error.message);
    }
    
  } catch (error) {
    console.log('❌ 检查失败:', error.message);
  }
}

checkPaymentConfig(); 