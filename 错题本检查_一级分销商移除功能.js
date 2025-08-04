#!/usr/bin/env node

/**
 * 错题本检查 - 一级分销商移除功能API实现
 * 
 * 检查项目：
 * 1. api/sales.js - 添加PUT方法支持
 * 2. api/sales.js - 添加remove-secondary路由处理
 * 3. api/sales.js - 实现handleRemoveSecondarySales函数
 * 4. 权限验证正确集成
 * 5. 前端API调用匹配
 * 6. 数据库事务处理
 * 7. 错误处理完整性
 */

const fs = require('fs');
const path = require('path');

// 错题本检查项目
const checks = [
  {
    id: 'check_1',
    title: 'api/sales.js - PUT方法CORS支持',
    description: '验证CORS头部包含PUT方法',
    file: 'api/sales.js',
    validator: (content) => {
      return content.includes('Access-Control-Allow-Methods') && 
             content.includes('GET,POST,PUT,OPTIONS');
    }
  },
  {
    id: 'check_2', 
    title: 'api/sales.js - remove-secondary路由处理',
    description: '验证添加了remove-secondary路由处理逻辑',
    file: 'api/sales.js',
    validator: (content) => {
      return content.includes("req.method === 'PUT' && path === 'remove-secondary'") &&
             content.includes('handleRemoveSecondarySales');
    }
  },
  {
    id: 'check_3',
    title: 'api/sales.js - handleRemoveSecondarySales函数实现',
    description: '验证实现了完整的移除二级销售处理函数',
    file: 'api/sales.js',
    validator: (content) => {
      return content.includes('async function handleRemoveSecondarySales') &&
             content.includes('const { id } = req.query') &&
             content.includes('const { reason } = req.body');
    }
  },
  {
    id: 'check_4',
    title: 'api/sales.js - 权限验证集成',
    description: '验证移除操作需要管理员权限验证',
    file: 'api/sales.js',
    validator: (content) => {
      return content.includes('const authResult = await verifyAdminAuth(req, res)') &&
             content.includes('if (!authResult.success)');
    }
  },
  {
    id: 'check_5',
    title: 'api/sales.js - 参数验证',
    description: '验证对ID和reason参数进行验证',
    file: 'api/sales.js',
    validator: (content) => {
      return content.includes('if (!id)') &&
             content.includes('缺少必需的二级销售ID') &&
             content.includes('if (!reason)') &&
             content.includes('请提供移除原因');
    }
  },
  {
    id: 'check_6',
    title: 'api/sales.js - 数据库事务处理',
    description: '验证使用数据库事务确保操作原子性',
    file: 'api/sales.js',
    validator: (content) => {
      return content.includes('await connection.beginTransaction()') &&
             content.includes('await connection.commit()') &&
             content.includes('await connection.rollback()');
    }
  },
  {
    id: 'check_7',
    title: 'api/sales.js - 智能移除逻辑',
    description: '验证根据订单数量选择删除或标记移除',
    file: 'api/sales.js',
    validator: (content) => {
      return content.includes('if (orderCount > 0)') &&
             content.includes("SET status = 'removed'") &&
             content.includes('DELETE FROM secondary_sales');
    }
  },
  {
    id: 'check_8',
    title: 'client/src/services/api.js - API调用匹配',
    description: '验证前端API调用与后端路由匹配',
    file: 'client/src/services/api.js', 
    validator: (content) => {
      return content.includes('removeSecondarySales:') &&
             content.includes('/sales?path=remove-secondary&id=');
    }
  },
  {
    id: 'check_9',
    title: 'client/src/store/slices/salesSlice.js - Redux Action存在',
    description: '验证前端有removeSecondarySales的Redux action',
    file: 'client/src/store/slices/salesSlice.js',
    validator: (content) => {
      return content.includes('export const removeSecondarySales') &&
             content.includes('sales/removeSecondarySales');
    }
  },
  {
    id: 'check_10',
    title: 'api/sales.js - 响应格式规范',
    description: '验证API响应包含必要的数据字段',
    file: 'api/sales.js',
    validator: (content) => {
      return content.includes('wechat_name: secondarySales.wechat_name') &&
             content.includes('action: orderCount > 0') &&
             content.includes('order_count: orderCount');
    }
  }
];

// 执行检查
console.log('🔍 开始执行错题本检查 - 一级分销商移除功能API实现');
console.log('='.repeat(60));

let allPassed = true;
const results = [];

for (const check of checks) {
  try {
    console.log(`\n📋 检查项目 ${check.id}: ${check.title}`);
    console.log(`📄 文件: ${check.file}`);
    console.log(`🎯 描述: ${check.description}`);
    
    // 检查文件是否存在
    const filePath = path.join(process.cwd(), check.file);
    if (!fs.existsSync(filePath)) {
      console.log(`❌ 失败: 文件不存在 - ${check.file}`);
      allPassed = false;
      results.push({
        ...check,
        status: 'failed',
        error: '文件不存在'
      });
      continue;
    }
    
    // 读取文件内容
    const content = fs.readFileSync(filePath, 'utf8');
    
    // 执行验证
    const passed = check.validator(content);
    
    if (passed) {
      console.log('✅ 通过');
      results.push({
        ...check,
        status: 'passed'
      });
    } else {
      console.log('❌ 失败');
      allPassed = false;
      results.push({
        ...check,
        status: 'failed',
        error: '验证条件不满足'
      });
    }
    
  } catch (error) {
    console.log(`❌ 失败: ${error.message}`);
    allPassed = false;
    results.push({
      ...check,
      status: 'failed',
      error: error.message
    });
  }
}

// 生成检查报告
console.log('\n' + '='.repeat(60));
console.log('📊 错题本检查结果汇总');
console.log('='.repeat(60));

const passedCount = results.filter(r => r.status === 'passed').length;
const failedCount = results.filter(r => r.status === 'failed').length;

console.log(`✅ 通过: ${passedCount}/${checks.length}`);
console.log(`❌ 失败: ${failedCount}/${checks.length}`);
console.log(`📈 通过率: ${((passedCount / checks.length) * 100).toFixed(1)}%`);

if (allPassed) {
  console.log('\n🎉 所有检查项目均通过！');
  console.log('🚀 可以进行部署');
} else {
  console.log('\n⚠️  存在失败的检查项目:');
  results.filter(r => r.status === 'failed').forEach(result => {
    console.log(`   ❌ ${result.id}: ${result.title} - ${result.error}`);
  });
  console.log('\n🔧 请修复失败项目后重新检查');
}

// 保存检查报告
const reportPath = '错题本检查报告_一级分销商移除功能.json';
fs.writeFileSync(reportPath, JSON.stringify({
  timestamp: new Date().toISOString(),
  summary: {
    total: checks.length,
    passed: passedCount,
    failed: failedCount,
    passRate: ((passedCount / checks.length) * 100).toFixed(1) + '%',
    allPassed: allPassed
  },
  results: results
}, null, 2));

console.log(`\n📄 详细报告已保存: ${reportPath}`);

// 退出码
process.exit(allPassed ? 0 : 1);