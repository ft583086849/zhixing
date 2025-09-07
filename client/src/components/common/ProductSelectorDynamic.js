import React, { useState, useEffect } from 'react';
import { Card, Tabs, Radio, Row, Col, Typography, Tag, Space, Spin, Alert } from 'antd';
import { CheckCircleOutlined, CrownOutlined, StarOutlined, LoadingOutlined } from '@ant-design/icons';
import ProductConfigAPI from '../../services/productConfigAPI';

const { Title, Text } = Typography;
const { TabPane } = Tabs;

const ProductSelectorDynamic = ({ onProductChange, onPriceChange, onDurationChange, defaultProduct = '信号策略', defaultDuration = '1个月' }) => {
  const [selectedProduct, setSelectedProduct] = useState(defaultProduct);
  const [selectedDuration, setSelectedDuration] = useState(defaultDuration);
  const [productConfigs, setProductConfigs] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 产品图标映射
  const productIcons = {
    '信号策略': <CheckCircleOutlined style={{ color: '#1890ff' }} />,
    '推币系统': <CrownOutlined style={{ color: '#f1c40f' }} />,
    '套餐组合': <StarOutlined style={{ color: '#52c41a' }} />
  };

  // 加载产品配置
  useEffect(() => {
    loadProductConfigs();
  }, []);

  const loadProductConfigs = async () => {
    try {
      setLoading(true);
      const result = await ProductConfigAPI.getGroupedProductConfigs();
      
      // 转换为组件需要的格式
      const formattedConfigs = {};
      
      Object.entries(result.data).forEach(([productType, productData]) => {
        const { configs, features, status } = productData;
        
        // 构建价格映射
        const pricing = {};
        configs.forEach(config => {
          if (config.is_trial) {
            pricing[`${config.trial_days}天`] = 0;
          } else {
            const durationKey = config.duration_months === 12 ? '1年' : 
                               config.duration_months === 6 ? '6个月' :
                               config.duration_months === 3 ? '3个月' : '1个月';
            pricing[durationKey] = config.price_usd;
          }
        });
        
        formattedConfigs[productType] = {
          ...pricing,
          description: getProductDescription(productType),
          icon: productIcons[productType],
          features: features.map(f => f.feature_name),
          status: status
        };
      });
      
      setProductConfigs(formattedConfigs);
      console.log('✅ 产品配置加载成功:', result.source);
      
    } catch (err) {
      console.error('❌ 加载产品配置失败:', err);
      setError('加载产品配置失败，请刷新页面重试');
    } finally {
      setLoading(false);
    }
  };

  const getProductDescription = (productType) => {
    const descriptions = {
      '信号策略': '专业信号策略和分析',
      '推币系统': 'Discord平台高级推币系统',
      '套餐组合': '信号策略 + 推币系统组合套餐'
    };
    return descriptions[productType] || '';
  };

  // 动态生成时长选项
  const getDurationOptions = (productType) => {
    const productConfig = productConfigs[productType];
    if (!productConfig) return [];
    
    const options = [];
    
    // 检查是否有免费试用
    if (productConfig['3天'] === 0) {
      options.push({ value: '3天', label: '3天免费' });
    }
    
    // 添加付费选项
    ['1个月', '3个月', '6个月', '1年'].forEach(duration => {
      if (productConfig[duration] !== undefined) {
        options.push({ value: duration, label: duration });
      }
    });
    
    return options;
  };

  // 当产品或时长变化时，通知父组件
  useEffect(() => {
    if (Object.keys(productConfigs).length > 0) {
      const currentPrice = productConfigs[selectedProduct]?.[selectedDuration] || 0;
      onProductChange && onProductChange(selectedProduct);
      onPriceChange && onPriceChange(currentPrice);
      onDurationChange && onDurationChange(selectedDuration);
    }
  }, [selectedProduct, selectedDuration, productConfigs, onProductChange, onPriceChange, onDurationChange]);

  const handleProductChange = (productType) => {
    setSelectedProduct(productType);
  };

  const handleDurationChange = (e) => {
    setSelectedDuration(e.target.value);
  };

  const getCurrentPrice = () => {
    return productConfigs[selectedProduct]?.[selectedDuration] || 0;
  };

  const renderPricingOptions = (productType) => {
    const productInfo = productConfigs[productType];
    if (!productInfo) return null;
    
    const durationOptions = getDurationOptions(productType);
    if (durationOptions.length === 0) return null;
    
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
              const price = productInfo[option.value];
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

  // 加载中状态
  if (loading) {
    return (
      <Card title="选择产品类型" style={{ marginBottom: '24px' }}>
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <Spin 
            indicator={<LoadingOutlined style={{ fontSize: 24 }} spin />} 
            size="large" 
          />
          <div style={{ marginTop: '16px' }}>正在加载产品配置...</div>
        </div>
      </Card>
    );
  }

  // 错误状态
  if (error) {
    return (
      <Card title="选择产品类型" style={{ marginBottom: '24px' }}>
        <Alert
          message="加载失败"
          description={error}
          type="error"
          showIcon
          action={
            <button onClick={loadProductConfigs} style={{ marginLeft: '8px' }}>
              重试
            </button>
          }
        />
      </Card>
    );
  }

  return (
    <Card title="选择产品类型" style={{ marginBottom: '24px' }}>
      <Tabs 
        activeKey={selectedProduct} 
        onChange={handleProductChange}
        size="large"
        centered
      >
        {Object.entries(productConfigs).map(([productType, productInfo]) => {
          const isComingSoon = productInfo.status === 'coming_soon';
          
          return (
            <TabPane 
              tab={
                <Space>
                  {productInfo.icon}
                  {productType}
                  {productType === '推币系统' && <Tag color="gold" size="small">NEW</Tag>}
                  {productType === '套餐组合' && <Tag color="red" size="small">推荐</Tag>}
                  {isComingSoon && <Tag color="orange" size="small">即将上线</Tag>}
                </Space>
              } 
              key={productType}
              disabled={isComingSoon}
            >
              {isComingSoon ? (
                <div style={{textAlign: 'center', padding: '40px'}}>
                  <Title level={4}>该产品即将上线</Title>
                  <Text type="secondary">敬请期待...</Text>
                </div>
              ) : (
                renderPricingOptions(productType)
              )}
            </TabPane>
          );
        })}
      </Tabs>
    </Card>
  );
};

export default ProductSelectorDynamic;