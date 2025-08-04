const https = require('https');
const fs = require('fs');

function makeRequest(url, data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      method: data ? 'POST' : 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Fix-Status-Checker'
      }
    };

    const req = https.request(url, options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsed = JSON.parse(responseData);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, data: responseData });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

async function checkAllFixesStatus() {
  console.log('🔍 检查17个修复的实际状态\n');
  console.log('='.repeat(70));

  const results = {
    codeFiles: {
      checked: 0,
      correct: 0,
      incorrect: 0,
      details: []
    },
    apiTests: {
      checked: 0,
      working: 0,
      broken: 0,
      details: []
    },
    frontendTests: {
      checked: 0,
      working: 0,
      broken: 0,
      details: []
    }
  };

  console.log('📋 第一部分: 检查代码文件修复状态\n');

  // 1. 检查AdminDashboardPage.js - 红色横幅移除
  console.log('1. 检查 AdminDashboardPage.js - 红色横幅移除');
  try {
    const content = fs.readFileSync('client/src/pages/AdminDashboardPage.js', 'utf8');
    const hasRedBanner = content.includes('管理员控制面板');
    results.codeFiles.checked++;
    if (hasRedBanner) {
      results.codeFiles.incorrect++;
      results.codeFiles.details.push('❌ AdminDashboardPage.js: 红色横幅仍存在');
      console.log('   ❌ 红色横幅仍存在 - 修复未生效');
    } else {
      results.codeFiles.correct++;
      results.codeFiles.details.push('✅ AdminDashboardPage.js: 红色横幅已移除');
      console.log('   ✅ 红色横幅已移除 - 修复生效');
    }
  } catch (e) {
    console.log('   ❌ 文件读取失败');
  }

  // 2. 检查AdminOrders.js - 按钮文本修复
  console.log('\\n2. 检查 AdminOrders.js - 按钮文本修复');
  try {
    const content = fs.readFileSync('client/src/components/admin/AdminOrders.js', 'utf8');
    const hasOldButtons = content.includes('确认配置') || content.includes('确认付款');
    const hasNewButtons = content.includes('配置确认') && content.includes('付款确认') && content.includes('拒绝订单');
    results.codeFiles.checked++;
    if (hasOldButtons && !hasNewButtons) {
      results.codeFiles.incorrect++;
      results.codeFiles.details.push('❌ AdminOrders.js: 按钮文本未修复');
      console.log('   ❌ 按钮文本未修复 - 仍是旧文本');
    } else if (hasNewButtons) {
      results.codeFiles.correct++;
      results.codeFiles.details.push('✅ AdminOrders.js: 按钮文本已修复');
      console.log('   ✅ 按钮文本已修复 - 显示新文本');
    } else {
      results.codeFiles.incorrect++;
      results.codeFiles.details.push('⚠️ AdminOrders.js: 按钮状态不明确');
      console.log('   ⚠️ 按钮状态不明确');
    }
  } catch (e) {
    console.log('   ❌ 文件读取失败');
  }

  // 3. 检查AdminCustomers.js - 客户微信号标签
  console.log('\\n3. 检查 AdminCustomers.js - 客户微信号标签');
  try {
    const content = fs.readFileSync('client/src/components/admin/AdminCustomers.js', 'utf8');
    const hasOldLabel = content.includes("'客户微信'");
    const hasNewLabel = content.includes("'客户微信号'");
    results.codeFiles.checked++;
    if (hasNewLabel && !hasOldLabel) {
      results.codeFiles.correct++;
      results.codeFiles.details.push('✅ AdminCustomers.js: 标签已修复为客户微信号');
      console.log('   ✅ 标签已修复为"客户微信号"');
    } else {
      results.codeFiles.incorrect++;
      results.codeFiles.details.push('❌ AdminCustomers.js: 标签未修复');
      console.log('   ❌ 标签未修复 - 仍显示"客户微信"');
    }
  } catch (e) {
    console.log('   ❌ 文件读取失败');
  }

  // 4. 检查一级销售链接修复
  console.log('\\n4. 检查 PrimarySalesPage.js - 链接参数修复');
  try {
    const content = fs.readFileSync('client/src/pages/PrimarySalesPage.js', 'utf8');
    const hasSalesCode = content.includes('sales_code');
    const hasLinkCode = content.includes('link_code');
    results.codeFiles.checked++;
    if (hasSalesCode && !hasLinkCode) {
      results.codeFiles.correct++;
      results.codeFiles.details.push('✅ PrimarySalesPage.js: 链接参数已修复为sales_code');
      console.log('   ✅ 链接参数已修复为sales_code');
    } else {
      results.codeFiles.incorrect++;
      results.codeFiles.details.push('❌ PrimarySalesPage.js: 链接参数未修复');
      console.log('   ❌ 链接参数未修复 - 可能仍使用link_code');
    }
  } catch (e) {
    console.log('   ❌ 文件读取失败');
  }

  console.log('\\n📋 第二部分: 检查API功能修复状态\\n');

  // 5. 检查佣金比率API修复
  console.log('5. 检查佣金比率API修复');
  try {
    // 创建测试销售检查佣金比率
    const testData = {
      wechat_name: `佣金测试_${Date.now()}`,
      payment_method: 'alipay',
      payment_address: 'commission-check@test.com',
      alipay_surname: '测'
    };

    const salesResult = await makeRequest('https://zhixing-seven.vercel.app/api/sales?path=create', testData);
    results.apiTests.checked++;
    if (salesResult.data.success) {
      // 查询刚创建的销售佣金比率
      const salesListResult = await makeRequest('https://zhixing-seven.vercel.app/api/sales');
      if (salesListResult.data.success) {
        const latestSale = salesListResult.data.data.find(s => s.wechat_name === testData.wechat_name);
        if (latestSale && latestSale.commission_rate == 30) {
          results.apiTests.working++;
          results.apiTests.details.push('✅ 独立二级销售佣金API: 30%佣金正确');
          console.log('   ✅ 独立二级销售佣金API: 30%佣金正确');
        } else {
          results.apiTests.broken++;
          results.apiTests.details.push(`❌ 独立二级销售佣金API: 佣金比率为${latestSale?.commission_rate}%，应为30%`);
          console.log(`   ❌ 独立二级销售佣金API: 佣金比率为${latestSale?.commission_rate}%，应为30%`);
        }
      }
    } else {
      results.apiTests.broken++;
      results.apiTests.details.push('❌ 独立二级销售创建API失败');
      console.log('   ❌ 独立二级销售创建API失败');
    }
  } catch (error) {
    results.apiTests.broken++;
    results.apiTests.details.push(`❌ 佣金比率API检查失败: ${error.message}`);
    console.log(`   ❌ 佣金比率API检查失败: ${error.message}`);
  }

  // 6. 检查管理员订单API - 销售微信号问题
  console.log('\\n6. 检查管理员订单API - 销售微信号显示');
  try {
    const ordersResult = await makeRequest('https://zhixing-seven.vercel.app/api/admin/orders');
    results.apiTests.checked++;
    if (ordersResult.data && ordersResult.data.success) {
      const orders = ordersResult.data.data || [];
      if (orders.length > 0) {
        const firstOrder = orders[0];
        if (firstOrder.sales_wechat_name && firstOrder.sales_wechat_name.trim() !== '') {
          results.apiTests.working++;
          results.apiTests.details.push('✅ 管理员订单API: 销售微信号正常显示');
          console.log('   ✅ 管理员订单API: 销售微信号正常显示');
        } else {
          results.apiTests.broken++;
          results.apiTests.details.push('❌ 管理员订单API: 销售微信号仍为空');
          console.log('   ❌ 管理员订单API: 销售微信号仍为空 - JOIN查询未修复');
        }
      } else {
        results.apiTests.details.push('⚠️ 管理员订单API: 无订单数据');
        console.log('   ⚠️ 管理员订单API: 无订单数据，无法验证');
      }
    } else {
      results.apiTests.broken++;
      results.apiTests.details.push('❌ 管理员订单API: 请求失败');
      console.log('   ❌ 管理员订单API: 请求失败');
    }
  } catch (error) {
    results.apiTests.broken++;
    results.apiTests.details.push(`❌ 管理员订单API检查失败: ${error.message}`);
    console.log(`   ❌ 管理员订单API检查失败: ${error.message}`);
  }

  console.log('\\n📋 第三部分: 检查Git提交状态\\n');

  // 7. 检查Git提交记录
  console.log('7. 检查最近的Git提交');
  try {
    const { execSync } = require('child_process');
    const commitFiles = execSync('git show --name-only ce6a1e3', { encoding: 'utf8' });
    console.log('   最新提交包含的文件:');
    const files = commitFiles.split('\\n').filter(f => f.trim() && !f.includes('commit') && !f.includes('Author') && !f.includes('Date'));
    files.forEach(file => {
      console.log(`     - ${file}`);
    });
    
    const missingFiles = [
      'client/src/pages/AdminDashboardPage.js',
      'client/src/components/admin/AdminOrders.js',
      'client/src/pages/PrimarySalesPage.js'
    ];
    
    const actualMissing = missingFiles.filter(f => !commitFiles.includes(f));
    if (actualMissing.length > 0) {
      console.log('\\n   ❌ 缺失的关键文件:');
      actualMissing.forEach(file => {
        console.log(`     - ${file}`);
      });
    } else {
      console.log('\\n   ✅ 所有关键文件都已提交');
    }
  } catch (e) {
    console.log('   ❌ Git检查失败');
  }

  // 最终总结
  console.log('\\n📊 修复状态总结');
  console.log('='.repeat(70));
  console.log(`代码文件检查: ${results.codeFiles.correct}/${results.codeFiles.checked} 正确`);
  console.log(`API功能检查: ${results.apiTests.working}/${results.apiTests.checked} 正常`);
  
  console.log('\\n🔍 详细问题:');
  [...results.codeFiles.details, ...results.apiTests.details].forEach(detail => {
    console.log(`   ${detail}`);
  });

  const totalIssues = results.codeFiles.incorrect + results.apiTests.broken;
  if (totalIssues > 0) {
    console.log(`\\n🚨 发现 ${totalIssues} 个问题需要修复！`);
    console.log('建议: 修复所有问题后统一推送部署');
  } else {
    console.log('\\n🎉 所有检查通过，修复已生效！');
  }

  return results;
}

checkAllFixesStatus().catch(console.error);