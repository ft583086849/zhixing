const axios = require('axios');
const colors = require('colors');

const BASE_URL = 'https://zhixing-seven.vercel.app';

// 简单测试函数
const testOrderCreation = async () => {
  console.log('🧪 测试修复后的订单创建...\n');
  
  try {
    // 1. 创建一级销售
    console.log('1. 创建测试一级销售...');
    const salesResponse = await axios.post(`${BASE_URL}/api/primary-sales?path=create`, {
      wechat_name: '修复测试01',
      sales_name: '测试用户',
      payment_method: 'alipay',
      payment_address: '18888888888',
      alipay_surname: '测'
    });
    
    if (salesResponse.data.success) {
      console.log('✅ 一级销售创建成功');
      console.log(`🔗 用户购买链接: ${salesResponse.data.data.user_sales_link}`);
      console.log(`👥 二级销售注册链接: ${salesResponse.data.data.secondary_registration_link}`);
      
      const salesCode = salesResponse.data.data.user_sales_code;
      
      // 2. 创建免费订单（测试状态设置）
      console.log('\n2. 创建7天免费订单...');
      const freeOrderResponse = await axios.post(`${BASE_URL}/api/orders?path=create`, {
        sales_code: salesCode,
        link_code: salesCode,
        tradingview_username: 'test_free_user',
        customer_wechat: '测试免费用户',
        duration: '7days',
        amount: 0,
        payment_method: 'free',
        payment_time: new Date().toISOString().slice(0, 19).replace('T', ' '),
        purchase_type: 'immediate'
      });
      
      if (freeOrderResponse.data.success) {
        console.log('✅ 免费订单创建成功');
        console.log(`📦 订单ID: ${freeOrderResponse.data.data.order_id}`);
      } else {
        console.log('❌ 免费订单创建失败:', freeOrderResponse.data.message);
      }
      
      // 3. 创建付费订单
      console.log('\n3. 创建付费订单...');
      const paidOrderResponse = await axios.post(`${BASE_URL}/api/orders?path=create`, {
        sales_code: salesCode,
        link_code: salesCode,
        tradingview_username: 'test_paid_user',
        customer_wechat: '测试付费用户',
        duration: '1month',
        amount: 188,
        payment_method: 'alipay',
        payment_time: new Date().toISOString().slice(0, 19).replace('T', ' '),
        purchase_type: 'immediate',
        alipay_amount: 188
      });
      
      if (paidOrderResponse.data.success) {
        console.log('✅ 付费订单创建成功');
        console.log(`📦 订单ID: ${paidOrderResponse.data.data.order_id}`);
      } else {
        console.log('❌ 付费订单创建失败:', paidOrderResponse.data.message);
      }
      
      console.log('\n🎯 测试链接访问...');
      
      // 4. 测试用户购买链接
      const purchaseUrl = salesResponse.data.data.user_sales_link.replace('/#/', '/');
      console.log(`🔗 测试用户购买链接: ${purchaseUrl}`);
      
      const purchaseResponse = await axios.get(purchaseUrl);
      if (purchaseResponse.status === 200 && purchaseResponse.data.includes('知行财库')) {
        console.log('✅ 用户购买链接可访问');
      } else {
        console.log('❌ 用户购买链接访问异常');
      }
      
      // 5. 测试二级销售注册链接
      const regUrl = salesResponse.data.data.secondary_registration_link.replace('/#/', '/');
      console.log(`🔗 测试二级销售注册链接: ${regUrl}`);
      
      const regResponse = await axios.get(regUrl);
      if (regResponse.status === 200 && regResponse.data.includes('知行财库')) {
        console.log('✅ 二级销售注册链接可访问');
      } else {
        console.log('❌ 二级销售注册链接访问异常');
      }
      
    } else {
      console.log('❌ 一级销售创建失败:', salesResponse.data.message);
    }
    
  } catch (error) {
    console.error('❌ 测试失败:', error.response?.data || error.message);
  }
};

// 主函数
const main = async () => {
  console.log('🔧 验证修复效果测试\n'.cyan.bold);
  await testOrderCreation();
  console.log('\n✅ 测试完成！'.green.bold);
  console.log('\n📋 请检查：');
  console.log('1. 管理员后台是否显示正确的订单状态');
  console.log('2. 销售微信号是否正确显示');
  console.log('3. 链接是否可以正常访问（虽然可能显示空白）');
};

// 执行
if (require.main === module) {
  main();
}

module.exports = { testOrderCreation };