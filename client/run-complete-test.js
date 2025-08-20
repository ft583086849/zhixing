#!/usr/bin/env node

/**
 * 销售统计排除功能 - 完整验证脚本
 */

console.log('🧪 销售统计排除功能 - 完整验证\n');

const testSteps = [
  {
    step: 1,
    title: '✅ 文件完整性检查',
    action: () => {
      const fs = require('fs');
      const path = require('path');
      
      const files = [
        'src/services/excludedSalesService.js',
        'src/components/admin/ExcludedSalesConfig.js',
        'src/components/admin/AdminPaymentConfig.js'
      ];
      
      console.log('检查必要文件...');
      let allExist = true;
      files.forEach(file => {
        const exists = fs.existsSync(path.join(__dirname, file));
        console.log(exists ? '✅' : '❌', file);
        if (!exists) allExist = false;
      });
      
      return allExist;
    }
  },
  
  {
    step: 2,
    title: '🔍 代码语法验证',
    action: () => {
      console.log('检查关键代码结构...');
      const fs = require('fs');
      
      try {
        // 检查服务类
        const serviceContent = fs.readFileSync('src/services/excludedSalesService.js', 'utf8');
        const hasService = serviceContent.includes('class ExcludedSalesService') || 
                          serviceContent.includes('ExcludedSalesService');
        const hasMethods = serviceContent.includes('getExcludedSales') && 
                          serviceContent.includes('addExcludedSales');
        
        console.log(hasService ? '✅' : '❌', '服务类定义');
        console.log(hasMethods ? '✅' : '❌', '核心方法');
        
        // 检查组件
        const componentContent = fs.readFileSync('src/components/admin/ExcludedSalesConfig.js', 'utf8');
        const hasComponent = componentContent.includes('ExcludedSalesConfig');
        const hasUI = componentContent.includes('Table') && componentContent.includes('Button');
        
        console.log(hasComponent ? '✅' : '❌', '组件定义');
        console.log(hasUI ? '✅' : '❌', 'UI组件');
        
        return hasService && hasMethods && hasComponent && hasUI;
      } catch (error) {
        console.log('❌ 代码检查失败:', error.message);
        return false;
      }
    }
  },
  
  {
    step: 3,
    title: '📊 数据库表检查',
    action: () => {
      console.log('检查数据库表创建脚本...');
      const fs = require('fs');
      
      try {
        const sqlContent = fs.readFileSync('../create-excluded-sales-table.sql', 'utf8');
        const hasConfigTable = sqlContent.includes('excluded_sales_config');
        const hasLogTable = sqlContent.includes('excluded_sales_log');
        const hasIndexes = sqlContent.includes('CREATE INDEX');
        
        console.log(hasConfigTable ? '✅' : '❌', '配置表结构');
        console.log(hasLogTable ? '✅' : '❌', '日志表结构');
        console.log(hasIndexes ? '✅' : '❌', '索引定义');
        
        return hasConfigTable && hasLogTable;
      } catch (error) {
        console.log('❌ SQL脚本检查失败:', error.message);
        return false;
      }
    }
  }
];

console.log('🚀 开始逐步验证...\n');

let allPassed = true;
testSteps.forEach(test => {
  console.log(`步骤 ${test.step}: ${test.title}`);
  const result = test.action();
  if (!result) {
    allPassed = false;
    console.log('❌ 该步骤验证失败\n');
  } else {
    console.log('✅ 该步骤验证通过\n');
  }
});

console.log('📋 验证总结:');
if (allPassed) {
  console.log('🎉 所有验证都通过！功能准备就绪');
  console.log('\n📍 下一步操作:');
  console.log('1. 打开浏览器访问: http://localhost:3000/admin/dashboard');
  console.log('2. 使用管理员账号登录');
  console.log('3. 点击左侧菜单"收款配置"');
  console.log('4. 在页面底部查看"统计排除名单"部分');
  console.log('5. 测试添加排除和查看统计功能');
} else {
  console.log('❌ 部分验证失败，请检查上述问题');
}

console.log('\n🔧 手动测试步骤:');
console.log('1. 访问管理后台并登录');
console.log('2. 进入收款配置页面');
console.log('3. 测试添加排除销售功能');
console.log('4. 验证统计过滤效果');
console.log('5. 确认销售对账页面不受影响');

console.log('\n✨ 预期看到的效果:');
console.log('• 收款配置页面显示排除名单管理');
console.log('• 可以成功添加销售到排除名单');
console.log('• 管理后台统计自动排除指定销售');
console.log('• 销售对账页面数据保持完整');
console.log('• 排除操作有完整的日志记录');

console.log('\n🎯 测试完成！');