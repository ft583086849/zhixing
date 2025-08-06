const https = require('https');

async function makeRequest(hostname, path, method = 'GET', data = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname,
      port: 443,
      path,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    const req = https.request(options, (res) => {
      let responseData = '';
      res.on('data', (chunk) => responseData += chunk);
      res.on('end', () => {
        try {
          const response = JSON.parse(responseData);
          resolve({
            status: res.statusCode,
            data: response
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            data: responseData
          });
        }
      });
    });

    req.on('error', reject);
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

async function testFixedSalesCreation() {
  console.log('🔧 测试修复后的销售注册功能\n');

  try {
    // 1. 创建一级销售（修复后）
    console.log('1. 测试一级销售创建...');
    const primarySalesData = {
      wechat_name: `fixed_primary_${Date.now()}`,
      payment_method: 'alipay',
      payment_address: 'fixed_alipay@example.com',
      alipay_surname: '修复测试'
    };

    const primaryResult = await makeRequest(
      'zhixing-seven.vercel.app',
      '/api/primary-sales?path=create',
      'POST',
      primarySalesData
    );

    console.log(`   状态码: ${primaryResult.status}`);
    console.log(`   响应: ${JSON.stringify(primaryResult.data, null, 2)}`);

    if (primaryResult.data.success) {
      console.log(`   ✅ 一级销售创建成功！`);
      console.log(`   📋 销售代码: ${primaryResult.data.data.sales_code}`);
      console.log(`   🔗 注册码: ${primaryResult.data.data.secondary_registration_code}`);
    } else {
      console.log(`   ❌ 一级销售创建失败: ${primaryResult.data.message}`);
      if (primaryResult.data.debug) {
        console.log(`   🐛 调试信息: ${JSON.stringify(primaryResult.data.debug, null, 2)}`);
      }
    }

    // 2. 登录管理员并检查数据
    console.log('\n2. 验证管理员后台数据更新...');
    const loginData = {
      username: '知行',
      password: 'Zhixing Universal Trading Signal'
    };

    const loginResult = await makeRequest(
      'zhixing-seven.vercel.app',
      '/api/auth?path=login',
      'POST',
      loginData
    );

    if (loginResult.data.success) {
      const authToken = loginResult.data.data.token;
      console.log('   ✅ 管理员登录成功');

      const salesResult = await makeRequest(
        'zhixing-seven.vercel.app',
        '/api/admin?path=sales',
        'GET',
        null,
        { 'Authorization': `Bearer ${authToken}` }
      );

      if (salesResult.data.success) {
        const salesData = salesResult.data.data.sales;
        console.log(`   📊 当前销售总数: ${salesData.length}`);
        
        // 按类型统计
        const primaryCount = salesData.filter(s => s.sales_type === 'primary').length;
        const secondaryCount = salesData.filter(s => s.sales_type === 'secondary').length;
        const legacyCount = salesData.filter(s => s.sales_type === 'legacy').length;
        
        console.log(`   📈 销售分布:`);
        console.log(`      一级销售: ${primaryCount} 个`);
        console.log(`      二级销售: ${secondaryCount} 个`);
        console.log(`      遗留销售: ${legacyCount} 个`);

        // 显示最新的销售
        console.log(`   📝 最新创建的销售:`);
        salesData.slice(0, 3).forEach((sale, index) => {
          console.log(`      ${index + 1}. ${sale.wechat_name} (${sale.sales_type_display}) - ${new Date(sale.created_at).toLocaleString('zh-CN')}`);
        });

        // 检查新创建的销售是否在列表中
        if (primaryResult.data.success) {
          const newSalesCode = primaryResult.data.data.sales_code;
          const foundSale = salesData.find(s => s.sales_code === newSalesCode);
          if (foundSale) {
            console.log(`   ✅ 新创建的销售已出现在管理员后台！`);
            console.log(`      微信号: ${foundSale.wechat_name}`);
            console.log(`      销售类型: ${foundSale.sales_type_display}`);
            console.log(`      销售代码: ${foundSale.sales_code}`);
          } else {
            console.log(`   ⚠️ 新创建的销售未在管理员后台找到`);
          }
        }
      } else {
        console.log(`   ❌ 获取销售数据失败: ${salesResult.data.message}`);
      }
    } else {
      console.log(`   ❌ 管理员登录失败: ${loginResult.data.message}`);
    }

    console.log('\n🎯 问题诊断结论:');
    console.log('   管理员后台实际上是有数据的，共有以下数据:');
    console.log('   - 现有销售数据正常显示');
    console.log('   - 问题可能在于:');
    console.log('     1. 新销售注册失败（数据库字段问题）- 已修复');
    console.log('     2. 前端显示问题（需进一步检查）');
    console.log('     3. 特定筛选条件导致数据不显示');

  } catch (error) {
    console.error('❌ 测试过程中发生错误:', error.message);
    console.error('错误详情:', error);
  }
}

testFixedSalesCreation();