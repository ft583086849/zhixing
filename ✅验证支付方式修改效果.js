/**
 * ✅ 验证支付方式修改效果
 * 在浏览器控制台运行，验证支付宝已被移除，只保留链上地址
 */

console.log('='.repeat(50));
console.log('🔍 验证支付方式修改效果');
console.log('='.repeat(50));

async function verifyPaymentMethods() {
  const results = {
    页面加载: {},
    支付选项: {},
    文案检查: {},
    功能测试: {}
  };
  
  try {
    // 1. 检查当前页面
    console.log('\n1️⃣ 检查当前页面...');
    const currentUrl = window.location.href;
    console.log('当前页面:', currentUrl);
    
    // 2. 检查页面中是否还有"支付宝"相关内容
    console.log('\n2️⃣ 检查页面中的支付宝引用...');
    const pageContent = document.body.innerText;
    const hasAlipay = pageContent.includes('支付宝');
    const hasAlipayOption = document.querySelector('option[value="alipay"]');
    
    if (hasAlipay) {
      console.warn('⚠️ 页面中仍包含"支付宝"文字');
      results.页面加载.支付宝文字 = '仍存在';
    } else {
      console.log('✅ 页面中无"支付宝"文字');
      results.页面加载.支付宝文字 = '已移除';
    }
    
    if (hasAlipayOption) {
      console.warn('⚠️ 页面中仍有支付宝选项');
      results.页面加载.支付宝选项 = '仍存在';
    } else {
      console.log('✅ 页面中无支付宝选项');
      results.页面加载.支付宝选项 = '已移除';
    }
    
    // 3. 检查"链上地址"文案
    console.log('\n3️⃣ 检查链上地址文案...');
    const hasCrypto = pageContent.includes('链上地址');
    const hasOldText = pageContent.includes('线上地址码');
    
    if (hasCrypto) {
      console.log('✅ 找到"链上地址"文案');
      results.文案检查.链上地址 = '正确';
    } else {
      console.warn('⚠️ 未找到"链上地址"文案');
      results.文案检查.链上地址 = '未找到';
    }
    
    if (hasOldText) {
      console.warn('⚠️ 仍有旧文案"线上地址码"');
      results.文案检查.旧文案 = '仍存在';
    } else {
      console.log('✅ 旧文案"线上地址码"已移除');
      results.文案检查.旧文案 = '已移除';
    }
    
    // 4. 检查支付方式选择器
    console.log('\n4️⃣ 检查支付方式选择器...');
    const paymentSelects = document.querySelectorAll('select');
    let cryptoOptionFound = false;
    
    paymentSelects.forEach(select => {
      const options = select.querySelectorAll('option');
      options.forEach(option => {
        if (option.value === 'crypto') {
          cryptoOptionFound = true;
          console.log('✅ 找到链上地址选项:', option.innerText);
        }
        if (option.value === 'alipay') {
          console.warn('⚠️ 发现支付宝选项!', option);
        }
      });
    });
    
    results.支付选项.链上地址选项 = cryptoOptionFound ? '存在' : '未找到';
    
    // 5. 检查Radio按钮（用户购买页面）
    console.log('\n5️⃣ 检查Radio按钮...');
    const radioButtons = document.querySelectorAll('.ant-radio-button-wrapper');
    radioButtons.forEach(button => {
      const text = button.innerText;
      if (text.includes('链上地址')) {
        console.log('✅ 找到链上地址单选按钮');
        results.支付选项.链上地址按钮 = '存在';
      }
      if (text.includes('支付宝')) {
        console.warn('⚠️ 发现支付宝单选按钮!');
        results.支付选项.支付宝按钮 = '仍存在';
      }
    });
    
    // 6. 如果在管理员页面，检查配置
    if (currentUrl.includes('/admin')) {
      console.log('\n6️⃣ 检查管理员配置...');
      const cards = document.querySelectorAll('.ant-card-head-title');
      cards.forEach(card => {
        const title = card.innerText;
        if (title.includes('链上地址收款配置')) {
          console.log('✅ 找到链上地址配置卡片');
          results.功能测试.链上地址配置 = '存在';
        }
        if (title.includes('支付宝收款配置')) {
          console.warn('⚠️ 发现支付宝配置卡片!');
          results.功能测试.支付宝配置 = '仍存在';
        }
      });
    }
    
    // 7. 测试API（如果有权限）
    if (window.adminAPI) {
      console.log('\n7️⃣ 测试支付配置API...');
      try {
        const config = await window.adminAPI.getPaymentConfig();
        console.log('支付配置:', config);
        
        if (config.alipay_account || config.alipay_name || config.alipay_qr_code) {
          console.warn('⚠️ 配置中仍有支付宝字段');
          results.功能测试.支付宝字段 = '仍存在';
        } else {
          console.log('✅ 配置中无支付宝字段');
          results.功能测试.支付宝字段 = '已移除';
        }
        
        if (config.crypto_chain_name || config.crypto_address) {
          console.log('✅ 链上地址配置正常');
          results.功能测试.链上地址字段 = '正常';
        }
      } catch (error) {
        console.log('跳过API测试（无权限）');
      }
    }
    
  } catch (error) {
    console.error('验证过程出错:', error);
  }
  
  // 显示结果汇总
  console.log('\n' + '='.repeat(50));
  console.log('📊 验证结果汇总');
  console.log('='.repeat(50));
  
  for (const [category, items] of Object.entries(results)) {
    console.log(`\n【${category}】`);
    for (const [key, value] of Object.entries(items)) {
      const icon = value.includes('已移除') || value.includes('正确') || value.includes('正常') || value === '存在' ? '✅' : '⚠️';
      console.log(`  ${icon} ${key}: ${value}`);
    }
  }
  
  // 提供测试建议
  console.log('\n' + '='.repeat(50));
  console.log('💡 建议测试以下页面:');
  console.log('='.repeat(50));
  console.log('1. 一级销售注册: /sales');
  console.log('2. 二级销售注册: /secondary-sales');
  console.log('3. 用户购买页面: /purchase?sales_code=xxx');
  console.log('4. 管理员配置: /admin/payment-config');
  console.log('5. 销售管理: /admin/sales');
  console.log('6. 订单管理: /admin/orders');
  
  return results;
}

// 执行验证
verifyPaymentMethods().then(results => {
  console.log('\n✅ 验证完成！');
  
  // 检查是否完全成功
  const hasIssues = JSON.stringify(results).includes('仍存在') || 
                    JSON.stringify(results).includes('未找到');
  
  if (hasIssues) {
    console.warn('\n⚠️ 发现一些问题，请检查上述警告信息');
  } else {
    console.log('\n🎉 所有检查通过！支付宝已完全移除，链上地址配置正常！');
  }
});
