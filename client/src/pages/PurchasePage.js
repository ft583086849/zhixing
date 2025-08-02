import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useParams } from 'react-router-dom';
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
  Modal
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
  const { linkCode } = useParams();
  const dispatch = useDispatch();
  const { currentSales, loading: salesLoading, error: salesError } = useSelector((state) => state.sales);
  const { loading: orderLoading, error: orderError, createdOrder } = useSelector((state) => state.orders);

  const { config: paymentConfig, loading: configLoading, error: configError } = useSelector((state) => state.paymentConfig);
  const [form] = Form.useForm();

  const [selectedDuration, setSelectedDuration] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [purchaseType, setPurchaseType] = useState('immediate');
  const [effectiveTime, setEffectiveTime] = useState(null);
  const [fileList, setFileList] = useState([]);
  const [imagePreviewVisible, setImagePreviewVisible] = useState(false);
  const [imagePreviewUrl, setImagePreviewUrl] = useState('');
  const [alipayAmount, setAlipayAmount] = useState('');
  const [cryptoAmount, setCryptoAmount] = useState('');

  // 时长选项和价格
  const durationOptions = [
    { value: '7days', label: '7天免费', price: 0 },
    { value: '1month', label: '1个月', price: 188 },
    { value: '3months', label: '3个月', price: 488 },
    { value: '6months', label: '6个月', price: 688 },
    { value: '1year', label: '1年', price: 1588 }
  ];

  // 获取销售信息和支付配置
  useEffect(() => {
    if (linkCode) {
      dispatch(getSalesByLink(linkCode));
      dispatch(getPaymentConfig());
    }
    return () => {
      dispatch(clearCurrentSales());
    };
  }, [dispatch, linkCode]);

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
      // 免费订单不需要验证付款金额
      if (selectedDuration !== '7days') {
        if (paymentMethod === 'alipay' && !alipayAmount) {
          message.error('请输入支付宝付款金额');
          return;
        }
        if (paymentMethod === 'crypto' && !cryptoAmount) {
          message.error('请输入线上地址码付款金额');
          return;
        }
      }

      // 处理截图上传
      let screenshotData = null;
      if (fileList.length > 0) {
        screenshotData = await fileToBase64(fileList[0]);
      }

      const formData = {
        link_code: linkCode,
        tradingview_username: values.tradingview_username,
        customer_wechat: values.customer_wechat,
        duration: selectedDuration,
        amount: getSelectedPrice(), // 添加金额字段
        payment_method: paymentMethod,
        payment_time: selectedDuration === '7days' ? dayjs().format('YYYY-MM-DD HH:mm:ss') : values.payment_time.format('YYYY-MM-DD HH:mm:ss'),
        purchase_type: purchaseType,
        effective_time: purchaseType === 'advance' && effectiveTime ? effectiveTime.format('YYYY-MM-DD HH:mm:ss') : null,
        screenshot_data: screenshotData,
        alipay_amount: paymentMethod === 'alipay' ? alipayAmount : null,
        crypto_amount: paymentMethod === 'crypto' ? cryptoAmount : null
      };

      await dispatch(createOrder(formData)).unwrap();
      message.success('订单提交成功！');
      form.resetFields();
      setFileList([]);
      setAlipayAmount('');
      setCryptoAmount('');
      setPurchaseType('immediate');
      setEffectiveTime(null);
    } catch (error) {
      message.error(error || '提交失败');
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

    if (paymentMethod === 'alipay') {
      return (
        <Card title="支付宝收款信息" style={{ marginBottom: 16 }} role="region">
          <Space direction="vertical" style={{ width: '100%' }}>
            <div>
              <Text strong>支付宝账号：</Text>
              <Text copyable>{paymentConfig.alipay_account}</Text>
            </div>
            <div>
              <Text strong>收款人姓氏：</Text>
              <Text>{paymentConfig.alipay_surname}</Text>
            </div>
            
            {/* 支付宝收款码图片 */}
            <div style={{ textAlign: 'center', marginTop: 16 }}>
              <Text strong style={{ display: 'block', marginBottom: 8 }}>支付宝收款码</Text>
              {paymentConfig.alipay_qr_code ? (
                <Image
                  width={200}
                  height={200}
                  src={paymentConfig.alipay_qr_code}
                  style={{ objectFit: 'cover', borderRadius: 8 }}
                  preview={{
                    src: paymentConfig.alipay_qr_code,
                  }}
                />
              ) : (
                <div style={{ 
                  width: 200, 
                  height: 200, 
                  border: '2px dashed #d9d9d9', 
                  borderRadius: 8,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: '#fafafa'
                }}>
                  <Text type="secondary">暂无收款码图片</Text>
                </div>
              )}
            </div>
            
            <Form.Item
              label="付款金额（人民币）"
              required>
              <Input
                type="number"
                placeholder="请输入付款金额"
                value={alipayAmount}
                onChange={(e) => setAlipayAmount(e.target.value)}
                aria-label="请输入付款金额"
                addonAfter="元"
                size="large"
              />
            </Form.Item>

          </Space>
        </Card>
      );
    }

    if (paymentMethod === 'crypto') {
      return (
        <div style={{ marginBottom: 16 }}>
          <Card title="链上收款信息" size="small" role="region">
            <Space direction="vertical" style={{ width: '100%' }}>
              <div>
                <Text strong>链名：</Text>
                <Text>{paymentConfig.crypto_chain_name}</Text>
              </div>
              <div>
                <Text strong>地址：</Text>
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
                    <Text type="secondary">收款码图片</Text>
                  </div>
                </div>
              )}
            </Space>
          </Card>
          
          {/* 线上地址码付款金额输入 */}
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
              message="链接无效"
              description="该收款链接不存在或已失效"
              type="error"
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

            {/* 用户微信名 */}
            <Form.Item
              name="customer_wechat"
              label="用户微信名"
              rules={[{ required: true, message: '请输入用户微信名' }]}>
              <Input 
                prefix={<UserOutlined />} 
                placeholder="请输入用户微信名"
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
                <Radio.Button value="alipay">支付宝</Radio.Button>
                <Radio.Button value="crypto">线上地址码</Radio.Button>
              </Radio.Group>
              {paymentMethod === 'alipay' && selectedDuration && selectedDuration !== '7days' && (
                <div style={{ marginTop: 8 }}>
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    默认汇率按照7.15计算，建议付款金额：¥{(getSelectedPrice() * 7.15).toFixed(2)}
                  </Text>
                </div>
              )}
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
                label="付款截图">
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
                  !paymentMethod || 
                  (paymentMethod === 'alipay' && !alipayAmount) ||
                  (paymentMethod === 'crypto' && !cryptoAmount) ||
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
            message="错误"
            description={orderError}
            type="error"
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