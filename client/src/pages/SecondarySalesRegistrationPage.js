import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, useParams } from 'react-router-dom';
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
import axios from 'axios';

const { Title, Text } = Typography;
const { Option } = Select;

const SecondarySalesRegistrationPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { sales_code } = useParams();
  const [form] = Form.useForm();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [registrationCode, setRegistrationCode] = useState('');
  const [registrationData, setRegistrationData] = useState(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [createdLinks, setCreatedLinks] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('');

  // 设置页面标题
  useEffect(() => {
    document.title = '二级销售注册';
  }, []);

  // 获取注册码
  useEffect(() => {
    const linkCode = searchParams.get('sales_code') || sales_code;
    if (linkCode) {
      setRegistrationCode(linkCode);
      validateRegistrationCode(linkCode);
    }
  }, [searchParams, sales_code]);

  const validateRegistrationCode = async (code) => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/secondary-sales?path=validate&link_code=${code}&link_type=secondary_registration`);
      
      if (response.data.success) {
        setRegistrationData(response.data.data);
        setCurrentStep(1);
      } else {
        setError('注册码无效或已过期');
        setCurrentStep(0);
      }
    } catch (error) {
      console.error('验证注册码失败:', error);
      setError('注册码验证失败');
      setCurrentStep(0);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (values) => {
    try {
      setLoading(true);
      
      const response = await axios.post('/api/secondary-sales?path=register', {
        ...values,
        registration_code: registrationCode,
        primary_sales_id: registrationData?.primary_sales_id
      });

      if (response.data.success) {
        const salesData = response.data.data;
        // 按照SalesPage.js的格式设置createdLinks
        setCreatedLinks({
          user_sales_link: salesData.user_sales_link,
          user_sales_code: salesData.sales_code,
          secondary_registration_link: null, // 二级销售不能再创建下级
          secondary_registration_code: null
        });
        setRegistrationSuccess(true);
        setCurrentStep(2);
        message.success('二级销售注册成功！');
      } else {
        setError(response.data.message || '注册失败');
      }
    } catch (error) {
      console.error('注册失败:', error);
      setError(error.response?.data?.message || '注册失败，请稍后重试');
    } finally {
      setLoading(false);
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

  const clearLink = () => {
    setCreatedLinks(null);
    setRegistrationSuccess(false);
    setCurrentStep(1);
    form.resetFields();
  };

  // 验证注册码步骤
  if (currentStep === 0) {
    return (
      <div className="page-container">
        <div className="content-container">
          <Card className="card-container" role="region">
            <Title level={2} style={{ textAlign: 'center', marginBottom: 32 }}>
              二级销售注册
            </Title>
            
            {loading ? (
              <div style={{ textAlign: 'center', padding: '50px 0' }}>
                <div>正在验证注册码...</div>
              </div>
            ) : (
              <Alert
                message="注册码无效"
                description="您提供的注册码无效或已过期，请联系一级销售获取新的注册码。"
                type="error"
                showIcon
                style={{ textAlign: 'center' }}
              />
            )}
          </Card>
        </div>
      </div>
    );
  }

  // 注册表单步骤 - 完全按照SalesPage.js的样式
  return (
    <div className="page-container">
      <div className="content-container">
        <Card className="card-container" role="region">
          <Title level={2} style={{ textAlign: 'center', marginBottom: 32 }}>
            二级销售注册
          </Title>

          {!registrationSuccess && (
            <>
              <Alert
                message="注册码验证成功"
                description={`欢迎加入一级销售 ${registrationData?.primary_sales_wechat} 的销售团队！`}
                type="success"
                showIcon
                style={{ marginBottom: 24 }}
              />

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
                <Form.Item>
                  <Button 
                    type="primary" 
                    htmlType="submit" 
                    loading={loading}
                    size="large"
                    block
                    tabIndex={0}
                  >
                    完成注册
                  </Button>
                </Form.Item>
              </Form>
            </>
          )}

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

          {/* 生成的链接 - 完全按照SalesPage.js的样式 */}
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

                <Button 
                  type="default" 
                  onClick={clearLink}
                  style={{ marginTop: '8px' }}
                  tabIndex={0}
                >
                  重新注册
                </Button>
              </Space>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default SecondarySalesRegistrationPage;