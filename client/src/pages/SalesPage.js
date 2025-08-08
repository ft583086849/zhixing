import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { 
  Card, 
  Form, 
  Input, 
  Select, 
  Button, 
  message, 
  Typography, 
  Divider,
  Alert,
  Space
} from 'antd';
import { 
  UserOutlined, 
  WalletOutlined, 
  LinkOutlined,
  CopyOutlined 
} from '@ant-design/icons';
import { createPrimarySales, clearCreatedLinks } from '../store/slices/salesSlice';

const { Title, Text } = Typography;
const { Option } = Select;

const SalesPage = () => {
  const dispatch = useDispatch();
  const { loading, error, createdLinks } = useSelector((state) => state.sales);
  const [form] = Form.useForm();

  // 移除paymentMethod状态，直接使用链上地址

  // 设置页面标题
  useEffect(() => {
    document.title = '高阶销售注册';
  }, []);

  const handleSubmit = async (values) => {
    try {
      // 自动添加payment_method为crypto
      const submitValues = {
        ...values,
        payment_method: 'crypto'
      };
      await dispatch(createPrimarySales(submitValues)).unwrap();
      message.success('销售收款信息创建成功！');
      // 保留表单信息，不清空，方便用户查看
      // form.resetFields();  // 注释掉，保留用户输入的信息
    } catch (error) {
      message.error(error || '创建失败');
    }
  };

  const handleCopyUserLink = async () => {
    if (createdLinks?.user_sales_link) {
      try {
        await navigator.clipboard.writeText(createdLinks.user_sales_link);
        message.success('用户购买链接已复制到剪贴板');
      } catch (err) {
        message.error('复制失败');
      }
    }
  };

  const handleCopySecondaryLink = async () => {
    if (createdLinks?.secondary_registration_link) {
      try {
        await navigator.clipboard.writeText(createdLinks.secondary_registration_link);
        message.success('二级销售注册链接已复制到剪贴板');
      } catch (err) {
        message.error('复制失败');
      }
    }
  };

  const handleCopyUserCode = async () => {
    if (createdLinks?.user_sales_code) {
      try {
        await navigator.clipboard.writeText(createdLinks.user_sales_code);
        message.success('用户购买代码已复制到剪贴板');
      } catch (err) {
        message.error('复制失败');
      }
    }
  };

  const handleCopySecondaryCode = async () => {
    if (createdLinks?.secondary_registration_code) {
      try {
        await navigator.clipboard.writeText(createdLinks.secondary_registration_code);
        message.success('二级销售注册代码已复制到剪贴板');
      } catch (err) {
        message.error('复制失败');
      }
    }
  };

  const clearLink = () => {
    dispatch(clearCreatedLinks());
  };

  return (
    <div className="page-container">
      <div className="content-container">
        <Card className="card-container" role="region">
          <Title level={2} style={{ textAlign: 'center', marginBottom: 32 }}>
            高阶销售注册
          </Title>

          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            className="form-container"
           >
            {/* 微信号 */}
            <Form.Item
              name="wechat_name"
              label="微信号"
              rules={[{ required: true, message: '请输入微信号' }]}
             >
              <Input 
                prefix={<UserOutlined />} 
                placeholder="请输入微信号"
                size="large"
              />
            </Form.Item>

            {/* 收款方式 - 已隐藏，默认使用链上地址 */}

            {/* 链上地址收款信息 */}
            <Form.Item
              name="chain_name"
              label="链名"
              rules={[{ required: true, message: '请输入链名' }]}
             >
              <Input 
                placeholder="例如：TRC10/TRC20"
                size="large"
                aria-label="例如：TRC10/TRC20"
              />
            </Form.Item>
            <Form.Item
              name="payment_address"
              label="收款地址"
              rules={[{ required: true, message: '请输入收款地址' }]}
             >
              <Input.TextArea 
                placeholder="请输入收款地址"
                rows={3}
                size="large"
                aria-label="请输入收款地址"
              />
            </Form.Item>

            {/* 提交按钮 */}
            <Form.Item >
              <Button 
                type="primary" 
                htmlType="submit" 
                loading={loading}
                size="large"
                block
               tabIndex={0}>
                生成收款链接
              </Button>
            </Form.Item>
          </Form>

          {/* 错误提示 */}
          {error && (
            <Alert
              message="错误"
              description={error}
              type="error"
              showIcon
              style={{ marginTop: 16 }}
            />
          )}

          {/* 生成的链接 */}
          {createdLinks && (
            <div style={{ marginTop: 32 }}>
              <Divider>生成的收款链接</Divider>
              
              <Space direction="vertical" style={{ width: '100%' }} size="large">
                {/* 用户购买链接 */}
                <Card 
                  title="💰 用户购买链接" 
                  style={{ backgroundColor: '#f6ffed', borderColor: '#b7eb8f' }} 
                  role="region"
                >
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <div>
                      <Text strong>用户购买链接：</Text>
                      <div style={{ 
                        wordBreak: 'break-all', 
                        backgroundColor: 'white',
                        padding: '8px',
                        borderRadius: '4px',
                        marginTop: '4px',
                        border: '1px solid #d9d9d9'
                      }}>
                        {createdLinks.user_sales_link}
                      </div>
                      <Button 
                        type="link" 
                        icon={<CopyOutlined />}
                        onClick={handleCopyUserLink}
                        style={{ padding: 0, marginTop: '4px' }}
                        tabIndex={0}
                      >
                        复制用户购买链接
                      </Button>
                    </div>

                    <div>
                      <Text strong>用户购买代码：</Text>
                      <div style={{ 
                        wordBreak: 'break-all', 
                        backgroundColor: 'white',
                        padding: '8px',
                        borderRadius: '4px',
                        marginTop: '4px',
                        border: '1px solid #d9d9d9'
                      }}>
                        {createdLinks.user_sales_code}
                      </div>
                      <Button 
                        type="link" 
                        icon={<CopyOutlined />}
                        onClick={handleCopyUserCode}
                        style={{ padding: 0, marginTop: '4px' }}
                        tabIndex={0}
                      >
                        复制用户购买代码
                      </Button>
                    </div>
                  </Space>
                </Card>

                {/* 二级销售注册链接 */}
                <Card 
                  title="👥 二级销售注册链接" 
                  style={{ backgroundColor: '#fff7e6', borderColor: '#ffd591' }} 
                  role="region"
                >
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <div>
                      <Text strong>二级销售注册链接：</Text>
                      <div style={{ 
                        wordBreak: 'break-all', 
                        backgroundColor: 'white',
                        padding: '8px',
                        borderRadius: '4px',
                        marginTop: '4px',
                        border: '1px solid #d9d9d9'
                      }}>
                        {createdLinks.secondary_registration_link}
                      </div>
                      <Button 
                        type="link" 
                        icon={<CopyOutlined />}
                        onClick={handleCopySecondaryLink}
                        style={{ padding: 0, marginTop: '4px' }}
                        tabIndex={0}
                      >
                        复制二级销售注册链接
                      </Button>
                    </div>

                    <div>
                      <Text strong>二级销售注册代码：</Text>
                      <div style={{ 
                        wordBreak: 'break-all', 
                        backgroundColor: 'white',
                        padding: '8px',
                        borderRadius: '4px',
                        marginTop: '4px',
                        border: '1px solid #d9d9d9'
                      }}>
                        {createdLinks.secondary_registration_code}
                      </div>
                      <Button 
                        type="link" 
                        icon={<CopyOutlined />}
                        onClick={handleCopySecondaryCode}
                        style={{ padding: 0, marginTop: '4px' }}
                        tabIndex={0}
                      >
                        复制二级销售注册代码
                      </Button>
                    </div>
                  </Space>
                </Card>

                <Button 
                  type="default" 
                  onClick={clearLink}
                  style={{ marginTop: '8px' }}
                 tabIndex={0}>
                  生成新链接
                </Button>
              </Space>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default SalesPage; 