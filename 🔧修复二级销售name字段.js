// 🔧 修复二级销售注册 name 字段不匹配问题
// 问题：二级销售使用 alipay_surname，但数据库期望 name 字段

console.log('🔧 分析二级销售注册字段问题...\n');

console.log('📋 问题分析:');
console.log('1. 数据库表需要 name 字段（NOT NULL约束）');
console.log('2. 一级销售注册表单使用：name="name" ✅');
console.log('3. 二级销售注册表单使用：name="alipay_surname" ❌');
console.log('4. 字段不匹配导致数据库约束违反\n');

console.log('🎯 解决方案:');
console.log('方案A：修改二级销售表单字段名');
console.log('  - 将 alipay_surname 改为 name');
console.log('  - 保持与一级销售一致');
console.log('');
console.log('方案B：修改后端数据映射');
console.log('  - 后端将 alipay_surname 映射到 name 字段');
console.log('  - 前端保持不变');
console.log('');

console.log('📝 推荐方案：方案A - 修改前端字段名');
console.log('理由：');
console.log('- 保持前后端一致性');
console.log('- 减少数据映射复杂度');
console.log('- 与一级销售保持统一');
console.log('');

console.log('🔧 需要修改的文件：');
console.log('📁 client/src/pages/UnifiedSecondarySalesPage.js');
console.log('   第270行：name="alipay_surname" → name="name"');
console.log('   第272行：message 保持不变（用户看到的提示）');
console.log('');

console.log('✅ 修改后效果：');
console.log('- 二级销售注册成功');
console.log('- name 字段正确存储到数据库');
console.log('- 与一级销售保持一致的数据结构');
console.log('');

console.log('🎯 一级销售链接显示问题：');
console.log('需要检查 createPrimarySales action 是否返回 createdLinks 数据');
console.log('如果返回了，链接应该会自动显示');
console.log('如果没有返回，需要检查后端API响应格式');