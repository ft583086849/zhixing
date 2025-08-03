import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
  Steps,
  Result
} from 'antd';
import { 
  UserOutlined, 
  WalletOutlined, 
  CheckCircleOutlined,
  LinkOutlined,
  CopyOutlined
} from '@ant-design/icons';
import axios from 'axios';

const { Title, Text } = Typography;
const { Step } = Steps;

const SecondarySalesRegistrationPage = () => {
  const { registrationCode } = useParams();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [registrationData, setRegistrationData] = useState(null);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);

  useEffect(() => {
    if (registrationCode) {
      // 验证注册码
      validateRegistrationCode();
    }
  }, [registrationCode]);

  const validateRegistrationCode = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/links?link_code=${registrationCode}&link_type=secondary_registration`);
      
      if (response.data.success) {
        setRegistrationData(response.data.data);
        setCurrentStep(1);
      } else {
        message.error('注册码无效或已过期');
        setCurrentStep(0);
      }
    } catch (error) {
      console.error('验证注册码失败:', error);
      message.error('注册码验证失败');
      setCurrentStep(0);
    } finally {
      setLoading(false);
    }
  };

  const onFinish = async (values) => {
    try {
      setLoading(true);
      
      const response = await axios.post('/api/secondary-sales?path=register', {
        ...values,
        registration_code: registrationCode,
        primary_sales_id: registrationData?.sales_id
      });

      if (response.data.success) {
        setRegistrationSuccess(true);
        setCurrentStep(2);
        message.success('二级销售注册成功！');
      } else {
        message.error(response.data.message || '注册失败');
      }
    } catch (error) {
      console.error('注册失败:', error);
      message.error(error.response?.data?.message || '注册失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      message.success('链接已复制到剪贴板');
    });
  };

  const steps = [
    {
      title: '验证注册码',
      description: '验证二级销售注册码',
      icon: <LinkOutlined />
    },
    {
      title: '填写信息',
      description: '填写销售信息',
      icon: <UserOutlined />
    },
    {
      title: '注册完成',
      description: '获取销售链接',
      icon: <CheckCircleOutlined />
    }
  ];

  if (loading && currentStep === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <div>正在验证注册码...</div>
      </div>
    );
  }

  if (currentStep === 0) {
    return (
      <div style={{ maxWidth: '600px', margin: '50px auto', padding: '20px' }}>
        <Card>
          <Result
            status="error"
            title="注册码无效"
            subTitle="您提供的注册码无效或已过期，请联系一级销售获取新的注册码。"
            extra={[
              <Button type="primary" key="back" onClick={() => navigate('/')}>
                返回首页
              </Button>
            ]}
          />
        </Card>
      </div>
    );
  }

  if (registrationSuccess) {
    return (
      <div style={{ maxWidth: '800px', margin: '50px auto', padding: '20px' }}>
        <Card>
          <Steps current={currentStep} items={steps} style={{ marginBottom: '30px' }} />
          
          <Result
            status="success"
            title="二级销售注册成功！"
            subTitle="您已成功注册为二级销售，现在可以开始销售了。"
            extra={[
              <Button 
                type="primary" 
                key="copy" 
                icon={<CopyOutlined />}
                onClick={() => copyToClipboard(registrationData?.user_sales_link)}
              >
                复制销售链接
              </Button>,
              <Button key="dashboard" onClick={() => navigate('/secondary-sales-dashboard')}>
                进入销售面板
              </Button>
            ]}
          />

          <Divider />

          <Row gutter={16}>
            <Col span={12}>
              <Card size="small" title="销售链接信息">
                <Space direction="vertical" style={{ width: '100%' }}>
                  <div>
                    <Text strong>销售链接：</Text>
                    <div style={{ 
                      background: '#f5f5f5', 
                      padding: '8px', 
                      borderRadius: '4px',
                      wordBreak: 'break-all'
                    }}>
                      {registrationData?.user_sales_link}
                    </div>
                  </div>
                  <div>
                    <Text strong>链接代码：</Text>
                    <div style={{ 
                      background: '#f5f5f5', 
                      padding: '8px', 
                      borderRadius: '4px',
                      fontFamily: 'monospace'
                    }}>
                      {registrationData?.user_sales_code}
                    </div>
                  </div>
                </Space>
              </Card>
            </Col>
            <Col span={12}>
              <Card size="small" title="佣金信息">
                <Space direction="vertical" style={{ width: '100%' }}>
                  <div>
                    <Text strong>默认佣金率：</Text>
                    <Text type="success">30%</Text>
                  </div>
                  <div>
                    <Text strong>佣金说明：</Text>
                    <Text>您的佣金率由一级销售设定，可随时调整</Text>
                  </div>
                </Space>
              </Card>
            </Col>
          </Row>
        </Card>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '800px', margin: '50px auto', padding: '20px' }}>
      <Card>
        <Steps current={currentStep} items={steps} style={{ marginBottom: '30px' }} />
        
        <Title level={2}>销售注册</Title>
        <Text type="secondary">
          通过一级销售提供的注册码，注册成为销售，开始您的销售之旅。
        </Text>

        <Divider />

        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          initialValues={{
            payment_method: 'alipay'
          }}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="wechat_name"
                label="微信号"
                rules={[
                  { required: true, message: '请输入微信号' },
                  { min: 2, message: '微信号至少2个字符' }
                ]}
              >
                <Input placeholder="请输入您的微信号" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="payment_method"
                label="收款方式"
                rules={[{ required: true, message: '请选择收款方式' }]}
              >
                <Select>
                  <Select.Option value="alipay">支付宝</Select.Option>
                  <Select.Option value="crypto">线上地址码</Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="payment_address"
            label="收款地址"
            rules={[
              { required: true, message: '请输入收款地址' }
            ]}
          >
            <Input placeholder="请输入收款地址" />
          </Form.Item>

          <Form.Item
            noStyle
            shouldUpdate={(prevValues, currentValues) => 
              prevValues.payment_method !== currentValues.payment_method
            }
          >
            {({ getFieldValue }) => {
              const paymentMethod = getFieldValue('payment_method');
              
              if (paymentMethod === 'alipay') {
                return (
                  <Form.Item
                    name="alipay_surname"
                    label="收款人姓氏"
                    rules={[
                      { required: true, message: '请输入收款人姓氏' }
                    ]}
                  >
                    <Input placeholder="请输入收款人姓氏" />
                  </Form.Item>
                );
              }
              
              if (paymentMethod === 'crypto') {
                return (
                  <Form.Item
                    name="chain_name"
                    label="链名"
                    rules={[
                      { required: true, message: '请输入链名' }
                    ]}
                  >
                    <Input placeholder="请输入链名，如：ETH、BTC等" />
                  </Form.Item>
                );
              }
              
              return null;
            }}
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={loading}>
                注册销售
              </Button>
              <Button onClick={() => navigate('/')}>
                取消
              </Button>
            </Space>
          </Form.Item>
        </Form>

        <Alert
          message="注册说明"
          description="注册成功后，您将获得专属的销售链接，可以开始销售产品并获得佣金。您的佣金率由一级销售设定，默认为30%。"
          type="info"
          showIcon
          style={{ marginTop: '20px' }}
        />
      </Card>
    </div>
  );
};

export default SecondarySalesRegistrationPage; 