const axios = require('axios');

const API_BASE_URL = 'http://localhost:5000/api';

async function testPendingCommissionFix() {
  console.log('🔧 测试修复后的待返佣筛选功能...\n');

  try {
    // 1. 测试无筛选条件（获取所有销售）
    console.log('1️⃣ 测试无筛选条件：');
    const allSalesResponse = await axios.get(`${API_BASE_URL}/admin/links`);
    if (allSalesResponse.data.success) {
      console.log(`   返回 ${allSalesResponse.data.data.length} 条记录`);
    }

    // 2. 测试待返佣=是（没有已返佣金额数据）
    console.log('\n2️⃣ 测试待返佣=是（无已返佣金额数据）：');
    const pendingYesResponse = await axios.get(`${API_BASE_URL}/admin/links`, {
      params: { pending_commission: 'yes' }
    });
    if (pendingYesResponse.data.success) {
      console.log(`   返回 ${pendingYesResponse.data.data.length} 条记录`);
    }

    // 3. 测试待返佣=否（没有已返佣金额数据）
    console.log('\n3️⃣ 测试待返佣=否（无已返佣金额数据）：');
    const pendingNoResponse = await axios.get(`${API_BASE_URL}/admin/links`, {
      params: { pending_commission: 'no' }
    });
    if (pendingNoResponse.data.success) {
      console.log(`   返回 ${pendingNoResponse.data.data.length} 条记录`);
    }

    // 4. 测试待返佣=是（有已返佣金额数据，模拟已结清的情况）
    console.log('\n4️⃣ 测试待返佣=是（有已返佣金额数据，模拟已结清）：');
    const paidCommissionData = {
      1: 201.60, // 模拟销售ID=1的已返佣金额等于应返佣金额
      2: 0,      // 模拟销售ID=2的已返佣金额为0
      3: 100     // 模拟销售ID=3的已返佣金额为100
    };
    
    const pendingYesWithPaidResponse = await axios.get(`${API_BASE_URL}/admin/links`, {
      params: { 
        pending_commission: 'yes',
        paid_commission_data: JSON.stringify(paidCommissionData)
      }
    });
    if (pendingYesWithPaidResponse.data.success) {
      console.log(`   返回 ${pendingYesWithPaidResponse.data.data.length} 条记录`);
      console.log('   预期：应该排除销售ID=1（已结清），包含销售ID=2和3（待返佣）');
    }

    // 5. 测试待返佣=否（有已返佣金额数据，模拟已结清的情况）
    console.log('\n5️⃣ 测试待返佣=否（有已返佣金额数据，模拟已结清）：');
    const pendingNoWithPaidResponse = await axios.get(`${API_BASE_URL}/admin/links`, {
      params: { 
        pending_commission: 'no',
        paid_commission_data: JSON.stringify(paidCommissionData)
      }
    });
    if (pendingNoWithPaidResponse.data.success) {
      console.log(`   返回 ${pendingNoWithPaidResponse.data.data.length} 条记录`);
      console.log('   预期：应该包含销售ID=1（已结清），排除销售ID=2和3（待返佣）');
    }

    // 6. 显示筛选逻辑说明
    console.log('\n📋 筛选逻辑说明：');
    console.log('   • 待返佣=是：应返佣金额 > 0 且 |应返佣金额 - 已返佣金额| > 0.01');
    console.log('   • 待返佣=否：应返佣金额 = 0 或 |应返佣金额 - 已返佣金额| ≤ 0.01');
    console.log('   • 允许0.01的误差，避免浮点数精度问题');

    console.log('\n🎉 待返佣筛选功能测试完成！');

  } catch (error) {
    console.error('❌ 测试过程中发生错误:', error.message);
    if (error.response) {
      console.error('   响应状态:', error.response.status);
      console.error('   响应数据:', error.response.data);
    }
  }
}

// 运行测试
testPendingCommissionFix(); 