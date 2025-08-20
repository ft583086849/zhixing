#!/usr/bin/env node

/**
 * 部署销售排除功能
 * 只包含排除功能相关的文件，不包含其他修改
 */

console.log('📦 准备部署销售排除功能...\n');

console.log('📋 需要部署的文件清单：');
console.log('1. src/services/excludedSalesService.js - 排除服务核心逻辑');
console.log('2. src/services/api.js - API层的排除过滤逻辑');
console.log('3. 数据库表: excluded_sales_config');
console.log('4. 数据库表: excluded_sales_log (可选，用于记录日志)');

console.log('\n⚠️ 注意事项：');
console.log('• 不包含statsUpdater.js的修改（待返佣金修复）');
console.log('• 不包含其他无关的修改');
console.log('• 只部署排除功能相关代码');

console.log('\n🔍 部署前检查清单：');
console.log('✅ 1. 确认线上数据库有excluded_sales_config表');
console.log('✅ 2. 确认表结构包含is_active字段');
console.log('✅ 3. 确认前端代码已准备就绪');
console.log('✅ 4. 确认API过滤逻辑正确');

console.log('\n📊 功能影响范围：');
console.log('• 数据概览页面 - 统计数据会排除指定销售');
console.log('• 销售管理页面 - 销售列表和统计会排除');
console.log('• 财务管理页面 - 佣金统计会排除');
console.log('• 转化率统计 - 会排除指定销售的数据');
console.log('• Top5排行榜 - 不会显示被排除的销售');

console.log('\n🚀 部署步骤：');
console.log('1. 先在线上数据库创建表结构（如果还没有）');
console.log('2. 部署前端代码更新');
console.log('3. 验证功能正常工作');

console.log('\n📝 数据库表结构SQL：');
const createTableSQL = `
-- 创建排除销售配置表（如果不存在）
CREATE TABLE IF NOT EXISTS excluded_sales_config (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  wechat_name VARCHAR(255) NOT NULL,
  sales_code VARCHAR(255),
  sales_type VARCHAR(50),
  is_active BOOLEAN DEFAULT true,
  excluded_by VARCHAR(255),
  reason TEXT,
  excluded_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_excluded_sales_active ON excluded_sales_config(is_active);
CREATE INDEX IF NOT EXISTS idx_excluded_sales_code ON excluded_sales_config(sales_code);
CREATE INDEX IF NOT EXISTS idx_excluded_wechat ON excluded_sales_config(wechat_name);

-- 创建操作日志表（可选）
CREATE TABLE IF NOT EXISTS excluded_sales_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  wechat_name VARCHAR(255),
  sales_code VARCHAR(255),
  action VARCHAR(50), -- 'exclude' 或 'restore'
  reason TEXT,
  operated_by VARCHAR(255),
  affected_orders_count INTEGER,
  affected_amount DECIMAL(10,2),
  affected_commission DECIMAL(10,2),
  operated_at TIMESTAMP DEFAULT NOW()
);
`;

console.log(createTableSQL);

console.log('\n✨ 部署后验证：');
console.log('1. 添加测试排除（如wangming）');
console.log('2. 检查各统计页面数据变化');
console.log('3. 确认数值计算准确');
console.log('4. 清理测试数据');

console.log('\n🎯 最终确认：');
console.log('• 只部署排除功能，不包含其他修改');
console.log('• 确保不影响现有功能');
console.log('• 保证数据准确性');