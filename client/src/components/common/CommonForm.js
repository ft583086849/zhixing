
import React from 'react';
import { Form, Input, Select, DatePicker, Button, Space } from 'antd';

const { Option } = Select;

const CommonForm = ({
  form,
  layout = 'horizontal',
  labelCol = { span: 6 },
  wrapperCol = { span: 18 },
  onFinish,
  onReset,
  submitText = '提交',
  resetText = '重置',
  children,
  ...props
}) => {
  const handleReset = () => {
    form.resetFields();
    if (onReset) onReset();
  };

  return (
    <Form
      form={form}
      layout={layout}
      labelCol={labelCol}
      wrapperCol={wrapperCol}
      onFinish={onFinish}
      {...props}
    >
      {children}
      
      <Form.Item wrapperCol={{ offset: labelCol.span, span: wrapperCol.span }}>
        <Space>
          <Button type="primary" htmlType="submit">
            {submitText}
          </Button>
          <Button onClick={handleReset}>
            {resetText}
          </Button>
        </Space>
      </Form.Item>
    </Form>
  );
};

// 通用表单项组件
const FormItem = ({ name, label, rules = [], children, ...props }) => (
  <Form.Item name={name} label={label} rules={rules} {...props}>
    {children}
  </Form.Item>
);

// 通用输入框组件
const FormInput = ({ placeholder, prefix, ...props }) => (
  <Input placeholder={placeholder} prefix={prefix} {...props} />
);

// 通用选择框组件
const FormSelect = ({ options = [], placeholder, ...props }) => (
  <Select placeholder={placeholder} {...props}>
    {options.map(option => (
      <Option key={option.value} value={option.value}>
        {option.label}
      </Option>
    ))}
  </Select>
);

// 通用日期选择器组件
const FormDatePicker = ({ placeholder, ...props }) => (
  <DatePicker placeholder={placeholder} {...props} />
);

export { CommonForm, FormItem, FormInput, FormSelect, FormDatePicker };
export default CommonForm;
