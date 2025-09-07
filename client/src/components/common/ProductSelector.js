import React, { useState, useEffect } from 'react';
import { Card, Tabs, Radio, Row, Col, Typography, Tag, Space } from 'antd';
import { CheckCircleOutlined, CrownOutlined, StarOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;
const { TabPane } = Tabs;

const ProductSelector = ({ onProductChange, onPriceChange, onDurationChange, defaultProduct = '推币策略', defaultDuration = '1个月' }) => {
  const [selectedProduct, setSelectedProduct] = useState(defaultProduct);
  const [selectedDuration, setSelectedDuration] = useState(defaultDuration);

  // 产品价格体系（9月6日起生效）
  const productPricing = {
    '推币策略': { 
      '7天': 0, '1个月': 288, '3个月': 588, '6个月': 1088, '1年': 1888,
      description: '专业推币策略和信号',
      icon: <CheckCircleOutlined style={{ color: '#1890ff' }} />,
      features: ['推币策略分析', 'TradingView信号', '24小时客服']
    },
    '推币系统': { 
      '7天': 0, '1个月': 588, '3个月': 1588, '6个月': 2588, '1年': 3999,
      description: 'Discord平台高级推币系统',
      icon: <CrownOutlined style={{ color: '#f1c40f' }} />,
      features: ['Discord专属频道', '实时推币信号', '3天免费试用', '高级分析工具']
    },
    '套餐组合': { 
      '7天': 0, '1个月': 688, '3个月': 1888, '6个月': 3188, '1年': 4688,
      description: '推币策略 + 推币系统组合套餐',
      icon: <StarOutlined style={{ color: '#52c41a' }} />,
      features: ['包含推币策略', '包含推币系统', '专属VIP客服', '最优价格组合']
    }
  };

  // 时长选项
  const durationOptions = [
    { value: '7天', label: '7天免费' },
    { value: '1个月', label: '1个月' },
    { value: '3个月', label: '3个月' },
    { value: '6个月', label: '6个月' },
    { value: '1年', label: '1年' }
  ];

  // 当产品或时长变化时，通知父组件
  useEffect(() => {
    const currentPrice = productPricing[selectedProduct][selectedDuration];
    onProductChange && onProductChange(selectedProduct);
    onPriceChange && onPriceChange(currentPrice);
    onDurationChange && onDurationChange(selectedDuration);
  }, [selectedProduct, selectedDuration, onProductChange, onPriceChange, onDurationChange]);

  const handleProductChange = (productType) => {
    setSelectedProduct(productType);
  };

  const handleDurationChange = (e) => {
    setSelectedDuration(e.target.value);
  };

  const getCurrentPrice = () => {
    return productPricing[selectedProduct][selectedDuration];
  };

  const renderPricingOptions = (productType) => {
    const prices = productPricing[productType];
    const productInfo = productPricing[productType];
    
    return (
      <div>
        {/* 产品描述 */}
        <div style={{ marginBottom: '16px', textAlign: 'center' }}>
          <Space direction="vertical" size="small">
            <div style={{ fontSize: '16px', fontWeight: 'bold' }}>
              {productInfo.icon} {productType}
            </div>
            <Text type="secondary">{productInfo.description}</Text>
          </Space>
        </div>

        {/* 产品特色 */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{ marginBottom: '8px', fontWeight: 'bold', fontSize: '14px' }}>产品特色：</div>
          <Space wrap>
            {productInfo.features.map((feature, index) => (
              <Tag key={index} color="blue">{feature}</Tag>
            ))}
          </Space>
        </div>

        {/* 价格选择 */}
        <Radio.Group
          value={selectedDuration}
          onChange={handleDurationChange}
          style={{ width: '100%' }}
        >
          <Row gutter={[12, 12]}>
            {durationOptions.map(option => {
              const price = prices[option.value];
              const isSelected = selectedDuration === option.value;
              const isFree = price === 0;
              
              return (
                <Col span={24} sm={12} md={8} key={option.value}>
                  <Radio.Button 
                    value={option.value}
                    style={{ 
                      width: '100%', 
                      height: '60px', 
                      display: 'flex', 
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexDirection: 'column',
                      backgroundColor: isSelected ? '#e6f7ff' : undefined,
                      borderColor: isSelected ? '#1890ff' : undefined,
                      borderWidth: isSelected ? '2px' : '1px'
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 'bold' }}>{option.label}</div>
                      <div style={{ 
                        fontSize: '12px', 
                        color: isFree ? '#52c41a' : '#666',
                        fontWeight: isFree ? 'bold' : 'normal'
                      }}>
                        {isFree ? '免费' : `$${price}`}
                      </div>
                    </div>
                  </Radio.Button>
                </Col>
              );
            })}
          </Row>
        </Radio.Group>

        {/* 当前选择显示 */}
        <div style={{ 
          marginTop: '20px', 
          padding: '16px', 
          backgroundColor: '#f0f9ff', 
          borderRadius: '8px',
          textAlign: 'center'
        }}>
          <Text strong>
            当前选择：{selectedProduct} - {durationOptions.find(opt => opt.value === selectedDuration)?.label}
          </Text>
          <br />
          <Text style={{ fontSize: '18px', color: '#1890ff', fontWeight: 'bold' }}>
            价格：{getCurrentPrice() === 0 ? '免费' : `$${getCurrentPrice()}`}
          </Text>
        </div>
      </div>
    );
  };

  return (
    <Card title="选择产品类型" style={{ marginBottom: '24px' }}>
      <Tabs 
        activeKey={selectedProduct} 
        onChange={handleProductChange}
        size="large"
        centered
      >
        <TabPane 
          tab={
            <Space>
              <CheckCircleOutlined />
              推币策略
            </Space>
          } 
          key="推币策略"
        >
          {renderPricingOptions('推币策略')}
        </TabPane>
        
        <TabPane 
          tab={
            <Space>
              <CrownOutlined />
              推币系统
              <Tag color="gold" size="small">NEW</Tag>
            </Space>
          } 
          key="推币系统"
        >
          {renderPricingOptions('推币系统')}
        </TabPane>
        
        <TabPane 
          tab={
            <Space>
              <StarOutlined />
              套餐组合
              <Tag color="red" size="small">推荐</Tag>
            </Space>
          } 
          key="套餐组合"
        >
          {renderPricingOptions('套餐组合')}
        </TabPane>
      </Tabs>
    </Card>
  );
};

export default ProductSelector;