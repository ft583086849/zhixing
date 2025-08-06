
# 知行财库组件文档

## 通用组件

### CommonButton
通用按钮组件，提供统一的按钮样式和行为。

#### Props
- `type`: 按钮类型 ('primary' | 'default' | 'dashed' | 'link' | 'text')
- `size`: 按钮大小 ('large' | 'middle' | 'small')
- `loading`: 是否显示加载状态
- `disabled`: 是否禁用
- `icon`: 按钮图标
- `onClick`: 点击事件处理函数

#### 使用示例
```jsx
import CommonButton from '@/components/common/CommonButton';

<CommonButton 
  type="primary" 
  loading={loading}
  onClick={handleClick}
>
  提交
</CommonButton>
```

### CommonTable
通用表格组件，提供统一的表格样式和功能。

#### Props
- `columns`: 表格列配置
- `dataSource`: 表格数据源
- `loading`: 是否显示加载状态
- `pagination`: 分页配置
- `scroll`: 滚动配置
- `size`: 表格大小
- `bordered`: 是否显示边框

#### 使用示例
```jsx
import CommonTable from '@/components/common/CommonTable';

<CommonTable
  columns={columns}
  dataSource={data}
  loading={loading}
  pagination={{ pageSize: 10 }}
/>
```

### CommonForm
通用表单组件，提供统一的表单样式和验证。

#### Props
- `form`: 表单实例
- `layout`: 表单布局
- `labelCol`: 标签列配置
- `wrapperCol`: 包装列配置
- `onFinish`: 提交成功回调
- `onReset`: 重置回调

#### 使用示例
```jsx
import { CommonForm, FormItem, FormInput } from '@/components/common/CommonForm';

<CommonForm form={form} onFinish={handleSubmit}>
  <FormItem name="username" label="用户名" rules={[{ required: true }]}>
    <FormInput placeholder="请输入用户名" />
  </FormItem>
</CommonForm>
```

## 工具函数

### formatDate(date, format)
格式化日期字符串。

### formatCurrency(amount, currency)
格式化货币显示。

### validateEmail(email)
验证邮箱格式。

### validatePhone(phone)
验证手机号格式。

### storage
本地存储工具对象。

## 常量

### API_STATUS
API状态码常量。

### ORDER_STATUS
订单状态常量。

### PAYMENT_METHODS
支付方式常量。

### DURATION_OPTIONS
购买时长常量。

### ROUTES
页面路由常量。
