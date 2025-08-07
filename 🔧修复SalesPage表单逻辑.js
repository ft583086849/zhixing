/**
 * 🔧 修复 SalesPage.js 表单逻辑
 * 
 * 业务需求：
 * 1. 微信号（wechat_name）是必填项 - 已经存在
 * 2. name字段（实际存储微信号）对所有收款方式都是必填的
 * 3. 不管选择支付宝还是线上地址码，都需要填写微信号作为name
 * 
 * 问题根源：
 * - 当前代码中，只有选择支付宝时才显示name字段
 * - 选择线上地址码时，没有name字段，导致数据库插入失败
 * 
 * 解决方案：
 * - 修改表单逻辑，确保所有收款方式都传递name字段
 * - name字段的值应该取自wechat_name（微信号）
 */

// ========================================
// 步骤1：查找并修复 SalesPage.js
// ========================================
console.log('🔧 开始修复 SalesPage.js 表单逻辑...\n');

// 需要修改的文件路径
const FILE_PATH = 'client/src/pages/SalesPage.js';

// 修改方案1：修改表单提交逻辑
const FIX_SUBMIT_LOGIC = `
  const handleSubmit = async (values) => {
    try {
      // 确保 name 字段始终有值（使用微信号）
      const submitData = {
        ...values,
        name: values.wechat_name // 将微信号作为name字段
      };
      
      // 验证微信号是否填写
      if (!submitData.wechat_name) {
        message.error('您需要填写微信号，不管支付宝还是线上地址码');
        return;
      }
      
      await dispatch(createPrimarySales(submitData)).unwrap();
      message.success('销售收款信息创建成功！');
      form.resetFields();
    } catch (error) {
      message.error(error || '创建失败');
    }
  };
`;

// 修改方案2：修改支付宝收款部分（移除单独的name字段）
const FIX_ALIPAY_SECTION = `
  {/* 支付宝收款信息 */}
  {paymentMethod === 'alipay' && (
    <>
      <Form.Item
        name="payment_address"
        label="支付宝账号"
        rules={[{ required: true, message: '请输入支付宝账号' }]}
      >
        <Input 
          prefix={<WalletOutlined />} 
          placeholder="请输入支付宝账号"
          size="large"
        />
      </Form.Item>
      {/* 移除原有的name字段，因为会使用wechat_name */}
    </>
  )}
`;

// 修改方案3：添加隐藏的name字段（适用于所有收款方式）
const ADD_HIDDEN_NAME_FIELD = `
  {/* 隐藏的name字段，自动从wechat_name获取值 */}
  <Form.Item
    name="name"
    hidden
    dependencies={['wechat_name']}
  >
    <Input />
  </Form.Item>
`;

// ========================================
// 步骤2：创建自动修复脚本
// ========================================
console.log('📝 生成修复指令...\n');

console.log('需要修改的内容：');
console.log('1. 修改 handleSubmit 函数，确保 name 字段始终等于 wechat_name');
console.log('2. 移除支付宝部分的单独 name 字段输入框');
console.log('3. 或者添加一个隐藏的 name 字段，自动同步 wechat_name 的值\n');

console.log('=' .repeat(60));
console.log('📋 具体修改步骤：');
console.log('=' .repeat(60));

console.log(`
1. 打开文件: ${FILE_PATH}

2. 找到 handleSubmit 函数（约第38-46行），修改为：
${FIX_SUBMIT_LOGIC}

3. 找到支付宝收款信息部分（约第141-166行），修改为：
${FIX_ALIPAY_SECTION}

4. 或者在表单中添加隐藏字段（在微信号字段后面）：
${ADD_HIDDEN_NAME_FIELD}
`);

// ========================================
// 步骤3：创建前端验证脚本
// ========================================
console.log('\n' + '=' .repeat(60));
console.log('🔍 前端验证脚本');
console.log('=' .repeat(60));

