const axios = require('axios');

const API_BASE_URL = 'http://localhost:5000/api';

// 测试数据
const testData = {
  salesId: 1, // 假设存在的销售ID
  newCommissionRate: 35
};

async function testCommissionFeatures() {
  console.log('🧪 测试佣金比率自动调整和待返佣筛选功能...\n');

  try {
    // 1. 测试获取销售链接列表（包含待返佣筛选）
    console.log('1️⃣ 测试销售链接列表API（包含待返佣筛选）...');
    
    const salesResponse = await axios.get(`${API_BASE_URL}/admin/links`, {
      params: {
        pending_commission: 'yes' // 筛选待返佣的销售
      }
    });
    
    if (salesResponse.data.success) {
      console.log('✅ 销售链接列表获取成功');
      console.log(`   返回 ${salesResponse.data.data.length} 条记录`);
      
      // 显示前几条记录的基本信息
      salesResponse.data.data.slice(0, 3).forEach((link, index) => {
        const validOrders = link.orders?.filter(order => order.status === 'confirmed_configuration') || [];
        const totalAmount = validOrders.reduce((sum, order) => sum + (order.amount || 0), 0);
        console.log(`   记录${index + 1}: 销售微信=${link.sales?.wechat_name}, 有效订单金额=$${totalAmount.toFixed(2)}`);
      });
    } else {
      console.log('❌ 销售链接列表获取失败:', salesResponse.data.message);
    }

    // 2. 测试获取佣金比率选项
    console.log('\n2️⃣ 测试获取佣金比率选项...');
    
    const ratesResponse = await axios.get(`${API_BASE_URL}/admin/commission-rates`);
    
    if (ratesResponse.data.success) {
      console.log('✅ 佣金比率选项获取成功');
      console.log(`   可用佣金比率: ${ratesResponse.data.data.join('%, ')}%`);
    } else {
      console.log('❌ 佣金比率选项获取失败:', ratesResponse.data.message);
    }

    // 3. 测试更新销售佣金比率
    console.log('\n3️⃣ 测试更新销售佣金比率...');
    
    try {
      const updateResponse = await axios.put(`${API_BASE_URL}/admin/sales/${testData.salesId}/commission-rate`, {
        commission_rate: testData.newCommissionRate
      });
      
      if (updateResponse.data.success) {
        console.log('✅ 佣金比率更新成功');
        console.log(`   销售ID: ${updateResponse.data.data.salesId}`);
        console.log(`   新佣金比率: ${updateResponse.data.data.commission_rate}%`);
      } else {
        console.log('❌ 佣金比率更新失败:', updateResponse.data.message);
      }
    } catch (error) {
      if (error.response?.status === 404) {
        console.log('⚠️  销售记录不存在，跳过佣金比率更新测试');
      } else {
        console.log('❌ 佣金比率更新失败:', error.response?.data?.message || error.message);
      }
    }

    // 4. 测试不同待返佣筛选条件
    console.log('\n4️⃣ 测试不同待返佣筛选条件...');
    
    const filterTests = [
      { name: '待返佣=是', params: { pending_commission: 'yes' } },
      { name: '待返佣=否', params: { pending_commission: 'no' } },
      { name: '无筛选', params: {} }
    ];
    
    for (const test of filterTests) {
      try {
        const response = await axios.get(`${API_BASE_URL}/admin/links`, { params: test.params });
        if (response.data.success) {
          console.log(`✅ ${test.name}: 返回 ${response.data.data.length} 条记录`);
        } else {
          console.log(`❌ ${test.name}: 获取失败`);
        }
      } catch (error) {
        console.log(`❌ ${test.name}: 请求失败`, error.response?.data?.message || error.message);
      }
    }

    console.log('\n🎉 佣金功能测试完成！');

  } catch (error) {
    console.error('❌ 测试过程中发生错误:', error.message);
    if (error.response) {
      console.error('   响应状态:', error.response.status);
      console.error('   响应数据:', error.response.data);
    }
  }
}

// 运行测试
testCommissionFeatures(); 