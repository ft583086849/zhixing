/**
 * 全面测试二级销售注册链路
 * 测试所有场景确保修复不影响其他功能
 * 
 * 使用方法：
 * 1. 登录管理员后台
 * 2. 打开浏览器控制台(F12)
 * 3. 复制粘贴此脚本运行
 */

console.log('🔍 全面测试二级销售注册链路\n');
console.log('=' .repeat(50));

// 测试场景定义
const testScenarios = {
  // 场景1：独立分销注册（无registration_code）
  independent: {
    name: '独立分销注册',
    data: {
      wechat_name: `独立二级_${Date.now()}`,
      payment_method: 'crypto',
      chain_name: 'TRC20',
      payment_address: '独立地址123',
      sales_type: 'secondary'
      // 注意：没有 registration_code 和 primary_sales_id
    },
    expectedResult: {
      has_primary_sales_id: false,
      registration_code_in_data: false
    }
  },

  // 场景2：关联二级分销（有registration_code和primary_sales_id）
  linked_with_both: {
    name: '关联二级分销（完整参数）',
    data: {
      wechat_name: `关联二级_${Date.now()}`,
      payment_method: 'crypto',
      chain_name: 'TRC20',
      payment_address: '关联地址456',
      sales_type: 'secondary',
      registration_code: 'TEST_REG_CODE_123',
      primary_sales_id: 1
    },
    expectedResult: {
      has_primary_sales_id: true,
      registration_code_in_data: false  // 应该被删除
    }
  },

  // 场景3：只有registration_code（需要查询primary_sales_id）
  linked_with_code_only: {
    name: '关联二级分销（仅注册码）',
    data: {
      wechat_name: `关联查询_${Date.now()}`,
      payment_method: 'crypto',
      chain_name: 'TRC20',
      payment_address: '查询地址789',
      sales_type: 'secondary',
      registration_code: 'TEST_REG_CODE_456'
      // 没有 primary_sales_id，需要通过 registration_code 查询
    },
    expectedResult: {
      has_primary_sales_id: 'depends_on_validation',
      registration_code_in_data: false
    }
  },

  // 场景4：边界情况 - 空registration_code
  edge_empty_code: {
    name: '边界情况（空注册码）',
    data: {
      wechat_name: `边界测试_${Date.now()}`,
      payment_method: 'crypto',
      chain_name: 'TRC20',
      payment_address: '边界地址000',
      sales_type: 'secondary',
      registration_code: ''  // 空字符串
    },
    expectedResult: {
      has_primary_sales_id: false,
      registration_code_in_data: false
    }
  }
};

// 测试执行函数
async function runTest(scenario, scenarioName) {
  console.log(`\n📝 测试场景：${scenario.name}`);
  console.log('-'.repeat(40));
  
  try {
    // 获取API
    const { salesAPI } = await import('./services/api.js');
    
    // 创建数据副本避免修改原始数据
    const testData = {...scenario.data};
    
    console.log('输入数据:', testData);
    
    // 调用注册方法
    const result = await salesAPI.registerSecondary(testData);
    
    if (result.success) {
      console.log('✅ 注册成功');
      console.log('返回数据:', result.data);
      
      // 验证结果
      const validations = [];
      
      // 1. 检查 primary_sales_id
      if (scenario.expectedResult.has_primary_sales_id === true) {
        if (result.data.primary_sales_id) {
          validations.push('✅ primary_sales_id 正确存在');
        } else {
          validations.push('❌ primary_sales_id 应该存在但缺失');
        }
      } else if (scenario.expectedResult.has_primary_sales_id === false) {
        if (!result.data.primary_sales_id) {
          validations.push('✅ primary_sales_id 正确为空（独立销售）');
        } else {
          validations.push('❌ primary_sales_id 不应该存在');
        }
      } else {
        validations.push('⚠️ primary_sales_id 取决于验证结果');
      }
      
      // 2. 检查返回数据中是否有 registration_code
      if ('registration_code' in result.data) {
        validations.push('⚠️ 返回数据中包含 registration_code（可能是数据库返回）');
      } else {
        validations.push('✅ 返回数据中没有 registration_code');
      }
      
      // 3. 检查销售代码生成
      if (result.data.sales_code && result.data.sales_code.startsWith('SEC')) {
        validations.push('✅ 销售代码正确生成');
      } else {
        validations.push('❌ 销售代码格式异常');
      }
      
      console.log('\n验证结果:');
      validations.forEach(v => console.log('  ' + v));
      
      // 返回测试结果
      return {
        scenario: scenarioName,
        success: true,
        salesId: result.data.id,
        validations
      };
      
    } else {
      console.error('❌ 注册失败:', result.message);
      return {
        scenario: scenarioName,
        success: false,
        error: result.message
      };
    }
    
  } catch (error) {
    console.error('❌ 测试异常:', error);
    
    // 分析错误类型
    if (error.message?.includes('registration_code')) {
      console.error('💣 严重问题：registration_code 字段错误仍然存在！');
    }
    
    return {
      scenario: scenarioName,
      success: false,
      error: error.message
    };
  }
}

