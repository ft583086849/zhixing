/**
 * 🎯 快速验证支付修改
 * 在不同页面运行此脚本，快速检查修改是否生效
 */

console.clear();
console.log('%c🎯 快速验证支付修改', 'color: #4CAF50; font-size: 16px; font-weight: bold');
console.log('='.repeat(50));

// 获取当前页面路径
const path = window.location.pathname;
console.log('📍 当前页面:', path);

// 检查页面内容
const pageText = document.body.innerText;
const hasAlipay = pageText.includes('支付宝');
const hasCrypto = pageText.includes('链上地址');
const hasOldText = pageText.includes('线上地址码');

console.log('\n📊 检查结果:');
console.log(hasAlipay ? '❌ 仍有"支付宝"文字' : '✅ 无"支付宝"文字');
console.log(hasCrypto ? '✅ 有"链上地址"文字' : '❌ 无"链上地址"文字');
console.log(hasOldText ? '❌ 仍有"线上地址码"旧文案' : '✅ 无"线上地址码"旧文案');

// 根据页面类型进行特定检查
if (path.includes('sales') || path.includes('secondary')) {
  console.log('\n🔍 销售注册页面检查:');
  const selects = document.querySelectorAll('select');
  selects.forEach(select => {
    const options = Array.from(select.options);
    options.forEach(opt => {
      if (opt.value === 'crypto') {
        console.log('✅ 找到链上地址选项:', opt.text);
      }
      if (opt.value === 'alipay') {
        console.log('❌ 发现支付宝选项!');
      }
    });
  });
}

if (path.includes('purchase')) {
  console.log('\n🔍 用户购买页面检查:');
  const radios = document.querySelectorAll('.ant-radio-button-wrapper');
  radios.forEach(radio => {
    console.log('单选按钮:', radio.innerText);
  });
}

if (path.includes('admin')) {
  console.log('\n🔍 管理员页面检查:');
  const cards = document.querySelectorAll('.ant-card-head-title');
  cards.forEach(card => {
    console.log('配置卡片:', card.innerText);
  });
}

console.log('\n' + '='.repeat(50));
console.log('✨ 验证完成！');
