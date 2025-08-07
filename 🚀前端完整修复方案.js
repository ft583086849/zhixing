/**
 * 🚀 前端完整修复方案 - 统一支付宝和线上地址收款逻辑
 * 
 * 问题根源分析：
 * 1. 支付宝收款：表单包含必填的 name 字段（收款人姓名）✅
 * 2. 线上地址收款：表单缺少 name 字段，导致数据库插入失败 ❌
 * 
 * 解决方案：
 * 方案A：修改前端表单，为线上地址收款也添加 name 字段
 * 方案B：在提交时自动填充 name 字段（从微信号获取）
 * 方案C：拦截请求，确保 name 字段始终有值
 */

// ========================================
// 方案A：修改表单组件（最佳方案）
// ========================================
function fixSalesPageForm() {
  console.log('='.repeat(60));
  console.log('🔧 方案A：修改销售注册表单');
  console.log('='.repeat(60));
  
  // 查找表单容器
  const formContainers = document.querySelectorAll('form');
  
  formContainers.forEach(form => {
    // 查找支付方式选择器
    const paymentMethodSelect = form.querySelector('[name="payment_method"]');
    
    if (paymentMethodSelect) {
      console.log('✅ 找到支付方式选择器');
      
      // 监听支付方式变化
      const handlePaymentMethodChange = () => {
        const selectedMethod = paymentMethodSelect.value;
        console.log(`当前选择的支付方式: ${selectedMethod}`);
        
        // 查找或创建 name 字段容器
        let nameFieldContainer = form.querySelector('[name="name"]')?.closest('.ant-form-item');
        
        if (selectedMethod === 'crypto') {
          // 线上地址收款 - 确保有 name 字段
          if (!nameFieldContainer) {
            console.log('⚠️ 线上地址收款缺少 name 字段，自动添加...');
            
            // 创建 name 字段（隐藏字段，自动从微信号获取）
            const wechatField = form.querySelector('[name="wechat_name"]');
            if (wechatField) {
              const hiddenName = document.createElement('input');
              hiddenName.type = 'hidden';
              hiddenName.name = 'name';
              hiddenName.value = wechatField.value || '线上客户';
              
              // 监听微信号变化，同步更新 name
              wechatField.addEventListener('change', () => {
                hiddenName.value = wechatField.value || '线上客户';
                console.log(`自动同步 name 字段: ${hiddenName.value}`);
              });
              
              form.appendChild(hiddenName);
              console.log('✅ 已添加隐藏的 name 字段');
            }
          }
        }
      };
      
      // 添加事件监听
      paymentMethodSelect.addEventListener('change', handlePaymentMethodChange);
      
      // 立即执行一次检查
      handlePaymentMethodChange();
    }
  });
}

// ========================================
// 方案B：拦截表单提交（备用方案）
// ========================================
function interceptFormSubmit() {
  console.log('\n' + '='.repeat(60));
  console.log('🔧 方案B：拦截表单提交');
  console.log('='.repeat(60));
  
  // 拦截所有表单提交
  document.addEventListener('submit', function(e) {
    const form = e.target;
    
    if (form && form.tagName === 'FORM') {
      const formData = new FormData(form);
      
      // 检查是否是销售注册表单
      if (formData.has('payment_method') && formData.has('wechat_name')) {
        console.log('🔍 检测到销售注册表单提交');
        
        // 确保 name 字段有值
        if (!formData.get('name') || formData.get('name') === '') {
          const wechatName = formData.get('wechat_name');
          const defaultName = wechatName || '线上客户';
          
          // 创建隐藏字段
          const hiddenInput = document.createElement('input');
          hiddenInput.type = 'hidden';
          hiddenInput.name = 'name';
          hiddenInput.value = defaultName;
          form.appendChild(hiddenInput);
          
          console.log(`✅ 自动填充 name 字段: ${defaultName}`);
        }
      }
    }
  }, true);
  
  console.log('✅ 表单提交拦截器已安装');
}

