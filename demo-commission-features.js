const axios = require('axios');

const API_BASE_URL = 'http://localhost:5000/api';

async function demoCommissionFeatures() {
  console.log('🎯 佣金比率自动调整和待返佣筛选功能演示\n');

  try {
    // 1. 演示佣金比率自动调整逻辑
    console.log('📊 佣金比率自动调整逻辑演示：');
    console.log('   根据累计有效订单金额自动调整佣金比率：');
    console.log('   • $0 - $50,000: 30% (基础)');
    console.log('   • $50,000 - $100,000: 32% (鼓励)');
    console.log('   • $100,000 - $150,000: 35% (中段)');
    console.log('   • $150,000 - $200,000: 38% (临近)');
    console.log('   • ≥ $200,000: 40% (达成)\n');

    // 2. 演示获取销售列表（包含自动佣金比率计算）
    console.log('🔍 获取销售列表（包含自动佣金比率计算）：');
    const salesResponse = await axios.get(`${API_BASE_URL}/admin/links`);
    
    if (salesResponse.data.success) {
      const sales = salesResponse.data.data;
      console.log(`   共获取 ${sales.length} 个销售记录`);
      
      // 显示前3个销售的佣金比率信息
      sales.slice(0, 3).forEach((sale, index) => {
        const validOrders = sale.orders?.filter(order => order.status === 'confirmed_configuration') || [];
        const totalAmount = validOrders.reduce((sum, order) => sum + (order.amount || 0), 0);
        
        // 计算自动佣金比率
        let autoRate = 30;
        if (totalAmount >= 200000) autoRate = 40;
        else if (totalAmount >= 150000) autoRate = 38;
        else if (totalAmount >= 100000) autoRate = 35;
        else if (totalAmount >= 50000) autoRate = 32;
        else autoRate = 30;
        
        console.log(`   ${index + 1}. ${sale.sales.wechat_name}`);
        console.log(`      有效订单金额: $${totalAmount.toFixed(2)}`);
        console.log(`      自动佣金比率: ${autoRate}%`);
        console.log(`      数据库佣金比率: ${sale.sales.commission_rate || autoRate}%`);
        console.log('');
      });
    }

    // 3. 演示待返佣筛选功能
    console.log('🔍 待返佣筛选功能演示：');
    
    const filterTests = [
      { name: '待返佣=是', params: { pending_commission: 'yes' } },
      { name: '待返佣=否', params: { pending_commission: 'no' } }
    ];
    
    for (const test of filterTests) {
      const response = await axios.get(`${API_BASE_URL}/admin/links`, { params: test.params });
      if (response.data.success) {
        console.log(`   ${test.name}: 返回 ${response.data.data.length} 条记录`);
      }
    }
    console.log('');

    // 4. 演示佣金比率手动更新
    console.log('✏️  佣金比率手动更新演示：');
    console.log('   功能说明：');
    console.log('   • 点击编辑按钮可以手动调整佣金比率');
    console.log('   • 确认按钮保存到数据库');
    console.log('   • 取消按钮恢复原值');
    console.log('   • 自动计算的佣金比率显示为蓝色标签');
    console.log('   • 手动确认的佣金比率显示为绿色标签\n');

    // 5. 演示待返佣状态显示
    console.log('🏷️  待返佣状态显示演示：');
    console.log('   • 待返佣：应返佣金额 > 已返佣金额 (橙色标签)');
    console.log('   • 超额：应返佣金额 < 已返佣金额 (红色标签)');
    console.log('   • 已结清：应返佣金额 = 已返佣金额 (绿色标签)\n');

    // 6. 演示搜索功能组合
    console.log('🔍 搜索功能组合演示：');
    console.log('   支持以下搜索条件组合：');
    console.log('   • 销售微信名称');
    console.log('   • 链接代码');
    console.log('   • 收款方式（支付宝/线上地址码）');
    console.log('   • 佣金比率');
    console.log('   • 待返佣状态（是/否）');
    console.log('   • 创建时间范围');
    console.log('   • 订单时间范围\n');

    console.log('🎉 功能演示完成！');
    console.log('💡 提示：访问 http://localhost:3000/#/admin 查看完整的管理界面');

  } catch (error) {
    console.error('❌ 演示过程中发生错误:', error.message);
    if (error.response) {
      console.error('   响应状态:', error.response.status);
      console.error('   响应数据:', error.response.data);
    }
  }
}

// 运行演示
demoCommissionFeatures(); 