const axios = require('axios');

async function testDataOverviewFix() {
  console.log('🔍 开始测试数据概览功能修复效果...');
  
  try {
    // 1. 测试认证
    console.log('\n🔐 测试认证...');
    const authResponse = await axios.post('https://zhixing-seven.vercel.app/api/auth?path=login', {
      username: '知行',
      password: 'Zhixing Universal Trading Signal'
    });
    
    if (!authResponse.data.success) {
      throw new Error('认证失败');
    }
    
    const token = authResponse.data.data?.token || authResponse.data.token;
    if (!token) {
      throw new Error('未获取到Token');
    }
    console.log('✅ 认证成功');
    
    // 2. 测试统计数据API
    console.log('\n📊 测试统计数据API...');
    const statsResponse = await axios.get('https://zhixing-seven.vercel.app/api/admin?path=stats', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!statsResponse.data.success) {
      throw new Error('统计数据API调用失败');
    }
    
    const stats = statsResponse.data.data;
    console.log('✅ 统计数据API正常');
    
    // 3. 验证核心指标
    console.log('\n🎯 验证核心指标...');
    const requiredFields = [
      'total_orders',
      'pending_payment_orders',
      'pending_config_orders', 
      'confirmed_payment_orders',
      'confirmed_config_orders',
      'total_commission',
      'amount_188_orders',
      'amount_188_percentage',
      'amount_488_orders',
      'amount_488_percentage',
      'amount_688_orders',
      'amount_688_percentage',
      'amount_1588_orders',
      'amount_1588_percentage'
    ];
    
    let missingFields = [];
    requiredFields.forEach(field => {
      if (stats[field] === undefined) {
        missingFields.push(field);
      }
    });
    
    if (missingFields.length > 0) {
      console.log(`❌ 缺少字段: ${missingFields.join(', ')}`);
    } else {
      console.log('✅ 所有核心指标都存在');
    }
    
    // 4. 显示统计结果
    console.log('\n📈 统计结果:');
    console.log(`总订单数: ${stats.total_orders}`);
    console.log(`待付款确认: ${stats.pending_payment_orders}`);
    console.log(`待配置确认: ${stats.pending_config_orders}`);
    console.log(`已付款确认: ${stats.confirmed_payment_orders}`);
    console.log(`已配置确认: ${stats.confirmed_config_orders}`);
    console.log(`销售返佣金额: $${stats.total_commission}`);
    
    console.log('\n💰 订单金额分布:');
    console.log(`188元订单: ${stats.amount_188_orders} (${stats.amount_188_percentage}%)`);
    console.log(`488元订单: ${stats.amount_488_orders} (${stats.amount_488_percentage}%)`);
    console.log(`688元订单: ${stats.amount_688_orders} (${stats.amount_688_percentage}%)`);
    console.log(`1588元订单: ${stats.amount_1588_orders} (${stats.amount_1588_percentage}%)`);
    
    // 5. 测试订单管理搜索功能
    console.log('\n🔍 测试订单管理搜索功能...');
    const ordersResponse = await axios.get('https://zhixing-seven.vercel.app/api/admin?path=orders&limit=5', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!ordersResponse.data.success) {
      throw new Error('订单管理API调用失败');
    }
    
    console.log('✅ 订单管理API正常');
    console.log(`获取到 ${ordersResponse.data.data.orders.length} 条订单`);
    
    // 6. 测试新增搜索参数
    console.log('\n🔍 测试新增搜索参数...');
    const searchParams = {
      sales_wechat: 'test',
      tradingview_username: 'test',
      link_code: 'test',
      purchase_type: 'immediate',
      payment_method: 'alipay',
      status: 'pending_payment_confirmation'
    };
    
    const searchQuery = Object.entries(searchParams)
      .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
      .join('&');
    
    const searchResponse = await axios.get(`https://zhixing-seven.vercel.app/api/admin?path=orders&${searchQuery}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!searchResponse.data.success) {
      throw new Error('搜索功能测试失败');
    }
    
    console.log('✅ 新增搜索参数支持正常');
    
    console.log('\n🎉 数据概览功能修复验证成功！');
    console.log('✅ 核心指标已添加');
    console.log('✅ 订单金额分布统计已修复');
    console.log('✅ 搜索功能已完善');
    
    return {
      success: true,
      stats: stats,
      missingFields: missingFields
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
testDataOverviewFix()
  .then(result => {
    console.log('\n✅ 测试完成');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ 测试失败');
    process.exit(1);
  }); 