// ========================================
// 方案C：拦截API请求（最可靠）
// ========================================
function interceptAPIRequests() {
  console.log('\n' + '='.repeat(60));
  console.log('🔧 方案C：拦截API请求');
  console.log('='.repeat(60));
  
  // 保存原始 fetch
  const originalFetch = window.fetch;
  
  // 重写 fetch
  window.fetch = async function(...args) {
    const [url, options = {}] = args;
    
    // 检查是否是创建销售的请求
    if (url && (url.includes('/api/sales') || url.includes('primary_sales'))) {
      if (options.method === 'POST' || options.method === 'PUT') {
        console.log(`🔍 拦截到销售创建请求: ${url}`);
        
        try {
          let bodyData = options.body;
          
          // 解析请求体
          if (typeof bodyData === 'string') {
            bodyData = JSON.parse(bodyData);
          }
          
          // 检查并修复 name 字段
          if (!bodyData.name || bodyData.name === null || bodyData.name === '') {
            console.log('⚠️ 检测到 name 字段为空');
            
            // 智能填充 name 字段
            bodyData.name = bodyData.wechat_name || 
                           bodyData.customer_name || 
                           bodyData.contact_name ||
                           (bodyData.payment_method === 'crypto' ? '线上客户' : '客户');
            
            console.log(`✅ 自动填充 name 字段: ${bodyData.name}`);
          }
          
          // 确保其他必要字段
          if (!bodyData.sales_type && bodyData.payment_method) {
            bodyData.sales_type = bodyData.payment_method === 'crypto' ? 'online' : 'offline';
            console.log(`✅ 自动填充 sales_type: ${bodyData.sales_type}`);
          }
          
          // 更新请求体
          options.body = JSON.stringify(bodyData);
          
          console.log('修复后的请求数据:', bodyData);
          
        } catch (e) {
          console.error('处理请求体失败:', e);
        }
      }
    }
    
    // 调用原始 fetch
    return originalFetch.apply(this, [url, options]);
  };
  
  console.log('✅ API请求拦截器已安装');
}

// ========================================
// 方案D：React组件修复（推荐）
// ========================================
function patchReactComponent() {
  console.log('\n' + '='.repeat(60));
  console.log('🔧 方案D：修复React组件');
  console.log('='.repeat(60));
  
  // 等待React组件加载
  const checkAndPatch = () => {
    // 查找销售页面组件
    const salesPageElement = document.querySelector('[class*="SalesPage"], [class*="sales-page"]');
    
    if (salesPageElement && window.React) {
      console.log('✅ 找到销售页面组件');
      
      // Hook到表单提交处理
      const originalHandleSubmit = window.handleSubmit || window.onSubmit;
      
      if (typeof originalHandleSubmit === 'function') {
        window.handleSubmit = window.onSubmit = async function(values) {
          console.log('🔍 拦截React表单提交');
          
          // 确保 name 字段有值
          if (!values.name || values.name === '') {
            values.name = values.wechat_name || '线上客户';
            console.log(`✅ 自动填充 name: ${values.name}`);
          }
          
          // 调用原始处理函数
          return originalHandleSubmit.call(this, values);
        };
      }
    }
  };
  
  // 延迟执行，等待组件加载
  setTimeout(checkAndPatch, 1000);
  setTimeout(checkAndPatch, 2000);
  setTimeout(checkAndPatch, 3000);
}

// ========================================
// 综合执行所有修复方案
// ========================================
async function applyCompleteFix() {
  console.log('🚀 开始执行完整修复方案...\n');
  console.log('目标：让线上地址收款使用与支付宝相同的逻辑');
  console.log('策略：确保 name 字段始终有值\n');
  
  // 1. 修改表单（最佳）
  setTimeout(() => {
    fixSalesPageForm();
  }, 500);
  
  // 2. 拦截表单提交（备用）
  interceptFormSubmit();
  
  // 3. 拦截API请求（最可靠）
  interceptAPIRequests();
  
  // 4. 修复React组件（推荐）
  patchReactComponent();
  
  // 5. 验证修复
  setTimeout(() => {
    console.log('\n' + '='.repeat(60));
    console.log('✅ 修复部署完成');
    console.log('='.repeat(60));
    console.log('\n现在可以测试：');
    console.log('1. 选择"线上地址码"作为收款方式');
    console.log('2. 填写微信号和收款地址');
    console.log('3. 提交表单，应该不会再报 name 字段错误');
    console.log('\n修复逻辑：');
    console.log('- name 字段会自动从微信号获取');
    console.log('- 如果微信号为空，使用"线上客户"作为默认值');
    console.log('- 与支付宝收款使用相同的数据结构');
  }, 3000);
}

// 立即执行修复
applyCompleteFix();

// 导出给全局使用
window.fixOnlinePayment = applyCompleteFix;
