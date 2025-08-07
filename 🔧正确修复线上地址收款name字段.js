/**
 * 🔧 正确修复线上地址收款 name 字段问题
 * 
 * 数据库字段说明：
 * - wechat_name: 微信号（所有收款方式都需要）
 * - name: 收款人姓名（支付宝需要真实姓名，线上地址码需要一个值）
 * 
 * 问题：
 * - 支付宝收款：有 name 输入框，用户填写收款人姓名 ✅ 正常
 * - 线上地址码：没有 name 输入框，导致 name 为 null ❌ 报错
 * 
 * 解决方案：
 * - 保持支付宝收款逻辑不变
 * - 线上地址码收款时，自动为 name 字段设置默认值
 */

// ========================================
// 方案1：修改 handleSubmit（仅处理线上地址码）
// ========================================
const CORRECT_FIX_SUBMIT = `
// 文件：client/src/pages/SalesPage.js
// 修改 handleSubmit 函数

const handleSubmit = async (values) => {
  try {
    // 处理线上地址码收款时的 name 字段
    const submitData = { ...values };
    
    // 如果是线上地址码且没有 name 字段，使用微信号作为默认值
    if (values.payment_method === 'crypto' && !values.name) {
      submitData.name = values.wechat_name || '线上客户';
    }
    
    await dispatch(createPrimarySales(submitData)).unwrap();
    message.success('销售收款信息创建成功！');
    form.resetFields();
  } catch (error) {
    message.error(error || '创建失败');
  }
};
`;

// ========================================
// 方案2：在线上地址码部分添加隐藏的 name 字段
// ========================================
const ADD_HIDDEN_NAME_FOR_CRYPTO = `
// 文件：client/src/pages/SalesPage.js
// 在线上地址码收款信息部分添加

{/* 线上地址码收款信息 */}
{paymentMethod === 'crypto' && (
  <>
    <Form.Item
      name="payment_address"
      label="线上收款地址"
      rules={[{ required: true, message: '请输入线上收款地址' }]}
    >
      <Input 
        prefix={<WalletOutlined />} 
        placeholder="请输入线上收款地址"
        size="large"
      />
    </Form.Item>
    
    {/* 添加隐藏的 name 字段，使用微信号作为值 */}
    <Form.Item
      name="name"
      hidden
      initialValue=""
    >
      <Input />
    </Form.Item>
  </>
)}

// 同时添加表单值变化监听
<Form
  form={form}
  onValuesChange={(changedValues, allValues) => {
    // 当选择线上地址码时，自动设置 name 为 wechat_name
    if (changedValues.payment_method === 'crypto' || 
        (allValues.payment_method === 'crypto' && changedValues.wechat_name)) {
      form.setFieldsValue({
        name: allValues.wechat_name || '线上客户'
      });
    }
  }}
>
`;

// ========================================
// 方案3：后端API层处理（推荐）
// ========================================
const BACKEND_API_FIX = `
// 后端API处理（server/routes/sales.js 或 Supabase Edge Function）

async function createPrimarySales(data) {
  // 确保 name 字段有值
  const salesData = {
    ...data,
    // 如果是线上地址码且没有 name，使用 wechat_name
    name: data.name || (data.payment_method === 'crypto' ? data.wechat_name : null)
  };
  
  // 验证必填字段
  if (!salesData.name) {
    throw new Error('收款人信息不能为空');
  }
  
  // 插入数据库
  return await supabase
    .from('primary_sales')
    .insert(salesData);
}
`;

// ========================================
// 方案4：数据库触发器（最安全）
// ========================================
const DATABASE_TRIGGER_FIX = `
-- Supabase SQL Editor
-- 创建触发器，自动处理 name 字段

CREATE OR REPLACE FUNCTION handle_primary_sales_name()
RETURNS TRIGGER AS $$
BEGIN
  -- 如果是线上地址码收款且 name 为空
  IF NEW.payment_method = 'crypto' AND (NEW.name IS NULL OR NEW.name = '') THEN
    -- 使用 wechat_name 作为 name
    NEW.name = COALESCE(NEW.wechat_name, '线上客户');
  END IF;
  
  -- 最终检查 name 不能为空
  IF NEW.name IS NULL OR NEW.name = '' THEN
    RAISE EXCEPTION 'name 字段不能为空';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 创建触发器
DROP TRIGGER IF EXISTS ensure_primary_sales_name ON primary_sales;
CREATE TRIGGER ensure_primary_sales_name
BEFORE INSERT OR UPDATE ON primary_sales
FOR EACH ROW
EXECUTE FUNCTION handle_primary_sales_name();
`;

// ========================================
// 立即可用的前端快速修复
// ========================================
console.log('='.repeat(60));
console.log('🔧 立即可用的前端修复方案');
console.log('='.repeat(60));

console.log('\n📋 选择一个方案实施：\n');

console.log('方案1：修改 handleSubmit（最简单）');
console.log(CORRECT_FIX_SUBMIT);

console.log('\n' + '='.repeat(60));
console.log('方案2：添加隐藏 name 字段');
console.log(ADD_HIDDEN_NAME_FOR_CRYPTO);

console.log('\n' + '='.repeat(60));
console.log('方案3：后端API处理');
console.log(BACKEND_API_FIX);

console.log('\n' + '='.repeat(60));
console.log('方案4：数据库触发器');
console.log(DATABASE_TRIGGER_FIX);

console.log('\n' + '='.repeat(60));
console.log('💡 推荐实施顺序：');
console.log('='.repeat(60));
console.log(`
1. 先实施方案1（前端快速修复）
2. 然后实施方案4（数据库保护）
3. 这样即使前端遗漏，数据库也能自动处理

注意：
- 支付宝收款的逻辑完全不变
- 只处理线上地址码收款的 name 字段问题
- 保持 wechat_name 和 name 作为两个独立字段
`);

// ========================================
// 临时浏览器控制台修复
// ========================================
console.log('\n' + '='.repeat(60));
console.log('🚑 紧急修复脚本（浏览器控制台）');
console.log('='.repeat(60));

const EMERGENCY_FIX = `
// 在销售注册页面的浏览器控制台运行
(function() {
  // 拦截表单提交
  const forms = document.querySelectorAll('form');
  forms.forEach(form => {
    form.addEventListener('submit', function(e) {
      const formData = new FormData(form);
      
      // 检查是否是线上地址码
      if (formData.get('payment_method') === 'crypto' && !formData.get('name')) {
        // 创建隐藏输入
        const hiddenInput = document.createElement('input');
        hiddenInput.type = 'hidden';
        hiddenInput.name = 'name';
        hiddenInput.value = formData.get('wechat_name') || '线上客户';
        form.appendChild(hiddenInput);
        
        console.log('✅ 自动添加 name 字段:', hiddenInput.value);
      }
    }, true);
  });
  
  console.log('✅ 紧急修复已应用');
})();
`;

console.log(EMERGENCY_FIX);
