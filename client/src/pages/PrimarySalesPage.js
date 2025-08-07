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
  Space,
  Row,
  Col,
  Tag
} from 'antd';
import { 
  UserOutlined, 
  WalletOutlined, 
  LinkOutlined,
  CopyOutlined,
  TeamOutlined,
  ShoppingOutlined
} from '@ant-design/icons';
import { createPrimarySales, clearCreatedLinks } from '../store/slices/salesSlice';

const { Title, Text } = Typography;
const { Option } = Select;

const PrimarySalesPage = () => {
  const dispatch = useDispatch();
  const { loading, error, createdLinks } = useSelector((state) => state.sales);
  const [form] = Form.useForm();

  const [paymentMethod, setPaymentMethod] = useState('');

  // 设置页面标题
  useEffect(() => {
    document.title = '一级销售页面';
  }, []);

  const handleSubmit = async (values) => {
    try {
      await dispatch(createPrimarySales(values)).unwrap();
      message.success('一级销售信息创建成功！');
      form.resetFields();
    } catch (error) {
      message.error(error || '创建失败');
    }
  };

  const handleCopyLink = async (linkType) => {
    const linkKey = linkType === 'secondary' ? 'secondary_registration_link' : 'user_sales_link';
    const link = createdLinks?.[linkKey];
    if (link) {
      try {
        await navigator.clipboard.writeText(link);
        message.success(`${linkType === 'secondary' ? '二级销售注册链接' : '用户销售链接'}已复制到剪贴板`);
      } catch (err) {
        message.error('复制失败');
      }
    }
  };

  const handleCopyCode = async (linkType) => {
    const codeKey = linkType === 'secondary' ? 'secondary_registration_code' : 'user_sales_code';
    const code = createdLinks?.[codeKey];
    if (code) {
      try {
        await navigator.clipboard.writeText(code);
        message.success(`${linkType === 'secondary' ? '二级销售注册代码' : '用户销售代码'}已复制到剪贴板`);
      } catch (err) {
        message.error('复制失败');
      }
    }
  };

  const clearLinks = () => {
    dispatch(clearCreatedLinks());
  };

  return (
    <div className="page-container">
      <div className="content-container">
        <Card className="card-container" role="region">
          <Title level={2} style={{ textAlign: 'center', marginBottom: 32 }}>
            一级销售注册页面
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
                <Option value="crypto">链上地址</Option>
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
                  label="收款人姓名"
                  rules={[{ required: true, message: '请输入收款人姓名' }]}
                 >
                  <Input 
                    placeholder="请输入收款人姓名"
                    size="large"
                    aria-label="请输入收款人姓名"
                  />
                </Form.Item>
              </>
            )}

            {/* 链上地址收款信息 */}
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
                  label="链上地址"
                  rules={[{ required: true, message: '请输入链上地址' }]}
                 >
                  <Input.TextArea 
                    placeholder="请输入链上地址"
                    rows={3}
                    size="large"
                    aria-label="请输入链上地址"
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
                生成销售链接
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
              <Divider>生成的销售链接</Divider>
              
              <Row gutter={[16, 16]}>
                {/* 二级销售下挂链接 */}
                <Col xs={24} lg={12}>
                  <Card 
                    style={{ backgroundColor: '#f6ffed', borderColor: '#b7eb8f' }} 
                    role="region"
                    title={
                      <Space>
                        <TeamOutlined />
                        <span>二级销售下挂链接</span>
                        <Tag color="green">用于二级销售注册</Tag>
                      </Space>
                    }
                  >
                    <Space direction="vertical" style={{ width: '100%' }}>
                      <div>
                        <Text strong>完整链接：</Text>
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
                          onClick={() => handleCopyLink('secondary')}
                          style={{ padding: 0, marginTop: '4px' }}
                          tabIndex={0}
                        >
                          复制链接
                        </Button>
                      </div>

                      <div>
                        <Text strong>链接代码：</Text>
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
                          onClick={() => handleCopyCode('secondary')}
                          style={{ padding: 0, marginTop: '4px' }}
                          tabIndex={0}
                        >
                          复制代码
                        </Button>
                      </div>
                    </Space>
                  </Card>
                </Col>

                {/* 面向用户的销售链接 */}
                <Col xs={24} lg={12}>
                  <Card 
                    style={{ backgroundColor: '#e6f7ff', borderColor: '#91d5ff' }} 
                    role="region"
                    title={
                      <Space>
                        <ShoppingOutlined />
                        <span>面向用户的销售链接</span>
                        <Tag color="blue">用于直接销售</Tag>
                      </Space>
                    }
                  >
                    <Space direction="vertical" style={{ width: '100%' }}>
                      <div>
                        <Text strong>完整链接：</Text>
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
                          onClick={() => handleCopyLink('user')}
                          style={{ padding: 0, marginTop: '4px' }}
                          tabIndex={0}
                        >
                          复制链接
                        </Button>
                      </div>

                      <div>
                        <Text strong>链接代码：</Text>
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
                          onClick={() => handleCopyCode('user')}
                          style={{ padding: 0, marginTop: '4px' }}
                          tabIndex={0}
                        >
                          复制代码
                        </Button>
                      </div>
                    </Space>
                  </Card>
                </Col>
              </Row>

              <Button 
                type="default" 
                onClick={clearLinks}
                style={{ marginTop: '16px' }}
               tabIndex={0}>
                生成新链接
              </Button>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default PrimarySalesPage; 