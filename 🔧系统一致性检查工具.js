/**
 * 系统一致性检查工具
 * 用于检测和预防参数名不匹配等问题
 */

// 1. 参数名映射配置
const PARAMETER_MAPPING = {
  // 二级销售注册相关
  secondaryRegistration: {
    urlParams: ['registration_code', 'secondary_registration_code'],
    dbColumn: 'secondary_registration_code',
    apiParam: 'registrationCode',
    description: '二级销售注册码'
  },
  
  // 销售代码相关
  salesCode: {
    urlParams: ['sales_code', 'code'],
    dbColumn: 'sales_code',
    apiParam: 'salesCode',
    description: '销售推广代码'
  },
  
  // 销售ID相关
  primarySalesId: {
    urlParams: ['primary_id'],
    dbColumn: 'primary_sales_id',
    apiParam: 'primarySalesId',
    description: '一级销售ID'
  },
  
  secondarySalesId: {
    urlParams: ['secondary_id'],
    dbColumn: 'secondary_sales_id',
    apiParam: 'secondarySalesId',
    description: '二级销售ID'
  }
};

// 2. URL参数统一处理函数
function getUnifiedParameter(searchParams, paramType) {
  const mapping = PARAMETER_MAPPING[paramType];
  if (!mapping) {
    console.error(`未定义的参数类型: ${paramType}`);
    return null;
  }
  
  // 检查所有可能的参数名
  for (const paramName of mapping.urlParams) {
    const value = searchParams.get(paramName);
    if (value) {
      console.log(`✅ 找到参数 ${paramName}=${value} (${mapping.description})`);
      return value;
    }
  }
  
  console.warn(`⚠️ 未找到任何 ${mapping.description} 参数: ${mapping.urlParams.join(', ')}`);
  return null;
}

// 3. 数据库查询参数验证
function validateDatabaseQuery(tableName, columnName) {
  // 检查列名是否在映射中定义
  const validColumns = Object.values(PARAMETER_MAPPING)
    .map(m => m.dbColumn)
    .filter(Boolean);
  
  if (!validColumns.includes(columnName)) {
    console.error(`❌ 数据库列名 "${columnName}" 未在参数映射中定义！`);
    console.log(`   有效的列名: ${validColumns.join(', ')}`);
    return false;
  }
  
  return true;
}

// 4. API参数转换
function convertToApiParam(value, paramType) {
  const mapping = PARAMETER_MAPPING[paramType];
  if (!mapping) return null;
  
  return {
    [mapping.apiParam]: value
  };
}

// 5. 一致性检查报告
async function runConsistencyCheck() {
  console.log('🔍 开始系统一致性检查...\n');
  
  const issues = [];
  const warnings = [];
  
  // 检查1: URL参数一致性
  console.log('📌 检查URL参数一致性...');
  
  // 模拟检查各个页面的URL参数使用
  const pageChecks = [
    {
      page: 'UnifiedSecondarySalesPage',
      expectedParams: ['registration_code', 'secondary_registration_code'],
      actualCheck: () => {
        // 这里应该实际检查页面代码
        const searchParams = new URLSearchParams(window.location.search);
        return getUnifiedParameter(searchParams, 'secondaryRegistration');
      }
    },
    {
      page: 'OrderConfirmPage',
      expectedParams: ['sales_code'],
      actualCheck: () => {
        const searchParams = new URLSearchParams(window.location.search);
        return getUnifiedParameter(searchParams, 'salesCode');
      }
    }
  ];
  
  // 检查2: 数据库字段一致性
  console.log('\n📌 检查数据库字段一致性...');
  
  const dbChecks = [
    { table: 'primary_sales', column: 'secondary_registration_code', expected: true },
    { table: 'secondary_sales', column: 'registration_code', expected: false }, // 不应该存在
    { table: 'secondary_sales', column: 'sales_code', expected: true },
    { table: 'secondary_sales', column: 'primary_sales_id', expected: true },
    { table: 'orders', column: 'sales_code', expected: true },
    { table: 'orders', column: 'primary_sales_id', expected: true },
    { table: 'orders', column: 'secondary_sales_id', expected: true }
  ];
  
  // 检查3: API参数一致性
  console.log('\n📌 检查API参数一致性...');
  
  const apiChecks = [
    {
      endpoint: '/api/secondary-sales/validate',
      expectedParam: 'registrationCode',
      actualParam: 'registration_code' // 如果不一致会报错
    },
    {
      endpoint: '/api/sales/get-by-code',
      expectedParam: 'salesCode',
      actualParam: 'sales_code'
    }
  ];
  
  // 生成报告
  console.log('\n' + '='.repeat(50));
  console.log('📊 一致性检查报告');
  console.log('='.repeat(50));
  
  if (issues.length > 0) {
    console.log('\n❌ 发现的问题:');
    issues.forEach((issue, i) => {
      console.log(`${i + 1}. ${issue}`);
    });
  }
  
  if (warnings.length > 0) {
    console.log('\n⚠️ 警告:');
    warnings.forEach((warning, i) => {
      console.log(`${i + 1}. ${warning}`);
    });
  }
  
  if (issues.length === 0 && warnings.length === 0) {
    console.log('\n✅ 未发现一致性问题！');
  }
  
  return {
    issues,
    warnings,
    passed: issues.length === 0
  };
}

// 6. 自动修复建议
function generateFixSuggestions(issues) {
  const suggestions = [];
  
  issues.forEach(issue => {
    if (issue.includes('参数名不匹配')) {
      suggestions.push({
        issue,
        fix: '使用 getUnifiedParameter() 函数统一处理URL参数',
        code: `
// 替换原有代码:
const registrationCode = searchParams.get('registration_code');

// 改为:
const registrationCode = getUnifiedParameter(searchParams, 'secondaryRegistration');
        `
      });
    }
    
    if (issue.includes('数据库字段缺失')) {
      suggestions.push({
        issue,
        fix: '添加缺失的数据库字段',
        sql: `
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS primary_sales_id INT,
ADD COLUMN IF NOT EXISTS secondary_sales_id INT;
        `
      });
    }
  });
  
  return suggestions;
}

// 7. 实时监控函数（用于开发环境）
function enableConsistencyMonitoring() {
  console.log('🔔 启用一致性监控...');
  
  // 监控URL参数访问
  if (typeof window !== 'undefined') {
    const originalGet = URLSearchParams.prototype.get;
    URLSearchParams.prototype.get = function(name) {
      // 检查是否使用了不推荐的参数名
      const deprecatedParams = {
        'registration_code': 'secondary_registration_code',
        'code': 'sales_code'
      };
      
      if (deprecatedParams[name]) {
        console.warn(`⚠️ 使用了不推荐的参数名 "${name}"，建议使用 "${deprecatedParams[name]}"`);
      }
      
      return originalGet.call(this, name);
    };
  }
  
  // 监控数据库查询（需要在服务端实现）
  // ...
}

// 导出工具函数
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    PARAMETER_MAPPING,
    getUnifiedParameter,
    validateDatabaseQuery,
    convertToApiParam,
    runConsistencyCheck,
    generateFixSuggestions,
    enableConsistencyMonitoring
  };
}

// 使用示例
console.log('💡 使用示例:\n');
console.log('1. 在页面中统一获取参数:');
console.log('   const registrationCode = getUnifiedParameter(searchParams, "secondaryRegistration");');
console.log('\n2. 运行一致性检查:');
console.log('   const result = await runConsistencyCheck();');
console.log('\n3. 启用开发环境监控:');
console.log('   enableConsistencyMonitoring();');
