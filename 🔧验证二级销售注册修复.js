/**
 * 验证二级销售注册修复脚本
 * 用于测试registration_code字段问题是否已解决
 * 
 * 使用方法：
 * 1. 登录管理员后台
 * 2. 打开浏览器控制台(F12)
 * 3. 复制粘贴此脚本运行
 */

console.log('🔧 开始验证二级销售注册修复...\n');

// 测试数据
const testData = {
  wechat_name: `测试二级_${Date.now()}`,
  payment_method: 'crypto',
  chain_name: 'TRC20',
  payment_address: '测试地址123',
  registration_code: 'TEST_REG_CODE_123',  // 这个字段会导致问题
  primary_sales_id: 1,
  sales_type: 'secondary'
};

// 模拟注册请求
async function testRegistration() {
  try {
    console.log('📝 测试数据:', testData);
    
    // 获取 API
    const { salesAPI } = await import('./services/api.js');
    
    console.log('\n🚀 尝试注册二级销售...');
    const result = await salesAPI.registerSecondary(testData);
    
    if (result.success) {
      console.log('✅ 注册成功！修复有效！');
      console.log('📊 返回数据:', result.data);
      
      // 验证关联关系
      if (result.data.primary_sales_id) {
        console.log(`✅ 成功关联到一级销售 ID: ${result.data.primary_sales_id}`);
      } else {
        console.log('⚠️ 注册成功但未关联到一级销售（独立销售）');
      }
      
      // 清理测试数据（可选）
      console.log('\n🗑️ 是否删除测试数据？');
      console.log('如需删除，请在控制台运行：');
      console.log(`await supabaseClient.from('secondary_sales').delete().eq('id', ${result.data.id})`);
      
    } else {
      console.error('❌ 注册失败:', result.message);
    }
    
  } catch (error) {
    console.error('❌ 测试失败:', error);
    
    // 分析错误
    if (error.message?.includes('registration_code')) {
      console.error('\n⚠️ 问题未解决：仍然存在 registration_code 字段错误');
      console.log('请确保：');
      console.log('1. 代码已正确部署到线上');
      console.log('2. 浏览器缓存已清理（强制刷新：Ctrl+Shift+R）');
      console.log('3. Vercel部署已完成');
    } else {
      console.log('\n✅ 好消息：registration_code 错误已解决！');
      console.log('❌ 但出现了其他错误，请检查：', error.message);
    }
  }
}

// 快速验证版本（仅检查代码逻辑）
async function quickCheck() {
  console.log('\n📋 快速检查代码逻辑...');
  
  try {
    const { salesAPI } = await import('./services/api.js');
    
    // 检查 registerSecondary 方法
    const methodString = salesAPI.registerSecondary.toString();
    
    if (methodString.includes('delete dataForDB.registration_code')) {
      console.log('✅ 代码已包含修复逻辑');
      console.log('📝 找到关键代码：delete dataForDB.registration_code');
      return true;
    } else if (methodString.includes('delete salesData.registration_code')) {
      console.log('⚠️ 使用了旧版修复方式，可能影响验证逻辑');
      return false;
    } else {
      console.log('❌ 未找到修复代码，可能未部署最新版本');
      return false;
    }
  } catch (error) {
    console.error('❌ 无法检查代码:', error);
    return false;
  }
}

// 执行测试
(async () => {
  // 先快速检查
  const codeFixed = await quickCheck();
  
  if (codeFixed) {
    console.log('\n是否进行实际注册测试？（会创建测试数据）');
    console.log('运行: testRegistration()');
  } else {
    console.log('\n⚠️ 建议先刷新页面或等待部署完成');
  }
})();

// 导出函数供手动调用
window.testRegistration = testRegistration;
window.quickCheck = quickCheck;
