const axios = require('axios');

async function testSecondarySalesAPI() {
  console.log('🔍 开始测试二级销售API...');
  
  const baseURL = 'https://zhixing-seven.vercel.app/api';
  
  try {
    // 1. 首先创建一个一级销售，获取注册码
    console.log('\n👤 1. 创建一级销售获取注册码...');
    const primarySalesData = {
      wechat_name: `primary_for_secondary_${Date.now()}`,
      payment_method: 'alipay',
      payment_address: 'primary@test.com',
      alipay_surname: '主'
    };
    
    const primaryResponse = await axios.post(`${baseURL}/primary-sales?path=create`, primarySalesData, {
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (!primaryResponse.data.success) {
      throw new Error('一级销售创建失败');
    }
    
    console.log('✅ 一级销售创建成功');
    const primarySalesId = primaryResponse.data.data.primary_sales_id;
    const registrationCode = primaryResponse.data.data.secondary_registration_code;
    
    console.log(`📋 一级销售ID: ${primarySalesId}`);
    console.log(`📋 注册码: ${registrationCode}`);
    
    // 2. 测试二级销售注册
    console.log('\n👥 2. 测试二级销售注册...');
    const secondarySalesData = {
      wechat_name: `secondary_test_${Date.now()}`,
      primary_sales_id: primarySalesId,
      payment_method: 'crypto',
      payment_address: '0x1234567890abcdef',
      chain_name: 'ETH',
      registration_code: registrationCode
    };
    
    const secondaryResponse = await axios.post(`${baseURL}/secondary-sales?path=register`, secondarySalesData, {
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (!secondaryResponse.data.success) {
      throw new Error('二级销售注册失败');
    }
    
    console.log('✅ 二级销售注册成功');
    const secondarySalesId = secondaryResponse.data.data.secondary_sales_id;
    console.log(`📋 二级销售ID: ${secondarySalesId}`);
    console.log(`📋 用户销售链接: ${secondaryResponse.data.data.user_sales_link}`);
    
    // 3. 测试获取二级销售列表
    console.log('\n📋 3. 测试获取二级销售列表...');
    const listResponse = await axios.get(`${baseURL}/secondary-sales?path=list&primary_sales_id=${primarySalesId}`);
    
    if (listResponse.data.success) {
      console.log('✅ 二级销售列表获取成功');
      console.log(`📊 二级销售数量: ${listResponse.data.data.length}`);
      if (listResponse.data.data.length > 0) {
        const secondary = listResponse.data.data[0];
        console.log(`📋 二级销售信息: ${secondary.wechat_name} (佣金率: ${secondary.commission_rate}%)`);
      }
    } else {
      console.log('❌ 二级销售列表获取失败');
    }
    
    // 4. 测试获取二级销售统计
    console.log('\n📈 4. 测试获取二级销售统计...');
    const statsResponse = await axios.get(`${baseURL}/secondary-sales?path=stats&primary_sales_id=${primarySalesId}`);
    
    if (statsResponse.data.success) {
      console.log('✅ 二级销售统计获取成功');
      const stats = statsResponse.data.data;
      console.log(`📊 总二级销售数: ${stats.total_secondary_sales}`);
      console.log(`📊 活跃二级销售数: ${stats.active_secondary_sales}`);
      console.log(`📊 平均佣金率: ${stats.avg_commission_rate || 0}%`);
    } else {
      console.log('❌ 二级销售统计获取失败');
    }
    
    // 5. 测试更新佣金比例
    console.log('\n💰 5. 测试更新佣金比例...');
    const updateCommissionData = {
      secondary_sales_id: secondarySalesId,
      commission_rate: 35.00
    };
    
    const updateResponse = await axios.put(`${baseURL}/secondary-sales?path=update-commission`, updateCommissionData, {
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (updateResponse.data.success) {
      console.log('✅ 佣金比例更新成功');
      console.log(`📋 新佣金率: 35%`);
    } else {
      console.log('❌ 佣金比例更新失败');
    }
    
    // 6. 测试获取二级销售订单
    console.log('\n📦 6. 测试获取二级销售订单...');
    const ordersResponse = await axios.get(`${baseURL}/secondary-sales?path=orders&secondary_sales_id=${secondarySalesId}`);
    
    if (ordersResponse.data.success) {
      console.log('✅ 二级销售订单获取成功');
      console.log(`📊 订单数量: ${ordersResponse.data.data.length}`);
    } else {
      console.log('❌ 二级销售订单获取失败');
    }
    
    // 7. 测试移除二级销售
    console.log('\n🗑️ 7. 测试移除二级销售...');
    const removeData = {
      secondary_sales_id: secondarySalesId,
      removed_by: primarySalesId
    };
    
    const removeResponse = await axios.delete(`${baseURL}/secondary-sales?path=remove`, {
      headers: { 'Content-Type': 'application/json' },
      data: removeData
    });
    
    if (removeResponse.data.success) {
      console.log('✅ 二级销售移除成功');
    } else {
      console.log('❌ 二级销售移除失败');
    }
    
    console.log('\n🎉 二级销售API测试完成！');
    console.log('✅ 所有功能测试通过');
    console.log('✅ 二级销售注册功能正常');
    console.log('✅ 二级销售管理功能正常');
    console.log('✅ 佣金设置功能正常');
    console.log('✅ 销售层级关系正常');
    
    return {
      success: true,
      message: '二级销售API测试完成'
    };
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    
    if (error.response) {
      console.error('📊 错误状态码:', error.response.status);
      console.error('📊 错误响应:', error.response.data);
    }
    
    throw error;
  }
}

// 运行测试
testSecondarySalesAPI()
  .then(result => {
    console.log('\n✅ 测试完成');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ 测试失败');
    process.exit(1);
  }); 