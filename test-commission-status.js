const axios = require('axios');

async function testCommissionStatus() {
  console.log('🔍 分析待返佣状态计算逻辑...\n');

  try {
    // 1. 获取销售数据
    console.log('1️⃣ 获取销售数据...');
    const response = await axios.get('http://localhost:5000/api/admin/links', {
      headers: { 'Authorization': 'Bearer test-token' }
    });

    if (!response.data.success) {
      throw new Error('获取销售数据失败');
    }

    const salesData = response.data.data;
    console.log(`✅ 获取到 ${salesData.length} 条销售记录`);

    // 2. 分析每条记录的待返佣状态
    console.log('\n2️⃣ 分析待返佣状态计算逻辑...\n');
    
    salesData.forEach((record, index) => {
      console.log(`📊 记录 ${index + 1}: ${record.sales?.wechat_name || '未知销售'}`);
      
      // 计算自动佣金比率
      const validOrders = record.orders?.filter(order => order.status === 'confirmed_configuration') || [];
      const totalAmount = validOrders.reduce((sum, order) => sum + (order.amount || 0), 0);
      
      let autoRate = 30; // 默认30%
      if (totalAmount >= 200000) {
        autoRate = 40;
      } else if (totalAmount >= 150000) {
        autoRate = 38;
      } else if (totalAmount >= 100000) {
        autoRate = 35;
      } else if (totalAmount >= 50000) {
        autoRate = 32;
      }
      
      // 获取最终佣金比率
      const dbRate = record.sales?.commission_rate;
      const finalRate = (!dbRate || dbRate === autoRate) ? autoRate : dbRate;
      
      // 计算佣金金额
      const commissionAmount = totalAmount * (finalRate / 100);
      
      // 获取已返佣金额（这里需要从实际数据中获取）
      const paidAmount = record.sales?.paid_commission || 0;
      
      // 计算待返佣金额
      const pendingAmount = commissionAmount - paidAmount;
      
      // 确定状态
      let status, color;
      if (pendingAmount > 0) {
        status = '待返佣';
        color = 'orange';
      } else if (pendingAmount < 0) {
        status = '超额';
        color = 'red';
      } else {
        status = '已结清';
        color = 'green';
      }
      
      console.log(`   销售微信: ${record.sales?.wechat_name || 'N/A'}`);
      console.log(`   有效订单数: ${validOrders.length}`);
      console.log(`   有效订单总金额: $${totalAmount.toFixed(2)}`);
      console.log(`   自动佣金比率: ${autoRate}%`);
      console.log(`   数据库佣金比率: ${dbRate || '未设置'}%`);
      console.log(`   最终佣金比率: ${finalRate}%`);
      console.log(`   应返佣金额: $${commissionAmount.toFixed(2)}`);
      console.log(`   已返佣金额: $${paidAmount.toFixed(2)}`);
      console.log(`   待返佣金额: $${pendingAmount.toFixed(2)}`);
      console.log(`   当前状态: ${status} (${color})`);
      
      // 检查是否有问题的记录
      if (Math.abs(pendingAmount) < 0.01 && status !== '已结清') {
        console.log(`   ⚠️  问题: 金额接近0但状态不是已结清`);
      }
      if (pendingAmount === 0 && status !== '已结清') {
        console.log(`   ❌ 错误: 金额为0但状态不是已结清`);
      }
      
      console.log('');
    });

    // 3. 检查数据结构
    console.log('3️⃣ 检查数据结构...');
    if (salesData.length > 0) {
      const sampleRecord = salesData[0];
      console.log('✅ 销售记录结构:');
      console.log('   - sales.id:', sampleRecord.sales?.id);
      console.log('   - sales.wechat_name:', sampleRecord.sales?.wechat_name);
      console.log('   - sales.commission_rate:', sampleRecord.sales?.commission_rate);
      console.log('   - sales.paid_commission:', sampleRecord.sales?.paid_commission);
      console.log('   - orders.length:', sampleRecord.orders?.length);
      console.log('   - orders[0].status:', sampleRecord.orders?.[0]?.status);
      console.log('   - orders[0].amount:', sampleRecord.orders?.[0]?.amount);
    }

    // 4. 总结问题
    console.log('\n4️⃣ 问题分析总结...');
    console.log('📋 待返佣状态定义:');
    console.log('   - pendingAmount > 0 → "待返佣" (橙色)');
    console.log('   - pendingAmount < 0 → "超额" (红色)');
    console.log('   - pendingAmount = 0 → "已结清" (绿色)');
    console.log('\n🔍 可能的问题:');
    console.log('   1. 数据类型问题: 金额计算可能有精度问题');
    console.log('   2. 数据来源问题: 已返佣金额可能来自错误字段');
    console.log('   3. 计算逻辑问题: 佣金比率或订单金额计算有误');
    console.log('   4. 状态判断问题: 浮点数比较可能有精度问题');

  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    if (error.response) {
      console.error('响应状态:', error.response.status);
      console.error('响应数据:', error.response.data);
    }
  }
}

// 运行测试
testCommissionStatus(); 