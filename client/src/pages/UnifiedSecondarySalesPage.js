import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
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

const { Title, Text } = Typography;
const { Option } = Select;

const UnifiedSecondarySalesPage = () => {
  const [searchParams] = useSearchParams();
  const [form] = Form.useForm();

  // 基础状态 - 完全模仿SalesPage
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [createdLinks, setCreatedLinks] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('crypto'); // 默认使用链上地址

  // 关联注册相关状态
  const [registrationCode, setRegistrationCode] = useState('');
  const [registrationData, setRegistrationData] = useState(null);
  const [isLinkedMode, setIsLinkedMode] = useState(false);
  const [validationStep, setValidationStep] = useState('loading'); // 'loading', 'invalid', 'valid'

  // 设置页面标题 - 改为"销售注册"
  useEffect(() => {
    document.title = '销售注册';
  }, []);

  // 检查是否为关联模式并验证代码
  useEffect(() => {
    const salesCode = searchParams.get('sales_code');
    if (salesCode) {
      setIsLinkedMode(true);
      setRegistrationCode(salesCode);
      validateRegistrationCode(salesCode);
    } else {
      setIsLinkedMode(false);
      setValidationStep('valid'); // 独立模式直接通过验证
    }
  }, [searchParams]);

  const validateRegistrationCode = async (code) => {
    try {
      setLoading(true);
      setValidationStep('loading');
      
      // 使用统一的salesAPI验证注册码
      const { salesAPI } = await import('../services/api');
      const response = await salesAPI.validateSecondaryRegistrationCode(code);
      
      if (response.success) {
        setRegistrationData(response.data);
        setValidationStep('valid');
      } else {
        setError(response.message || '注册码无效或已过期');
        setValidationStep('invalid');
      }
    } catch (error) {
      console.error('验证注册码失败:', error);
      setError('注册码验证失败');
      setValidationStep('invalid');
    } finally {
      setLoading(false);
    }
  };

  // 完全模仿SalesPage的handleSubmit结构
  const handleSubmit = async (values) => {
    try {
      setLoading(true);
      setError(null);
      
      // 使用统一的salesAPI而不是axios直接调用后端
      const { salesAPI } = await import('../services/api');
      
      let response;
      if (isLinkedMode) {
        // 关联模式 - 注册到一级销售下
        response = await salesAPI.registerSecondary({
          ...values,
          registration_code: registrationCode,
          primary_sales_id: registrationData?.primary_sales_id,
          sales_type: 'secondary'  // 恢复sales_type字段
        });
      } else {
        // 独立模式 - 独立注册
        response = await salesAPI.registerSecondary({
          ...values,
          sales_type: 'secondary'  // 恢复sales_type字段
        });
      }

      if (response.success) {
        const salesData = response.data;
        
        // 生成购买链接
        const baseUrl = window.location.origin;
        const user_sales_link = `${baseUrl}/purchase?sales_code=${salesData.sales_code}`;
        
        // 设置生成的链接（只包含用户购买链接）
        setCreatedLinks({
          user_sales_link: user_sales_link,
          user_sales_code: salesData.sales_code,
        });
        message.success('销售收款信息创建成功！');
        form.resetFields();
      } else {
        setError(response.message || '创建失败');
      }
    } catch (error) {
      console.error('创建失败:', error);
      setError(error.response?.data?.message || '创建失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  // 完全模仿SalesPage的复制函数
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

  // 用户购买代码复制功能

  // 完全模仿SalesPage的clearLink函数
  const clearLink = () => {
    setCreatedLinks(null);
    setError(null);
  };

  // 关联模式验证失败时的显示
  if (isLinkedMode && validationStep === 'invalid') {
    return (
      <div className="page-container">
        <div className="content-container">
          <Card className="card-container" role="region">
            <Title level={2} style={{ textAlign: 'center', marginBottom: 32 }}>
              销售注册
            </Title>
            
            <Alert
              message="注册码无效"
              description="您提供的注册码无效或已过期，请联系一级销售获取新的注册码。"
              type="error"
              showIcon
              style={{ textAlign: 'center' }}
            />
          </Card>
        </div>
      </div>
    );
  }

  // 关联模式验证中时的显示
  if (isLinkedMode && validationStep === 'loading') {
    return (
      <div className="page-container">
        <div className="content-container">
          <Card className="card-container" role="region">
            <Title level={2} style={{ textAlign: 'center', marginBottom: 32 }}>
              销售注册
            </Title>
            
            <div style={{ textAlign: 'center', padding: '50px 0' }}>
              <div>正在验证注册码...</div>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  // 主页面 - 完全模仿SalesPage的结构
  return (
    <div className="page-container">
      <div className="content-container">
        <Card className="card-container" role="region">
          <Title level={2} style={{ textAlign: 'center', marginBottom: 32 }}>
            销售注册
          </Title>



          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            className="form-container"
           >
            {/* 微信号 - 完全相同 */}
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

            {/* 收款方式 - 完全相同 */}
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
                defaultValue="crypto"
              >
                <Option value="crypto">链上地址</Option>
              </Select>
            </Form.Item>

            {/* 支付宝收款信息已移除 */}

            {/* 链上地址收款信息 - 完全相同 */}
            {(paymentMethod === 'crypto' || !paymentMethod) && (
              <>
                <Form.Item
                  name="name"
                  label="收款人姓名"
                  rules={[{ required: true, message: '请输入收款人姓名' }]}
                 >
                  <Input 
                    placeholder="请输入收款人姓名"
                    size="large"
                  />
                </Form.Item>
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

            {/* 提交按钮 - 完全相同 */}
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

          {/* 错误提示 - 完全相同 */}
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
                {/* 用户购买链接 - 完全相同 */}
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

export default UnifiedSecondarySalesPage;