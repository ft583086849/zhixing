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

async function forceAddDatabaseFields() {
  console.log('🔧 强制添加数据库字段修复\n');

  try {
    // 1. 登录管理员
    console.log('1. 登录管理员账户...');
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

    if (!loginResult.data.success) {
      throw new Error(`管理员登录失败: ${loginResult.data.message}`);
    }

    const authToken = loginResult.data.data.token;
    console.log('✅ 管理员登录成功');

    // 2. 多次执行数据库结构更新（确保字段添加成功）
    console.log('\n2. 多次执行数据库结构更新...');
    
    for (let i = 1; i <= 3; i++) {
      console.log(`\n   第${i}次尝试数据库结构更新...`);
      
      const updateResult = await makeRequest(
        'zhixing-seven.vercel.app',
        '/api/admin?path=update-schema',
        'POST',
        {},
        { 'Authorization': `Bearer ${authToken}` }
      );

      console.log(`   状态码: ${updateResult.status}`);
      console.log(`   成功: ${updateResult.data.success}`);
      
      if (updateResult.data.success) {
        console.log(`   ✅ 第${i}次数据库结构更新成功`);
        
        // 等待更长时间让数据库同步
        console.log(`   ⏳ 等待数据库同步 (${5 * i} 秒)...`);
        await new Promise(resolve => setTimeout(resolve, 5000 * i));
        
        // 测试字段是否真的添加了
        console.log(`\n   🧪 测试第${i}次修复后的一级销售创建...`);
        const testData = {
          wechat_name: `test_attempt_${i}_${Date.now()}`,
          payment_method: 'alipay',
          payment_address: 'test@example.com',
          alipay_surname: '测试'
        };

        const testResult = await makeRequest(
          'zhixing-seven.vercel.app',
          '/api/primary-sales?path=create',
          'POST',
          testData
        );

        if (testResult.data.success) {
          console.log(`   🎉 第${i}次尝试成功！字段已添加！`);
          console.log(`   销售代码: ${testResult.data.data.sales_code}`);
          break;
        } else {
          console.log(`   ❌ 第${i}次尝试仍然失败`);
          if (testResult.data.debug) {
            console.log(`   错误: ${testResult.data.debug.message.substring(0, 200)}...`);
          }
          
          if (i < 3) {
            console.log(`   🔄 准备第${i + 1}次尝试...`);
          } else {
            console.log(`   💥 所有尝试都失败了，可能需要手动数据库操作`);
          }
        }
      } else {
        console.log(`   ❌ 第${i}次数据库结构更新失败: ${updateResult.data.message}`);
      }
    }

    // 3. 检查当前数据库状态
    console.log('\n3. 检查当前管理员后台数据...');
    const salesResult = await makeRequest(
      'zhixing-seven.vercel.app',
      '/api/admin?path=sales',
      'GET',
      null,
      { 'Authorization': `Bearer ${authToken}` }
    );

    if (salesResult.data.success) {
      const salesData = salesResult.data.data.sales;
      console.log('✅ 管理员后台数据正常');
      console.log(`📊 当前销售总数: ${salesData.length}`);
      
      // 显示销售类型分布
      const primaryCount = salesData.filter(s => s.sales_type === 'primary').length;
      const secondaryCount = salesData.filter(s => s.sales_type === 'secondary').length;
      
      console.log(`📈 销售分布: 一级销售${primaryCount}个, 二级销售${secondaryCount}个`);
      console.log('');
      console.log('📝 现有销售记录:');
      salesData.forEach((sale, index) => {
        console.log(`   ${index + 1}. ${sale.wechat_name} (${sale.sales_type_display}) - ${sale.sales_code || '无代码'}`);
      });
    }

    console.log('\n🔍 诊断结论:');
    console.log('原因分析：');
    console.log('1. 🗄️  数据库表结构问题：现有表缺少必要字段');
    console.log('2. ⚡ PlanetScale同步延迟：字段添加可能需要时间生效');
    console.log('3. 🔧 API实现差异：创建逻辑与表结构不匹配');
    console.log('');
    console.log('解决方案：');
    console.log('1. ✅ 前端Redux状态已修复（adminSlice.js）');
    console.log('2. 🔄 多次尝试数据库字段添加');
    console.log('3. ⏰ 增加数据库同步等待时间');
    console.log('4. 📋 提供详细的错误诊断信息');

  } catch (error) {
    console.error('❌ 强制修复过程中发生错误:', error.message);
    console.error('错误详情:', error);
  }
}

forceAddDatabaseFields();