// 批量执行测试
async function runAllTests() {
  console.log('\n🚀 开始批量测试...\n');
  
  const results = [];
  const createdIds = [];
  
  for (const [key, scenario] of Object.entries(testScenarios)) {
    const result = await runTest(scenario, key);
    results.push(result);
    
    if (result.success && result.salesId) {
      createdIds.push(result.salesId);
    }
    
    // 等待一下避免太快
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  // 汇总结果
  console.log('\n' + '='.repeat(50));
  console.log('📊 测试汇总\n');
  
  const successCount = results.filter(r => r.success).length;
  const failCount = results.filter(r => !r.success).length;
  
  console.log(`✅ 成功: ${successCount} 个`);
  console.log(`❌ 失败: ${failCount} 个`);
  
  if (failCount > 0) {
    console.log('\n失败详情:');
    results.filter(r => !r.success).forEach(r => {
      console.log(`  - ${r.scenario}: ${r.error}`);
    });
  }
  
  // 清理选项
  if (createdIds.length > 0) {
    console.log('\n🗑️ 清理测试数据');
    console.log(`创建了 ${createdIds.length} 条测试记录`);
    console.log('运行以下命令清理:');
    console.log(`await cleanTestData([${createdIds.join(', ')}])`);
  }
  
  return results;
}

// 清理函数
async function cleanTestData(ids) {
  if (!ids || ids.length === 0) {
    console.log('没有需要清理的数据');
    return;
  }
  
  console.log(`🗑️ 清理 ${ids.length} 条测试数据...`);
  
  try {
    for (const id of ids) {
      const { error } = await supabaseClient
        .from('secondary_sales')
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error(`删除 ID ${id} 失败:`, error);
      } else {
        console.log(`✅ 删除 ID ${id}`);
      }
    }
    
    console.log('清理完成');
  } catch (error) {
    console.error('清理失败:', error);
  }
}

// 快速验证修复
async function quickValidate() {
  console.log('\n⚡ 快速验证修复状态...\n');
  
  try {
    // 1. 检查代码是否包含修复
    const { salesAPI } = await import('./services/api.js');
    const methodStr = salesAPI.registerSecondary.toString();
    
    if (methodStr.includes('const dataForDB = {...salesData}') && 
        methodStr.includes('delete dataForDB.registration_code')) {
      console.log('✅ 代码包含最新修复');
    } else {
      console.log('⚠️ 代码可能未更新到最新版本');
      return false;
    }
    
    // 2. 测试一个简单场景
    console.log('\n测试独立分销注册...');
    const testResult = await salesAPI.registerSecondary({
      wechat_name: `快速测试_${Date.now()}`,
      payment_method: 'crypto',
      chain_name: 'TRC20',
      payment_address: '测试地址',
      sales_type: 'secondary'
    });
    
    if (testResult.success) {
      console.log('✅ 独立分销注册正常');
      
      // 清理
      await supabaseClient
        .from('secondary_sales')
        .delete()
        .eq('id', testResult.data.id);
        
      return true;
    } else {
      console.log('❌ 注册失败:', testResult.message);
      return false;
    }
    
  } catch (error) {
    if (error.message?.includes('registration_code')) {
      console.error('❌ registration_code 错误仍然存在');
    } else {
      console.error('❌ 其他错误:', error.message);
    }
    return false;
  }
}

// 导出函数
window.runAllTests = runAllTests;
window.runTest = runTest;
window.cleanTestData = cleanTestData;
window.quickValidate = quickValidate;
window.testScenarios = testScenarios;

// 提示
console.log('\n可用命令:');
console.log('- quickValidate()      : 快速验证修复状态');
console.log('- runAllTests()        : 运行所有测试场景');
console.log('- runTest(scenario)    : 运行单个测试');
console.log('- cleanTestData(ids)   : 清理测试数据');
console.log('\n建议先运行: quickValidate()');
