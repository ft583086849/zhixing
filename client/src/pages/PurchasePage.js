import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useParams, useSearchParams } from 'react-router-dom';
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
  Radio,
  DatePicker,
  Upload,
  Row,
  Col,
  Statistic,
  Image,
  Modal,
  Tabs
} from 'antd';
import { 
  UserOutlined, 
  WalletOutlined, 
  UploadOutlined,
  DollarOutlined,
  ClockCircleOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { getSalesByLink, clearCurrentSales } from '../store/slices/salesSlice';
import { createOrder, clearCreatedOrder } from '../store/slices/ordersSlice';
import { getPaymentConfig } from '../store/slices/paymentConfigSlice';
import QRCodeDisplay from '../components/QRCodeDisplay';
import LoadingSpinner from '../components/LoadingSpinner';

const { Title, Text } = Typography;
const { Option } = Select;

const PurchasePage = () => {
  const { linkCode: pathLinkCode } = useParams();
  const [searchParams] = useSearchParams();
  const dispatch = useDispatch();
  
  // 获取链接代码，优先从查询参数获取，其次从路径参数获取
  const linkCode = searchParams.get('sales_code') || pathLinkCode;
  const { currentSales, loading: salesLoading, error: salesError } = useSelector((state) => state.sales);
  const { loading: orderLoading, error: orderError, createdOrder } = useSelector((state) => state.orders);
  const { config: paymentConfig, loading: configLoading, error: configError } = useSelector((state) => state.paymentConfig);
  const [form] = Form.useForm();

  const [selectedDuration, setSelectedDuration] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('crypto'); // 默认选择链上地址
  const [purchaseType, setPurchaseType] = useState('immediate');
  const [effectiveTime, setEffectiveTime] = useState(null);
  const [fileList, setFileList] = useState([]);
  const [imagePreviewVisible, setImagePreviewVisible] = useState(false);
  const [imagePreviewUrl, setImagePreviewUrl] = useState('');
  // const [alipayAmount, setAlipayAmount] = useState(''); // 已移除支付宝
  const [cryptoAmount, setCryptoAmount] = useState('');

  // 时长选项和价格
  const durationOptions = [
    { value: '7days', label: '7天免费', price: 0 },
    { value: '1month', label: '1个月', price: 188 },
    { value: '3months', label: '3个月', price: 488 },
    { value: '6months', label: '6个月', price: 688 },
    { value: '1year', label: '1年', price: 1588 }
  ];

  // 获取销售信息和管理员收款配置
  useEffect(() => {
    if (linkCode) {
      dispatch(getSalesByLink(linkCode));
      dispatch(getPaymentConfig());
    }
    return () => {
      dispatch(clearCurrentSales());
    };
  }, [dispatch, linkCode]);

  // 7天免费时自动选择即时购买
  useEffect(() => {
    if (selectedDuration === '7days') {
      setPurchaseType('immediate');
    }
  }, [selectedDuration]);

  // 获取选中时长的价格
  const getSelectedPrice = () => {
    const option = durationOptions.find(opt => opt.value === selectedDuration);
    return option ? option.price : 0;
  };

  // 计算到期时间
  const calculateExpiryTime = () => {
    if (!selectedDuration) return null;
    
    let baseTime;
    if (purchaseType === 'immediate') {
      // 即时生效：提交日期 + 购买时长 + 1天
      baseTime = dayjs();
    } else if (purchaseType === 'advance' && effectiveTime) {
      // 提前购买：生效时间 + 购买时长 + 1天
      baseTime = effectiveTime;
    } else {
      return null;
    }

    switch (selectedDuration) {
      case '7days':
        return baseTime.add(7, 'day').add(1, 'day');
      case '1month':
        return baseTime.add(1, 'month').add(1, 'day');
      case '3months':
        return baseTime.add(3, 'month').add(1, 'day');
      case '6months':
        return baseTime.add(6, 'month').add(1, 'day');
      case '1year':
        return baseTime.add(1, 'year').add(1, 'day');
      case 'lifetime':
        return baseTime.add(100, 'year').add(1, 'day');
      default:
        return null;
    }
  };

  // 处理表单提交
  // 将文件转换为Base64
  const fileToBase64 = (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.readAsDataURL(file);
    });
  };

  const handleSubmit = async (values) => {
    try {
      // 验证必填项
      if (!selectedDuration) {
        message.error('请选择购买时长');
        return;
      }
      if (!paymentMethod) {
        message.error('请选择付款方式');
        return;
      }
      if (purchaseType === 'advance' && !effectiveTime) {
        message.error('请选择生效时间');
        return;
      }
      // 免费订单不需要验证付款金额和截图
      if (selectedDuration !== '7days') {
        if (!cryptoAmount) {
          message.error('请输入链上地址付款金额');
          return;
        }
        // 付款截图必填验证
        if (fileList.length === 0) {
          message.error('请上传付款截图');
          return;
        }
      }

      // 处理截图上传
      let screenshotData = null;
      if (fileList.length > 0) {
        screenshotData = await fileToBase64(fileList[0]);
      }

      // 计算实付金额：对于免费订单为0，对于付费订单使用用户输入的金额
      const actualPaymentAmount = selectedDuration === '7days' ? 0 : parseFloat(cryptoAmount) || 0;

      const formData = {
        sales_code: linkCode, // 使用新的sales_code字段
        link_code: linkCode,  // 保持兼容性
        tradingview_username: values.tradingview_username,
        customer_wechat: values.customer_wechat,
        duration: selectedDuration, // 发送原始值，后端负责映射
        amount: getSelectedPrice(), // 添加金额字段
        actual_payment_amount: actualPaymentAmount, // 实付金额
        payment_method: paymentMethod, // 发送原始值，后端负责映射
        payment_time: selectedDuration === '7days' ? dayjs().format('YYYY-MM-DD HH:mm:ss') : values.payment_time.format('YYYY-MM-DD HH:mm:ss'),
        purchase_type: purchaseType, // 发送原始值，后端负责映射
        effective_time: purchaseType === 'advance' && effectiveTime ? effectiveTime.format('YYYY-MM-DD HH:mm:ss') : null,
        screenshot_data: screenshotData,
        crypto_amount: cryptoAmount || null
      };

      await dispatch(createOrder(formData)).unwrap();
      
      // 根据订单类型显示不同的提示信息
      if (selectedDuration === '7days') {
        // 免费订单
        message.success('订单提交成功！');
      } else {
        // 付费订单 - 显示特定提示信息，包含销售申请链接
        Modal.success({
          title: '订单提交成功',
          content: (
            <div>
              <p>您的订单已提交，请等待管理员确认配置。</p>
              <p style={{ marginTop: 12 }}>
                欢迎您加入一起销售。每笔获取25%用户付款收益，
                <a 
                  href="https://zhixing-seven.vercel.app/secondary-sales" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  style={{ color: '#1890ff', textDecoration: 'underline' }}
                >
                  点此链接到销售申请页面
                </a>
              </p>
            </div>
          ),
          okText: '确定',
          width: 480
        });
      }
      
      form.resetFields();
      setFileList([]);
      // setAlipayAmount(''); // 已移除支付宝
      setCryptoAmount('');
      setPurchaseType('immediate');
      setEffectiveTime(null);
    } catch (error) {
      // 用户购买失败友好提示 - 显示具体错误但保持友好性
      console.error('订单提交失败:', error);
      
      // 特定业务错误直接显示，不使用通用提示
      const specificErrors = [
        '您的tradingview已通过其他销售绑定，不支持跨销售绑定',
        '您的tradingview已通过销售绑定，不支持二次销售绑定',
        '您已享受过免费期，请续费使用'
      ];
      
      const errorMessage = error.message || '下单拥挤，请等待';
      const isSpecificError = specificErrors.some(specificError => 
        errorMessage.includes(specificError)
      );
      
      // 如果是具体的业务错误，直接显示；否则显示通用提示
      const displayMessage = isSpecificError ? errorMessage : '下单拥挤，请等待';
      message.error(displayMessage);
    }
  };

  // 文件上传配置
  const uploadProps = {
    fileList,
    beforeUpload: (file) => {
      const isImage = file.type.startsWith('image/');
      if (!isImage) {
        message.error('只能上传图片文件！');
        return false;
      }
      const isLt10M = file.size / 1024 / 1024 < 10;
      if (!isLt10M) {
        message.error('图片大小不能超过10MB！');
        return false;
      }
      setFileList([file]);
      return false;
    },
    onRemove: () => {
      setFileList([]);
    },
    onPreview: (file) => {
      setImagePreviewUrl(file.url || URL.createObjectURL(file.originFileObj));
      setImagePreviewVisible(true);
    }
  };

  // 显示收款信息
  const renderPaymentInfo = () => {
    if (!currentSales || !paymentMethod || !paymentConfig || selectedDuration === '7days') return null;

    // 只支持链上地址支付
    if (paymentMethod === 'crypto') {
      // 判断是否有第二个链上地址配置
      const hasCrypto2 = paymentConfig.crypto2_chain_name && paymentConfig.crypto2_address;
      
      if (hasCrypto2) {
        // 如果有两个链上地址，显示标签页让用户选择
        return (
          <div style={{ marginBottom: 16 }}>
            <Card title="请选择链上收款方式" size="small" role="region">
              <Tabs defaultActiveKey="1">
                <Tabs.TabPane tab="TRC20" key="1">
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <div>
                      <Text strong>链名：</Text>
                      <Text>{paymentConfig.crypto_chain_name}</Text>
                    </div>
                    <div>
                      <Text strong>收款地址：</Text>
                      <Text copyable>{paymentConfig.crypto_address}</Text>
                    </div>
                    
                    {/* 链上收款码图片 */}
                    {paymentConfig.crypto_qr_code ? (
                      <div style={{ textAlign: 'center', marginTop: 16 }}>
                        <Text strong style={{ display: 'block', marginBottom: 8 }}>收款码图片</Text>
                        <Image
                          width={200}
                          height={200}
                          src={paymentConfig.crypto_qr_code}
                          style={{ objectFit: 'cover', borderRadius: 8 }}
                          preview={{
                            src: paymentConfig.crypto_qr_code,
                          }}
                        />
                      </div>
                    ) : (
                      <div style={{ textAlign: 'center', marginTop: 16 }}>
                        <Text type="secondary">收款码图片</Text>
                        <div style={{ 
                          width: 200, 
                          height: 200, 
                          border: '1px dashed #d9d9d9', 
                          borderRadius: 8,
                          margin: '8px auto',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          background: '#fafafa'
                        }}>
                          <Text type="secondary">暂无收款码</Text>
                        </div>
                      </div>
                    )}
                  </Space>
                </Tabs.TabPane>
                
                <Tabs.TabPane tab="BSC" key="2">
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <div>
                      <Text strong>链名：</Text>
                      <Text>{paymentConfig.crypto2_chain_name}</Text>
                    </div>
                    <div>
                      <Text strong>收款地址：</Text>
                      <Text copyable>{paymentConfig.crypto2_address}</Text>
                    </div>
                    
                    {/* 链上收款码图片 */}
                    {paymentConfig.crypto2_qr_code ? (
                      <div style={{ textAlign: 'center', marginTop: 16 }}>
                        <Text strong style={{ display: 'block', marginBottom: 8 }}>收款码图片</Text>
                        <Image
                          width={200}
                          height={200}
                          src={paymentConfig.crypto2_qr_code}
                          style={{ objectFit: 'cover', borderRadius: 8 }}
                          preview={{
                            src: paymentConfig.crypto2_qr_code,
                          }}
                        />
                      </div>
                    ) : (
                      <div style={{ textAlign: 'center', marginTop: 16 }}>
                        <Text type="secondary">收款码图片</Text>
                        <div style={{ 
                          width: 200, 
                          height: 200, 
                          border: '1px dashed #d9d9d9', 
                          borderRadius: 8,
                          margin: '8px auto',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          background: '#fafafa'
                        }}>
                          <Text type="secondary">暂无收款码</Text>
                        </div>
                      </div>
                    )}
                  </Space>
                </Tabs.TabPane>
              </Tabs>
            </Card>
          </div>
        );
      } else {
        // 只有一个链上地址，显示原来的单个界面
        return (
          <div style={{ marginBottom: 16 }}>
            <Card title="链上收款信息" size="small" role="region">
              <Space direction="vertical" style={{ width: '100%' }}>
                <div>
                  <Text strong>链名：</Text>
                  <Text>{paymentConfig.crypto_chain_name}</Text>
                </div>
                <div>
                  <Text strong>收款地址：</Text>
                  <Text copyable>{paymentConfig.crypto_address}</Text>
                </div>
                
                {/* 链上收款码图片 */}
                {paymentConfig.crypto_qr_code ? (
                  <div style={{ textAlign: 'center', marginTop: 16 }}>
                    <Text strong style={{ display: 'block', marginBottom: 8 }}>收款码图片</Text>
                    <Image
                      width={200}
                      height={200}
                      src={paymentConfig.crypto_qr_code}
                      style={{ objectFit: 'cover', borderRadius: 8 }}
                      preview={{
                        src: paymentConfig.crypto_qr_code,
                      }}
                    />
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', marginTop: 16 }}>
                    <Text type="secondary">收款码图片</Text>
                    <div style={{ 
                      width: 200, 
                      height: 200, 
                      border: '1px dashed #d9d9d9', 
                      borderRadius: 8,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '16px auto',
                      backgroundColor: '#fafafa'
                    }}>
                      <Text type="secondary">暂无收款码</Text>
                    </div>
                  </div>
                )}
              </Space>
            </Card>
            
            {/* 链上地址付款金额输入 */}
            <Form.Item
              label="付款金额（美元）"
              required>
              <Input
                type="number"
                placeholder="请输入付款金额"
                value={cryptoAmount}
                onChange={(e) => setCryptoAmount(e.target.value)}
                aria-label="请输入付款金额"
                addonAfter="美元"
                size="large"
              />
            </Form.Item>
            
            <Alert
              message="请考虑手续费，保障到账金额"
              type="warning"
              showIcon
              style={{ marginTop: 16 }}
            />
          </div>
        );
      }
    }

    return null;
  };

  if (salesLoading || configLoading) {
    return <LoadingSpinner />;
  }

  if (salesError || !currentSales || configError || !paymentConfig) {
    return (
      <div className="page-container" role="main">
        <div className="content-container" role="main">
          <Card className="card-container" role="region">
            <Alert
              message="下单拥挤，请等待"
              description={salesError || "系统繁忙，请稍后再试"}
              type="warning"
              showIcon
            />
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div style={{ 
      padding: '24px', 
      maxWidth: '900px', 
      margin: '0 auto',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      minHeight: '100vh'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '16px',
        padding: '32px',
        boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
        marginTop: '20px'
      }}>
        <Title level={2} style={{ 
          textAlign: 'center', 
          marginBottom: '32px',
          color: '#2c3e50',
          fontWeight: 'bold'
        }}>
          🚀 购买服务
        </Title>

        {/* 购买表单 */}
        <Card title="购买信息" style={{ marginBottom: 16 }} role="region">

          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}>
            {/* TradingView用户名 */}
            <Form.Item
              name="tradingview_username"
              label="TradingView用户名"
              rules={[{ required: true, message: '请输入TradingView用户名' }]}>
              <Input 
                prefix={<UserOutlined />} 
                placeholder="请输入TradingView用户名"
                size="large"
              />
            </Form.Item>

            {/* 用户微信号 */}
            <Form.Item
              name="customer_wechat"
              label="用户微信号"
              rules={[{ required: true, message: '请输入用户微信号' }]}>
              <Input 
                prefix={<UserOutlined />} 
                placeholder="请输入用户微信号"
                size="large"
              />
            </Form.Item>

            {/* 购买时长 */}
            <Form.Item
              label="购买时长"
              required>
              <Radio.Group 
                value={selectedDuration}
                onChange={(e) => setSelectedDuration(e.target.value)}
                style={{ width: '100%' }}
              >
                <Row gutter={[16, 16]}>
                  {durationOptions.map(option => (
                    <Col span={24} sm={12} md={8} key={option.value}>
                      <Radio.Button 
                        value={option.value}
                        disabled={option.disabled}
                        style={{ 
                          width: '100%', 
                          textAlign: 'center',
                          height: 'auto',
                          padding: '12px',
                          opacity: option.disabled ? 0.5 : 1
                        }}
                      >
                        <div>
                          <div>{option.label}</div>
                          <div style={{ fontSize: '12px', color: '#666' }}>
                            {option.price === 0 ? '免费' : `$${option.price}`}
                          </div>
                          {option.disabled && (
                            <div style={{ fontSize: '10px', color: '#ff4d4f' }}>
                              已售罄
                            </div>
                          )}
                        </div>
                      </Radio.Button>
                    </Col>
                  ))}
                </Row>
              </Radio.Group>
            </Form.Item>

            {/* 购买方式 */}
            <Form.Item
              label="购买方式"
              required>
              <Radio.Group 
                value={purchaseType}
                onChange={(e) => {
                  setPurchaseType(e.target.value);
                  if (e.target.value === 'immediate') {
                    setEffectiveTime(null);
                  }
                }}
              >
                <Radio.Button value="immediate">即时购买</Radio.Button>
                <Radio.Button value="advance">提前购买</Radio.Button>
              </Radio.Group>
              <Text type="secondary" style={{ fontSize: '12px', marginLeft: '8px' }}>
                {purchaseType === 'immediate' ? '购买日配置后即生效' : '请指定生效日'}
              </Text>
            </Form.Item>

            {/* 生效时间（提前购买时显示） */}
            {purchaseType === 'advance' && (
              <Form.Item
                label="生效时间"
                required>
                <DatePicker 
                  showTime 
                  format="YYYY-MM-DD HH:mm:ss"
                  placeholder="请选择生效时间"
                  size="large"
                  style={{ width: '100%' }}
                  value={effectiveTime}
                  onChange={(date) => setEffectiveTime(date)}
                  disabledDate={(current) => current && current < dayjs().startOf('day')}
                />
              </Form.Item>
            )}

            {/* 付款方式 */}
            <Form.Item
              label="付款方式"
              required>
              <Radio.Group 
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
              >
                <Radio.Button value="crypto">链上地址</Radio.Button>
              </Radio.Group>

            </Form.Item>

            {/* 收款信息 - 根据付款方式动态显示 */}
            {renderPaymentInfo()}

            {/* 付款时间 - 免费订单不显示 */}
            {selectedDuration !== '7days' && (
              <Form.Item
                name="payment_time"
                label="付款时间"
                rules={[{ required: true, message: '请选择付款时间' }]}>
                <DatePicker 
                  showTime 
                  format="YYYY-MM-DD HH:mm:ss"
                  placeholder="请选择付款时间"
                  size="large"
                  style={{ width: '100%' }}
                  disabledDate={(current) => current && current > dayjs().endOf('day')}
                />
              </Form.Item>
            )}

            {/* 付款截图 - 免费订单不显示 */}
            {selectedDuration !== '7days' && (
              <Form.Item
                label="付款截图"
                required
                validateStatus={fileList.length === 0 ? 'error' : 'success'}
                help={fileList.length === 0 ? '请上传付款截图' : ''}>
                <Upload {...uploadProps} listType="picture">
                  <Button icon={<UploadOutlined />} size="large" tabIndex={0}>
                    上传截图
                  </Button>
                </Upload>
                <Text type="secondary">支持 JPG、PNG、GIF、WebP 格式，最大 10MB</Text>
              </Form.Item>
            )}

            {/* 价格和到期时间显示 */}
            {selectedDuration && (
              <Card 
                style={{ 
                  backgroundColor: '#f6ffed', 
                  borderColor: '#b7eb8f',
                  marginBottom: 16
                }}
               role="region">
                <Row gutter={16}>
                  <Col span={8}>
                    <Statistic
                      title="选择时长"
                      value={durationOptions.find(opt => opt.value === selectedDuration)?.label}
                      prefix={<ClockCircleOutlined />}
                    />
                  </Col>
                  <Col span={8}>
                    <Statistic
                      title="应付金额"
                      value={getSelectedPrice()}
                      prefix={<DollarOutlined />}
                      suffix="美元"
                    />
                  </Col>
                  <Col span={8}>
                    <Statistic
                      title="预计到期时间"
                      value={
                        selectedDuration === 'lifetime' 
                          ? '无限时长' 
                          : calculateExpiryTime() 
                            ? calculateExpiryTime().format('YYYY-MM-DD HH:mm') 
                            : '请选择生效时间'
                      }
                      prefix={<ClockCircleOutlined />}
                      valueStyle={{ 
                        fontSize: '14px',
                        color: selectedDuration === 'lifetime' ? '#52c41a' : undefined
                      }}
                    />
                  </Col>
                </Row>
                {purchaseType === 'advance' && !effectiveTime && (
                  <Alert
                    message="请选择生效时间以查看到期时间"
                    type="warning"
                    showIcon
                    style={{ marginTop: 16 }}
                  />
                )}
              </Card>
            )}

            {/* 提交按钮 */}
            <Form.Item>
              <Button 
                type="primary" 
                htmlType="submit" 
                loading={orderLoading}
                size="large"
                block
                disabled={
                  !selectedDuration || 
                  (selectedDuration !== '7days' && !paymentMethod) || 
                  (selectedDuration !== '7days' && !cryptoAmount) ||
                  (purchaseType === 'advance' && !effectiveTime)
                }
                style={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  border: 'none',
                  height: '48px',
                  fontSize: '16px',
                  fontWeight: 'bold'
                }}
               tabIndex={0}>
                提交订单
              </Button>

            </Form.Item>
          </Form>
        </Card>

        {/* 错误提示 */}
        {orderError && (
          <Alert
            message="下单拥挤，请等待"
            description={orderError}
            type="warning"
            showIcon
            style={{ marginTop: 16 }}
          />
        )}

        {/* 订单提交成功 */}
        {createdOrder && (
          <Card 
            title="订单提交成功" 
            style={{ 
              backgroundColor: '#f6ffed', 
              borderColor: '#b7eb8f',
              marginTop: 16
            }}
           role="region">
            <Space direction="vertical" style={{ width: '100%' }}>

              <div>
                <Text strong>订单状态：</Text>
                <Text>{createdOrder.status === 'pending_review' ? '待确认' : createdOrder.status}</Text>
              </div>
              <Text type="secondary">
                请等待管理员确认您的付款，确认后即可使用服务。
              </Text>
            </Space>
          </Card>
        )}



        {/* 图片预览模态框 */}
        <Modal
          open={imagePreviewVisible}
          footer={null}
          onCancel={() => setImagePreviewVisible(false)}
          width="80%"
          style={{ top: 20 }}
        >
          <Image
            style={{ width: '100%' }}
            src={imagePreviewUrl}
            preview={{
              visible: imagePreviewVisible,
              onVisibleChange: (visible) => setImagePreviewVisible(visible),
            }}
          />
        </Modal>
      </div>
    </div>
  );
};

export default PurchasePage; 