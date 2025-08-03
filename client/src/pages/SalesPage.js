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
import { createPrimarySales, clearCreatedLink } from '../store/slices/salesSlice';

const { Title, Text } = Typography;
const { Option } = Select;

const SalesPage = () => {
  const dispatch = useDispatch();
  const { loading, error, createdLink } = useSelector((state) => state.sales);
  const [form] = Form.useForm();

  const [paymentMethod, setPaymentMethod] = useState('');

  // 设置页面标题
  useEffect(() => {
    document.title = '高阶销售注册';
  }, []);

  const handleSubmit = async (values) => {
    try {
      await dispatch(createPrimarySales(values)).unwrap();
      message.success('销售收款信息创建成功！');
      form.resetFields();
    } catch (error) {
      message.error(error || '创建失败');
    }
  };

  const handleCopyUserLink = async () => {
    if (createdLink?.user_sales_link) {
      try {
        await navigator.clipboard.writeText(createdLink.user_sales_link);
        message.success('用户购买链接已复制到剪贴板');
      } catch (err) {
        message.error('复制失败');
      }
    }
  };

  const handleCopySecondaryLink = async () => {
    if (createdLink?.secondary_registration_link) {
      try {
        await navigator.clipboard.writeText(createdLink.secondary_registration_link);
        message.success('二级销售注册链接已复制到剪贴板');
      } catch (err) {
        message.error('复制失败');
      }
    }
  };

  const handleCopyUserCode = async () => {
    if (createdLink?.user_sales_code) {
      try {
        await navigator.clipboard.writeText(createdLink.user_sales_code);
        message.success('用户购买代码已复制到剪贴板');
      } catch (err) {
        message.error('复制失败');
      }
    }
  };

  const handleCopySecondaryCode = async () => {
    if (createdLink?.secondary_registration_code) {
      try {
        await navigator.clipboard.writeText(createdLink.secondary_registration_code);
        message.success('二级销售注册代码已复制到剪贴板');
      } catch (err) {
        message.error('复制失败');
      }
    }
  };

  const clearLink = () => {
    dispatch(clearCreatedLink());
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

            {/* 收款方式 */}
            <Form.Item
              name="payment_method"
              label="收款方式"
              rules={[{ required: true, message: '请选择收款方式' }]}
             >
              <Select
                placeholder="请选择收款方式"
                size="large"
                onChange={(value) => setPaymentMethod(value)}
                aria-label="请选择收款方式"
              >
                <Option value="alipay">支付宝</Option>
                <Option value="crypto">线上地址码</Option>
              </Select>
            </Form.Item>

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
                <Form.Item
                  name="alipay_surname"
                  label="收款人姓氏"
                  rules={[{ required: true, message: '请输入收款人姓氏' }]}
                 >
                  <Input 
                    placeholder="请输入收款人姓氏"
                    size="large"
                    aria-label="请输入收款人姓氏"
                  />
                </Form.Item>
              </>
            )}

            {/* 线上地址码收款信息 */}
            {paymentMethod === 'crypto' && (
              <>
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
              </>
            )}

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
          {createdLink && (
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
                        {createdLink.user_sales_link}
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
                        {createdLink.user_sales_code}
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
                        {createdLink.secondary_registration_link}
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
                        {createdLink.secondary_registration_code}
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