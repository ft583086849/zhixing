// 实时测试佣金率0设置功能
const https = require('https');

console.log('🚀 实时测试佣金率设置功能\n');
console.log('=' .repeat(50));

// 测试配置
const testConfig = {
  baseUrl: 'https://zhixing-seven.vercel.app',
  testPages: [
    { name: '管理员销售管理', path: '/admin/sales' },
    { name: '一级销售对账', path: '/primary-sales-settlement' },
    { name: '二级销售对账', path: '/sales-reconciliation' }
  ]
};

// 检查页面可访问性
async function checkPageAccess() {
  console.log('\n📡 检查页面可访问性...\n');
  
  for (const page of testConfig.testPages) {
    await new Promise((resolve) => {
      const url = testConfig.baseUrl + page.path;
      https.get(url, (res) => {
        const status = res.statusCode === 200 ? '✅' : '❌';
        console.log(`${status} ${page.name}: ${res.statusCode} - ${url}`);
        resolve();
      }).on('error', (err) => {
        console.log(`❌ ${page.name}: 连接失败 - ${err.message}`);
        resolve();
      });
    });
  }
}

// 显示测试指南
function showTestGuide() {
  console.log('\n' + '=' .repeat(50));
  console.log('\n📋 手动测试指南：\n');
  
  console.log('步骤 1️⃣: 管理员设置佣金率为0');
  console.log('   访问: https://zhixing-seven.vercel.app/admin/sales');
  console.log('   操作:');
  console.log('   • 找到"张子俊"或"Liangjunhao889"');
  console.log('   • 点击佣金率旁边的编辑按钮');
  console.log('   • 输入 0');
  console.log('   • 点击 ✓ 确认');
  console.log('   预期: 显示"0.0%"而不是"未设置"');
  
  console.log('\n步骤 2️⃣: 验证一级销售对账页面');
  console.log('   访问: https://zhixing-seven.vercel.app/primary-sales-settlement');
  console.log('   检查:');
  console.log('   • 二级销售列表中佣金率为0的显示"0%"');
  console.log('   • 没有橙色"未设置"标签');
  console.log('   • 点击"更新佣金"时显示0，不是默认值');
  
  console.log('\n步骤 3️⃣: 数据持久化测试');
  console.log('   操作:');
  console.log('   • 刷新页面（F5）');
  console.log('   • 清除缓存（Ctrl+Shift+R）');
  console.log('   • 切换到其他页面再返回');
  console.log('   预期: 0%保持不变，不被默认值覆盖');
  
  console.log('\n' + '=' .repeat(50));
  console.log('\n⚠️  重要验证点：\n');
  console.log('1. 0%必须正确显示，不能显示为"未设置"');
  console.log('2. 应返佣金额应该是$0.00');
  console.log('3. 刷新后0%必须保持，不能变成25%/30%/40%');
  console.log('4. 可以从0改为其他值，也可以从其他值改回0');
  
  console.log('\n' + '=' .repeat(50));
  console.log('\n🐛 如果发现问题：\n');
  console.log('• 截图错误页面');
  console.log('• 记录具体操作步骤');
  console.log('• 检查浏览器控制台错误（F12）');
  console.log('• 告知具体的销售人员名称和操作');
}

// 显示修复总结
function showFixSummary() {
  console.log('\n' + '=' .repeat(50));
  console.log('\n🔧 本次修复内容：\n');
  
  const fixes = [
    '区分0（有效值）和null/undefined（未设置）',
    '修复JavaScript的||运算符将0当作falsy值的问题',
    '使用严格相等（===）判断',
    '前端显示逻辑优化',
    '后端默认值处理改进'
  ];
  
  fixes.forEach((fix, index) => {
    console.log(`${index + 1}. ${fix}`);
  });
  
  console.log('\n影响范围：');
  console.log('• AdminSales.js - 管理员销售管理');
  console.log('• PrimarySalesSettlementPage.js - 一级销售对账');
  console.log('• api.js - API层数据处理');
  console.log('• supabase.js - 数据库服务层');
}

// 主函数
async function main() {
  await checkPageAccess();
  showTestGuide();
  showFixSummary();
  
  console.log('\n' + '=' .repeat(50));
  console.log('\n✨ 测试准备完成，请按照上述步骤进行验证！');
  console.log('📝 提交ID: 4c2e8c5');
  console.log('🕐 部署时间: ' + new Date().toLocaleString('zh-CN'));
  console.log('\n');
}

// 执行
main().catch(console.error);
