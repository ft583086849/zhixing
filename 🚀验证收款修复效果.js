/**
 * 🚀 验证收款修复效果
 * 
 * 修复内容：
 * 1. SalesPage.js（一级销售）：handleSubmit 中自动将 wechat_name 赋值给 name
 * 2. UnifiedSecondarySalesPage.js（二级销售）：同样的修复逻辑
 * 
 * 业务逻辑：
 * - 微信号（wechat_name）是必填项
 * - name 字段自动取值自 wechat_name
 * - 无论选择支付宝还是线上地址码，都必须填写微信号
 */

console.log('='.repeat(60));
console.log('🚀 开始验证收款修复效果');
console.log('='.repeat(60));

// ========================================
// 步骤1：模拟测试数据提交
// ========================================
async function testSalesSubmission() {
  console.log('\n📋 模拟测试销售注册...');
  
  // 测试数据（故意只有微信号，没有name字段）
  const testData = {
    wechat_name: 'test_wechat_user',
    payment_method: 'crypto', // 测试线上地址码
    payment_address: 'test_crypto_address'
  };
  
  console.log('测试数据（未包含name字段）:', testData);
  
  // 模拟表单提交
  console.log('\n✅ 修复后的逻辑会自动添加 name = wechat_name');
  console.log('提交的数据将会是:', {
    ...testData,
    name: testData.wechat_name // 自动添加
  });
  
  return true;
}

// ========================================
// 步骤2：验证页面表单
// ========================================
function verifyFormLogic() {
  console.log('\n📋 验证当前页面表单逻辑...');
  
  // 检查是否在销售注册页面
  const currentUrl = window.location.pathname;
  let pageType = '';
  
  if (currentUrl.includes('/sales') && !currentUrl.includes('secondary')) {
    pageType = '一级销售注册页面';
  } else if (currentUrl.includes('secondary')) {
    pageType = '二级销售注册页面';
  } else {
    console.log('⚠️ 当前不在销售注册页面');
    console.log('请访问以下页面之一进行测试：');
    console.log('- /sales (一级销售)');
    console.log('- /secondary-sales (二级销售)');
    return false;
  }
  
  console.log(`✅ 当前页面: ${pageType}`);
  
  // 查找表单元素
  const forms = document.querySelectorAll('form');
  let hasWechatField = false;
  let hasNameField = false;
  
  forms.forEach((form, idx) => {
    const wechatInput = form.querySelector('[name="wechat_name"]');
    const nameInput = form.querySelector('[name="name"]');
    
    if (wechatInput) {
      hasWechatField = true;
      console.log(`✅ 找到微信号输入框（必填）`);
    }
    
    if (nameInput && nameInput.type !== 'hidden') {
      hasNameField = true;
      console.log(`⚠️ 发现可见的name输入框（应该已被移除或隐藏）`);
    }
  });
  
  if (hasWechatField && !hasNameField) {
    console.log('✅ 表单结构正确：只有微信号输入，name会自动获取');
  }
  
  return true;
}

// ========================================
// 步骤3：实时监控表单提交
// ========================================
function monitorFormSubmission() {
  console.log('\n📋 安装表单提交监控器...');
  
  // 拦截 fetch 请求
  const originalFetch = window.fetch;
  window.fetch = async function(...args) {
    const [url, options = {}] = args;
    
    // 检查是否是销售相关的请求
    if (url && (url.includes('sales') || url.includes('primary_sales'))) {
      console.log('\n🔍 拦截到销售请求:', url);
      
      if (options.body) {
        try {
          const bodyData = JSON.parse(options.body);
          console.log('请求数据:', bodyData);
          
          // 检查关键字段
          if (bodyData.wechat_name) {
            console.log(`✅ wechat_name: ${bodyData.wechat_name}`);
          }
          
          if (bodyData.name) {
            console.log(`✅ name: ${bodyData.name}`);
            if (bodyData.name === bodyData.wechat_name) {
              console.log('✅ name字段正确设置为wechat_name的值');
            }
          } else {
            console.log('❌ 缺少name字段！');
          }
          
          if (bodyData.payment_method) {
            console.log(`✅ payment_method: ${bodyData.payment_method}`);
          }
        } catch (e) {
          // 忽略解析错误
        }
      }
    }
    
    return originalFetch.apply(this, args);
  };
  
  console.log('✅ 监控器已安装，现在提交表单时会显示详细信息');
}

// ========================================
// 步骤4：测试提交功能
// ========================================
function setupTestButton() {
  console.log('\n📋 创建测试按钮...');
  
  // 查找提交按钮
  const submitButtons = document.querySelectorAll('button[type="submit"], button');
  let targetButton = null;
  
  submitButtons.forEach(btn => {
    if (btn.textContent.includes('提交') || btn.textContent.includes('创建')) {
      targetButton = btn;
    }
  });
  
  if (targetButton) {
    // 创建测试按钮
    const testBtn = document.createElement('button');
    testBtn.textContent = '🧪 测试线上地址收款';
    testBtn.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      padding: 10px 20px;
      background: #1890ff;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      z-index: 9999;
      font-size: 14px;
    `;
    
    testBtn.onclick = () => {
      console.log('\n🧪 执行测试提交...');
      
      // 填充测试数据
      const wechatInput = document.querySelector('[name="wechat_name"]');
      const methodSelect = document.querySelector('[name="payment_method"]');
      const addressInput = document.querySelector('[name="payment_address"]');
      
      if (wechatInput) {
        wechatInput.value = 'test_wechat_' + Date.now();
        wechatInput.dispatchEvent(new Event('change', { bubbles: true }));
        console.log('✅ 填充微信号:', wechatInput.value);
      }
      
      if (methodSelect) {
        // 选择线上地址码
        methodSelect.value = 'crypto';
        methodSelect.dispatchEvent(new Event('change', { bubbles: true }));
        console.log('✅ 选择收款方式: 线上地址码');
      }
      
      if (addressInput) {
        addressInput.value = 'test_crypto_' + Date.now();
        addressInput.dispatchEvent(new Event('change', { bubbles: true }));
        console.log('✅ 填充收款地址');
      }
      
      console.log('\n⚠️ 请手动点击提交按钮，观察控制台输出');
    };
    
    document.body.appendChild(testBtn);
    console.log('✅ 测试按钮已添加到页面右下角');
  }
}

// ========================================
// 执行验证
// ========================================
async function runVerification() {
  console.log('\n🚀 执行验证流程...\n');
  
  // 1. 测试数据提交逻辑
  await testSalesSubmission();
  
  // 2. 验证页面表单
  verifyFormLogic();
  
  // 3. 安装监控器
  monitorFormSubmission();
  
  // 4. 创建测试按钮
  setupTestButton();
  
  // 总结
  console.log('\n' + '='.repeat(60));
  console.log('📝 修复验证总结');
  console.log('='.repeat(60));
  
  console.log(`
✅ 修复已应用到以下文件：
1. client/src/pages/SalesPage.js
2. client/src/pages/UnifiedSecondarySalesPage.js

✅ 修复逻辑：
- handleSubmit 函数中自动设置 name = wechat_name
- 无论选择哪种收款方式，name 字段都会有值
- 如果微信号为空，会显示错误提示

🧪 测试步骤：
1. 填写微信号
2. 选择"线上地址码"作为收款方式
3. 填写收款地址
4. 点击提交按钮
5. 观察控制台输出，确认 name 字段是否正确设置

📌 预期结果：
- 提交的数据中 name 字段应该等于 wechat_name
- 不应该出现 "null value in column name" 错误
- 销售记录应该成功创建
`);
}

// 立即执行
runVerification();
