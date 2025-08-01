const axios = require('axios');

async function testAdminAPIDetailed() {
  console.log('🔍 详细测试管理员API...');
  
  const baseURL = 'https://zhixing-seven.vercel.app/api';
  
  // 先获取token
  console.log('🔑 获取管理员token...');
  const loginResponse = await axios.post(`${baseURL}/auth?path=login`, {
    username: '知行',
    password: 'Zhixing Universal Trading Signal'
  });
  
  const token = loginResponse.data.data.token;
  console.log('✅ 获取token成功');
  
  try {
    // 1. 测试统计API的原始响应
    console.log('\n1️⃣ 测试统计API原始响应...');
    const statsResponse = await axios.get(`${baseURL}/admin?path=stats`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ 统计API调用成功');
    console.log('📊 完整响应:', JSON.stringify(statsResponse.data, null, 2));
    
    // 2. 检查数据库表结构
    console.log('\n2️⃣ 检查数据库表结构...');
    const salesResponse = await axios.get(`${baseURL}/admin?path=sales`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ 销售API调用成功');
    const sales = salesResponse.data.data || salesResponse.data;
    
    if (sales && sales.length > 0) {
      console.log('📊 第一个销售记录完整数据:');
      console.log(JSON.stringify(sales[0], null, 2));
      
      // 检查sales_type字段的值分布
      const salesTypes = {};
      sales.forEach(sale => {
        const type = sale.sales_type || 'unknown';
        salesTypes[type] = (salesTypes[type] || 0) + 1;
      });
      
      console.log('\n📊 销售类型分布:');
      Object.keys(salesTypes).forEach(type => {
        console.log(`  ${type}: ${salesTypes[type]} 个`);
      });
    }
    
    // 3. 测试SQL查询是否有效
    console.log('\n3️⃣ 测试SQL查询有效性...');
    
    // 检查是否有sales_type字段
    const hasSalesType = sales && sales.length > 0 && sales[0].sales_type !== undefined;
    console.log(`  sales_type字段存在: ${hasSalesType ? '✅' : '❌'}`);
    
    // 检查是否有primary和secondary销售
    const primaryCount = sales ? sales.filter(s => s.sales_type === 'primary').length : 0;
    const secondaryCount = sales ? sales.filter(s => s.sales_type === 'secondary').length : 0;
    console.log(`  一级销售数量: ${primaryCount}`);
    console.log(`  二级销售数量: ${secondaryCount}`);
    
    // 4. 分析问题原因
    console.log('\n4️⃣ 问题分析...');
    
    if (!hasSalesType) {
      console.log('❌ 问题1: sales表缺少sales_type字段');
      console.log('🔧 解决方案: 需要运行数据库迁移脚本');
    } else if (primaryCount === 0 && secondaryCount === 0) {
      console.log('❌ 问题2: 所有销售的sales_type都为空或无效');
      console.log('🔧 解决方案: 需要更新现有销售记录的sales_type');
    } else {
      console.log('✅ 数据库结构正常');
      console.log('🔍 可能的问题: 后端SQL查询有错误');
    }
    
    // 5. 检查后端代码版本
    console.log('\n5️⃣ 检查后端代码版本...');
    console.log('📊 当前API返回的字段名:');
    const stats = statsResponse.data.data || statsResponse.data;
    Object.keys(stats).forEach(key => {
      console.log(`  ${key}`);
    });
    
    console.log('\n📊 期望的字段名:');
    const expectedFields = [
      'total_orders',
      'today_orders', 
      'total_amount',
      'today_amount',
      'total_customers',
      'pending_payment_orders',
      'primary_sales_count',
      'secondary_sales_count',
      'primary_sales_amount',
      'secondary_sales_amount',
      'avg_secondary_per_primary',
      'max_secondary_per_primary',
      'active_hierarchies'
    ];
    expectedFields.forEach(field => {
      console.log(`  ${field}`);
    });
    
    console.log('\n🎯 诊断完成！');
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    if (error.response) {
      console.error('📊 错误状态码:', error.response.status);
      console.error('📊 错误响应:', error.response.data);
    }
  }
}

// 运行测试
testAdminAPIDetailed()
  .then(() => {
    console.log('\n✅ 详细测试完成');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ 详细测试失败');
    process.exit(1);
  }); 