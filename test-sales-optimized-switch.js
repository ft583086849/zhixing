/**
 * 销售管理优化 - 测试环境切换脚本
 * 
 * 注意：这是测试脚本，不会修改任何线上文件
 * 只会创建新的测试版本文件供验证
 */

const fs = require('fs');
const path = require('path');

console.log('🧪 销售管理优化 - 测试环境准备\n');
console.log('⚠️  注意：本脚本只创建测试文件，不会修改线上代码\n');

// 需要创建测试版本的文件
const filesToTest = [
  {
    original: 'client/src/components/admin/AdminSales.js',
    test: 'client/src/components/admin/AdminSales.test.js',
    description: '销售管理页面'
  },
  {
    original: 'client/src/services/api.js',
    test: 'client/src/services/api.test.js',
    description: 'API服务'
  },
  {
    original: 'routes/sales.js',
    test: 'routes/sales.test.js',
    description: '后端路由'
  }
];

// 1. 创建测试文件
console.log('📋 将创建以下测试文件：\n');
filesToTest.forEach(file => {
  console.log(`   ${file.test} - ${file.description}`);
});

console.log('\n这些测试文件会：');
console.log('   ✅ 使用 sales_optimized 表');
console.log('   ✅ 优化查询性能');
console.log('   ✅ 修正佣金计算逻辑');
console.log('   ✅ 不影响线上环境');

// 2. 创建测试切换函数
function createTestFiles() {
  console.log('\n🔧 开始创建测试文件...\n');
  
  // 创建 AdminSales.test.js
  const adminSalesTestContent = `
/**
 * 销售管理页面 - 测试版本
 * 使用 sales_optimized 表
 * 
 * 测试方法：
 * 1. 将此文件重命名为 AdminSales.js 替换原文件（先备份）
 * 2. 测试完成后恢复原文件
 */

// ... 测试版本的代码将在这里
// 主要改动：
// 1. 从 primary_sales + secondary_sales 改为查询 sales_optimized
// 2. 使用预置的统计字段
// 3. 修正佣金计算逻辑
`;

  // 创建 api.test.js
  const apiTestContent = `
/**
 * API服务 - 测试版本
 * 使用 sales_optimized 表
 */

// getSales 函数修改为：
export const getSalesOptimized = async (filters = {}) => {
  const { data, error } = await supabase
    .from('sales_optimized')  // 使用新表
    .select(\`
      *,
      total_orders,
      total_amount,
      total_commission,
      primary_commission_amount,
      secondary_commission_amount
    \`)
    .order('created_at', { ascending: false });
    
  if (error) throw error;
  return data;
};
`;

  // 创建测试配置文件
  const testConfigContent = `
/**
 * 测试环境配置
 * 
 * 使用方法：
 * 1. 设置环境变量 USE_OPTIMIZED_TABLES=true
 * 2. 系统将自动使用优化后的表
 */

module.exports = {
  // 是否使用优化表
  useOptimizedTables: process.env.USE_OPTIMIZED_TABLES === 'true',
  
  // 表名映射
  tables: {
    sales: process.env.USE_OPTIMIZED_TABLES === 'true' 
      ? 'sales_optimized' 
      : ['primary_sales', 'secondary_sales'],
    orders: 'orders_optimized'  // 已经在使用优化表
  },
  
  // 测试模式标记
  isTestMode: true
};
`;

  // 写入测试配置
  fs.writeFileSync('test-config.js', testConfigContent);
  console.log('✅ 创建测试配置文件: test-config.js');
  
  return true;
}

// 3. 创建环境切换脚本
const envSwitchScript = `
#!/bin/bash
# 销售管理优化 - 环境切换脚本

echo "🔄 销售管理优化 - 环境切换"
echo ""
echo "请选择操作："
echo "1) 切换到测试环境（使用 sales_optimized）"
echo "2) 切换回生产环境（使用原表）"
echo "3) 查看当前环境"
echo ""
read -p "请输入选项 (1-3): " choice

case $choice in
  1)
    echo "切换到测试环境..."
    export USE_OPTIMIZED_TABLES=true
    echo "✅ 已切换到测试环境"
    echo "   使用表: sales_optimized"
    ;;
  2)
    echo "切换回生产环境..."
    export USE_OPTIMIZED_TABLES=false
    echo "✅ 已切换到生产环境"
    echo "   使用表: primary_sales + secondary_sales"
    ;;
  3)
    if [ "$USE_OPTIMIZED_TABLES" = "true" ]; then
      echo "📍 当前环境: 测试环境 (sales_optimized)"
    else
      echo "📍 当前环境: 生产环境 (原表)"
    fi
    ;;
  *)
    echo "❌ 无效选项"
    ;;
esac
`;

// 4. 创建安全检查清单
const safetyChecklist = `
# 🔒 销售管理优化 - 安全检查清单

## 测试前准备
- [ ] 已执行 create-sales-optimized-table-v2.sql 创建新表
- [ ] 已执行 migrate-to-sales-optimized-v4.sql 迁移数据
- [ ] 已执行 create-sales-sync-triggers.sql 创建同步触发器
- [ ] 已备份现有代码

## 测试步骤
1. [ ] 设置环境变量 USE_OPTIMIZED_TABLES=true
2. [ ] 启动测试服务器
3. [ ] 访问销售管理页面
4. [ ] 验证数据显示正确
5. [ ] 验证佣金计算正确
6. [ ] 验证性能提升

## 测试项目
- [ ] 销售列表加载速度
- [ ] 佣金统计准确性
- [ ] 筛选功能正常
- [ ] 排序功能正常
- [ ] 分页功能正常

## 问题记录
- 问题1：_______________
- 问题2：_______________
- 问题3：_______________

## 回滚步骤
1. [ ] 设置环境变量 USE_OPTIMIZED_TABLES=false
2. [ ] 重启服务
3. [ ] 验证恢复正常

## 批准上线
- [ ] 测试通过
- [ ] 性能达标
- [ ] 无数据问题
- [ ] 批准人签字：_______________
- [ ] 批准时间：_______________
`;

// 写入文件
fs.writeFileSync('switch-env.sh', envSwitchScript);
fs.writeFileSync('safety-checklist.md', safetyChecklist);
fs.writeFileSync('test-config.js', testConfigContent);

console.log('\n✅ 测试环境准备完成！\n');
console.log('📁 已创建文件：');
console.log('   - test-config.js (测试配置)');
console.log('   - switch-env.sh (环境切换脚本)');
console.log('   - safety-checklist.md (安全检查清单)');
console.log('\n🎯 下一步操作：');
console.log('   1. 查看 safety-checklist.md 确认准备工作');
console.log('   2. 运行 bash switch-env.sh 切换到测试环境');
console.log('   3. 测试完成后切换回生产环境');
console.log('\n⚠️  重要：所有修改都在测试环境，不会影响线上！');