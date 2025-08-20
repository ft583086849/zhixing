#!/usr/bin/env node

/**
 * 销售统计排除功能部署脚本
 */

console.log('🚀 销售统计排除功能 - 部署准备\n');

console.log('📋 部署前检查清单:\n');

const checkItems = [
  {
    item: '1. 数据库准备',
    tasks: [
      '✅ SQL文件已创建: create-excluded-sales-table.sql',
      '□ 在Supabase控制台执行SQL创建表',
      '□ 验证表创建成功: excluded_sales_config',
      '□ 验证表创建成功: excluded_sales_log',
      '□ 检查表权限设置正确'
    ]
  },
  {
    item: '2. 后端代码',
    tasks: [
      '✅ ExcludedSalesService服务类已创建',
      '✅ AdminAPI.getStats()已添加排除过滤',
      '✅ AdminAPI.getSales()已添加排除过滤',
      '✅ AdminAPI.getOrders()已添加排除过滤',
      '✅ AdminAPI.getCustomers()已添加排除过滤',
      '✅ SupabaseService.getOrdersWithFilters()已支持排除'
    ]
  },
  {
    item: '3. 前端界面',
    tasks: [
      '✅ ExcludedSalesConfig组件已创建',
      '✅ AdminPaymentConfig页面已集成排除管理',
      '□ 编译无错误',
      '□ ESLint检查通过'
    ]
  },
  {
    item: '4. 功能测试',
    tasks: [
      '□ 数据库表创建测试通过',
      '□ API服务测试通过',
      '□ UI界面测试通过',
      '□ 添加排除功能测试通过',
      '□ 统计过滤效果测试通过',
      '□ 销售对账不受影响测试通过',
      '□ 恢复功能测试通过'
    ]
  }
];

checkItems.forEach(section => {
  console.log(`${section.item}:`);
  section.tasks.forEach(task => {
    console.log(`   ${task}`);
  });
  console.log('');
});

console.log('🔧 部署步骤:\n');

console.log('步骤1: 数据库准备');
console.log('1. 登录Supabase控制台');
console.log('2. 进入SQL Editor');
console.log('3. 复制create-excluded-sales-table.sql内容并执行');
console.log('4. 验证表创建成功\n');

console.log('步骤2: 代码检查');
console.log('1. 运行npm run lint检查代码规范');
console.log('2. 运行npm run build确保编译无错误');
console.log('3. 检查控制台无报错\n');

console.log('步骤3: 功能测试');
console.log('1. 启动本地开发服务器: npm start');
console.log('2. 按照test-excluded-sales-feature.js进行完整测试');
console.log('3. 确保所有测试用例通过\n');

console.log('步骤4: 部署');
console.log('1. 提交代码: git add . && git commit -m "feat: 添加销售统计排除功能"');
console.log('2. 推送到远程: git push origin main');
console.log('3. 等待Vercel自动部署');
console.log('4. 验证线上功能正常\n');

console.log('📁 新增/修改的文件列表:\n');

const files = [
  {
    type: '新增',
    files: [
      'create-excluded-sales-table.sql - 数据库表创建脚本',
      'src/services/excludedSalesService.js - 排除服务类',
      'src/components/admin/ExcludedSalesConfig.js - 排除管理组件',
      'test-excluded-sales-feature.js - 功能测试脚本'
    ]
  },
  {
    type: '修改',
    files: [
      'src/services/api.js - 添加排除过滤逻辑',
      'src/services/supabase.js - 支持排除参数',
      'src/components/admin/AdminPaymentConfig.js - 集成排除管理'
    ]
  }
];

files.forEach(section => {
  console.log(`${section.type}:`);
  section.files.forEach(file => {
    console.log(`   ${file}`);
  });
  console.log('');
});

console.log('⚠️ 部署注意事项:\n');
console.log('1. 确保数据库表创建成功，否则功能无法使用');
console.log('2. 排除功能默认只影响管理员统计，销售对账不受影响');
console.log('3. 所有排除操作都有日志记录，可追溯');
console.log('4. 测试时请使用"测试"开头的销售数据');
console.log('5. 生产环境部署前建议先在测试环境验证\n');

console.log('🎯 功能价值:\n');
console.log('✅ 管理员可灵活排除测试账号数据');
console.log('✅ 提高统计数据的准确性');
console.log('✅ 不影响销售对账，保证业务连续性');
console.log('✅ 支持随时恢复，操作可逆');
console.log('✅ 完整的操作日志和审计追踪\n');

console.log('准备就绪，可以开始部署！🚀');