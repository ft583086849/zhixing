/**
 * 测试收益分配数据库功能
 * 
 * 使用方法：
 * 1. 先在Supabase运行创建表SQL
 * 2. 访问 https://zhixing-seven.vercel.app/admin/finance
 * 3. 打开控制台(F12)
 * 4. 运行此脚本
 */

console.log('🔧 测试收益分配数据库功能\n');
console.log('='.repeat(50));

// 1. 测试获取配置
async function testGetConfig() {
  console.log('\n📋 1. 测试获取配置:');
  
  try {
    const { AdminAPI } = await import('./services/api.js');
    const config = await AdminAPI.getProfitDistribution();
    
    console.log('✅ 获取成功:');
    console.log('  公户占比:', config.public_ratio + '%');
    console.log('  知行占比:', config.zhixing_ratio + '%');
    console.log('  子俊占比:', config.zijun_ratio + '%');
    console.log('  总和:', (config.public_ratio + config.zhixing_ratio + config.zijun_ratio) + '%');
    
    return config;
  } catch (error) {
    console.error('❌ 获取失败:', error);
    return null;
  }
}

// 2. 测试保存配置
async function testSaveConfig(ratios) {
  console.log('\n💾 2. 测试保存配置:');
  
  try {
    const { AdminAPI } = await import('./services/api.js');
    
    const testRatios = ratios || {
      public: 45,
      zhixing: 30,
      zijun: 25
    };
    
    console.log('准备保存:', testRatios);
    const result = await AdminAPI.saveProfitDistribution(testRatios);
    
    if (result.success) {
      console.log('✅ 保存成功!');
      console.log('  返回数据:', result.data);
    } else {
      console.log('⚠️ 保存失败:', result.message);
    }
    
    return result;
  } catch (error) {
    console.error('❌ 保存异常:', error);
    return null;
  }
}

// 3. 检查页面状态
function checkPageState() {
  console.log('\n🔍 3. 检查页面状态:');
  
  // 检查保存按钮
  const saveButton = document.querySelector('button[type="primary"]');
  if (saveButton) {
    const buttonText = saveButton.textContent;
    console.log('保存按钮状态:', buttonText);
    
    if (buttonText.includes('已保存')) {
      console.log('✅ 配置已同步');
    } else if (buttonText.includes('保存分配方案')) {
      console.log('⚠️ 有未保存的更改');
    }
  } else {
    console.log('❌ 未找到保存按钮');
  }
  
  // 检查滑块值
  const sliders = document.querySelectorAll('.ant-input-number-input');
  if (sliders.length >= 3) {
    console.log('\n当前页面配置:');
    console.log('  公户:', sliders[0].value + '%');
    console.log('  知行:', sliders[1].value + '%');
    console.log('  子俊:', sliders[2].value + '%');
  }
}

// 4. 测试完整流程
async function testFullFlow() {
  console.log('\n🚀 4. 测试完整流程:');
  
  try {
    // 获取当前配置
    console.log('\n步骤1: 获取当前配置');
    const currentConfig = await testGetConfig();
    
    // 修改并保存
    console.log('\n步骤2: 修改配置');
    const newRatios = {
      public: 35,
      zhixing: 35,
      zijun: 30
    };
    console.log('新配置:', newRatios);
    
    const saveResult = await testSaveConfig(newRatios);
    
    // 验证保存
    if (saveResult && saveResult.success) {
      console.log('\n步骤3: 验证保存');
      const verifyConfig = await testGetConfig();
      
      if (verifyConfig.public_ratio === newRatios.public &&
          verifyConfig.zhixing_ratio === newRatios.zhixing &&
          verifyConfig.zijun_ratio === newRatios.zijun) {
        console.log('✅ 数据库保存验证成功!');
      } else {
        console.log('⚠️ 数据不一致');
      }
    }
    
    // 恢复原配置
    if (currentConfig) {
      console.log('\n步骤4: 恢复原配置');
      await testSaveConfig({
        public: currentConfig.public_ratio,
        zhixing: currentConfig.zhixing_ratio,
        zijun: currentConfig.zijun_ratio
      });
      console.log('✅ 已恢复原配置');
    }
    
  } catch (error) {
    console.error('❌ 流程测试失败:', error);
  }
}

// 5. 查看数据库记录（通过Supabase客户端）
async function viewDatabaseRecords() {
  console.log('\n📊 5. 查看数据库记录:');
  
  try {
    const supabaseClient = window.supabaseClient;
    if (!supabaseClient) {
      console.log('⚠️ Supabase客户端未初始化');
      return;
    }
    
    const { data, error } = await supabaseClient
      .from('profit_distribution')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (error) {
      console.error('❌ 查询失败:', error);
      return;
    }
    
    console.log(`找到 ${data.length} 条记录:`);
    data.forEach((record, index) => {
      console.log(`\n记录 ${index + 1}:`);
      console.log('  创建时间:', new Date(record.created_at).toLocaleString());
      console.log('  公户:', record.public_ratio + '%');
      console.log('  知行:', record.zhixing_ratio + '%');
      console.log('  子俊:', record.zijun_ratio + '%');
      console.log('  是否激活:', record.is_active ? '✅' : '❌');
    });
    
  } catch (error) {
    console.error('❌ 查询异常:', error);
  }
}

// 主测试函数
async function runAllTests() {
  console.log('\n🎯 开始全面测试...\n');
  
  // 1. 检查页面状态
  checkPageState();
  
  // 2. 测试获取配置
  await testGetConfig();
  
  // 3. 查看数据库记录
  await viewDatabaseRecords();
  
  console.log('\n' + '='.repeat(50));
  console.log('✨ 基础测试完成！\n');
  
  console.log('可选测试:');
  console.log('- testSaveConfig({public: 40, zhixing: 35, zijun: 25})  : 测试保存');
  console.log('- testFullFlow()                                        : 完整流程测试');
  console.log('- viewDatabaseRecords()                                 : 查看历史记录');
}

// 导出函数
window.testGetConfig = testGetConfig;
window.testSaveConfig = testSaveConfig;
window.checkPageState = checkPageState;
window.testFullFlow = testFullFlow;
window.viewDatabaseRecords = viewDatabaseRecords;
window.runAllTests = runAllTests;

// 自动运行提示
console.log('可用命令:');
console.log('- runAllTests()      : 运行基础测试');
console.log('- testFullFlow()     : 完整流程测试（会修改数据）');
console.log('- testSaveConfig()   : 测试保存功能');
console.log('- viewDatabaseRecords() : 查看历史记录');
console.log('\n运行 runAllTests() 开始测试');