const VALIDATION_SCRIPT = `
// 在浏览器控制台运行此脚本，验证修复效果
(function validateFix() {
  console.log('验证表单逻辑...');
  
  // 查找表单
  const forms = document.querySelectorAll('form');
  forms.forEach((form, idx) => {
    console.log(\`\\n表单 \${idx + 1}:\`);
    
    // 查找微信号字段
    const wechatInput = form.querySelector('[name="wechat_name"]');
    if (wechatInput) {
      console.log('✅ 找到微信号字段（必填）');
      
      // 监听微信号变化
      wechatInput.addEventListener('change', (e) => {
        // 同步到隐藏的name字段
        const nameInput = form.querySelector('[name="name"]');
        if (nameInput) {
          nameInput.value = e.target.value;
          console.log(\`✅ 同步name字段: \${e.target.value}\`);
        } else {
          // 如果没有name字段，创建一个
          const hiddenName = document.createElement('input');
          hiddenName.type = 'hidden';
          hiddenName.name = 'name';
          hiddenName.value = e.target.value;
          form.appendChild(hiddenName);
          console.log('✅ 创建隐藏name字段');
        }
      });
    }
    
    // 查找name字段
    const nameInput = form.querySelector('[name="name"]');
    if (nameInput) {
      console.log(\`  name字段类型: \${nameInput.type}\`);
    } else {
      console.log('  ⚠️ 缺少name字段');
    }
  });
  
  // 拦截表单提交
  document.addEventListener('submit', (e) => {
    const form = e.target;
    const formData = new FormData(form);
    
    // 检查是否有wechat_name
    const wechatName = formData.get('wechat_name');
    if (!wechatName) {
      e.preventDefault();
      alert('您需要填写微信号，不管支付宝还是线上地址码');
      return false;
    }
    
    // 确保name字段有值
    if (!formData.get('name')) {
      formData.set('name', wechatName);
      console.log(\`✅ 自动设置name为: \${wechatName}\`);
    }
  }, true);
  
  console.log('\\n✅ 验证脚本已安装');
})();
`;

console.log('\n将以下脚本复制到浏览器控制台运行：');
console.log(VALIDATION_SCRIPT);

// ========================================
// 步骤4：后端兼容处理
// ========================================
console.log('\n' + '=' .repeat(60));
console.log('🔧 后端兼容处理（API层）');
console.log('=' .repeat(60));

const BACKEND_FIX = `
// 在后端API处理中添加兼容逻辑
// 文件位置：server/routes/sales.js 或类似位置

router.post('/sales', async (req, res) => {
  try {
    const { wechat_name, name, ...otherData } = req.body;
    
    // 确保name字段有值（优先使用name，其次使用wechat_name）
    const salesData = {
      ...otherData,
      wechat_name,
      name: name || wechat_name // 如果name为空，使用wechat_name
    };
    
    // 验证必填字段
    if (!salesData.wechat_name) {
      return res.status(400).json({
        error: '您需要填写微信号，不管支付宝还是线上地址码'
      });
    }
    
    // 插入数据库
    const result = await db.insert('primary_sales', salesData);
    res.json({ success: true, data: result });
    
  } catch (error) {
    console.error('创建销售记录失败:', error);
    res.status(500).json({ error: error.message });
  }
});
`;

console.log('后端处理逻辑示例：');
console.log(BACKEND_FIX);

// ========================================
// 步骤5：数据库层面的保护
// ========================================
console.log('\n' + '=' .repeat(60));
console.log('💾 数据库层面的保护（Supabase）');
console.log('=' .repeat(60));

const DATABASE_TRIGGER = `
-- 创建触发器，确保name字段始终有值
CREATE OR REPLACE FUNCTION ensure_sales_name()
RETURNS TRIGGER AS $$
BEGIN
  -- 如果name为空但wechat_name有值，使用wechat_name
  IF (NEW.name IS NULL OR NEW.name = '') AND NEW.wechat_name IS NOT NULL THEN
    NEW.name = NEW.wechat_name;
  END IF;
  
  -- 如果还是为空，抛出错误
  IF NEW.name IS NULL OR NEW.name = '' THEN
    RAISE EXCEPTION '您需要填写微信号，不管支付宝还是线上地址码';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 应用触发器
DROP TRIGGER IF EXISTS ensure_sales_name_trigger ON primary_sales;
CREATE TRIGGER ensure_sales_name_trigger
BEFORE INSERT OR UPDATE ON primary_sales
FOR EACH ROW
EXECUTE FUNCTION ensure_sales_name();
`;

console.log('数据库触发器（可选）：');
console.log(DATABASE_TRIGGER);

// ========================================
// 总结
// ========================================
console.log('\n' + '=' .repeat(60));
console.log('📝 修复方案总结');
console.log('=' .repeat(60));

console.log(`
✅ 核心逻辑：
1. 微信号（wechat_name）是必填项 ✓
2. name字段自动取值自wechat_name ✓
3. 不管选择什么收款方式，都需要微信号 ✓

🔧 修复位置：
1. 前端：修改 SalesPage.js 的表单提交逻辑
2. 后端：在API层添加兼容处理
3. 数据库：添加触发器作为最后防线

💡 最简单的修复方式：
在 handleSubmit 函数中添加一行：
values.name = values.wechat_name;

这样无论选择哪种收款方式，name字段都会有值。
`);

console.log('\n执行完成！');
