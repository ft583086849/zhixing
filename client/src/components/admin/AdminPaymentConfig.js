import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { 
  Card, 
  Form, 
  Input, 
  Button, 
  Upload, 
  message, 
  Typography, 
  Divider, 
  Space, 
  Image 
} from 'antd';
import { 
  UploadOutlined,
  EyeOutlined,
  DeleteOutlined,
  SaveOutlined
} from '@ant-design/icons';
import { getPaymentConfig, updatePaymentConfig } from '../../store/slices/paymentConfigSlice';

const { Title, Text } = Typography;

const AdminPaymentConfig = () => {
  const dispatch = useDispatch();
  const { config, loading } = useSelector((state) => state.paymentConfig);
  const [form] = Form.useForm();
  // const [alipayQRCode, setAlipayQRCode] = useState(''); // 已移除支付宝
  const [cryptoQRCode, setCryptoQRCode] = useState('');
  const [crypto2QRCode, setCrypto2QRCode] = useState(''); // 第二个链上地址

  useEffect(() => {
    dispatch(getPaymentConfig());
  }, [dispatch]);

  useEffect(() => {
    if (config) {
      form.setFieldsValue({
        crypto_chain_name: config.crypto_chain_name,
        crypto_address: config.crypto_address,
        // 第二个链上地址配置，默认值为BSC链
        crypto2_chain_name: config.crypto2_chain_name || 'BSC',
        crypto2_address: config.crypto2_address || '0xAE25E29d3baCD91B0fFd0807859531419a85375a'
      });
      // setAlipayQRCode(config.alipay_qr_code); // 已移除支付宝
      setCryptoQRCode(config.crypto_qr_code);
      setCrypto2QRCode(config.crypto2_qr_code);
    }
  }, [config, form]);

  const handleSave = async (values) => {
    try {
      const configData = {
        crypto_chain_name: values.crypto_chain_name,
        crypto_address: values.crypto_address,
        crypto_qr_code: cryptoQRCode, // 包含二维码图片数据
        // 第二个链上地址配置
        crypto2_chain_name: values.crypto2_chain_name || 'BSC',
        crypto2_address: values.crypto2_address || '0xAE25E29d3baCD91B0fFd0807859531419a85375a',
        crypto2_qr_code: crypto2QRCode
      };

      await dispatch(updatePaymentConfig(configData)).unwrap();
      message.success('配置保存成功');
    } catch (error) {
      message.error('配置保存失败');
    }
  };

  const handleUpload = (file, type) => {
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

    const formData = new FormData();
    formData.append('qr_code', file);
    formData.append('type', type);

    // 模拟上传
    const reader = new FileReader();
    reader.onload = (e) => {
      // 处理crypto类型
      if (type === 'crypto') {
        setCryptoQRCode(e.target.result);
      } else if (type === 'crypto2') {
        setCrypto2QRCode(e.target.result);
      }
    };
    reader.readAsDataURL(file);

    return false; // 阻止自动上传
  };

  const handlePreview = (imageUrl) => {
    // 实现图片预览逻辑
    console.log('预览图片:', imageUrl);
  };

  const handleRemove = (type) => {
    // 处理crypto类型
    if (type === 'crypto') {
      setCryptoQRCode('');
    } else if (type === 'crypto2') {
      setCrypto2QRCode('');
    }
  };

  // 已移除支付宝上传配置

  const cryptoUploadProps = {
    beforeUpload: (file) => {
      handleUpload(file, 'crypto');
      return false; // 阻止自动上传
    },
    showUploadList: false,
    fileList: [], // 确保文件列表为空
    accept: 'image/*', 
    multiple: false,
    onRemove: () => false, // 禁用移除功能
  };
  
  const crypto2UploadProps = {
    beforeUpload: (file) => {
      handleUpload(file, 'crypto2');
      return false; // 阻止自动上传
    },
    showUploadList: false,
    fileList: [], // 确保文件列表为空
    accept: 'image/*', 
    multiple: false,
    onRemove: () => false, // 禁用移除功能
  };

  return (
    <div>
      <Title level={2}>收款配置</Title>

      <Form
        form={form}
        layout="vertical"
        onFinish={handleSave}
      >
        {/* 支付宝收款配置已移除 */}

        {/* 链上地址收款配置（一） */}
        <Card title="链上地址收款配置（一）" style={{ marginBottom: 24 }}>
          <Space direction="vertical" style={{ width: '100%' }}>
            <Form.Item
              label="链名"
              name="crypto_chain_name"
              rules={[{ required: true, message: '请输入链名' }]}
            >
              <Input placeholder="如：TRC10/TRC20" />
            </Form.Item>
            
            <Form.Item
              label="收款地址"
              name="crypto_address"
              rules={[{ required: true, message: '请输入收款地址' }]}
            >
              <Input.TextArea 
                placeholder="请输入收款地址" 
                rows={3}
              />
            </Form.Item>
            
            <Form.Item label="线上收款码">
              <Space direction="vertical" style={{ width: '100%' }}>
                {cryptoQRCode ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <Image
                      width={100}
                      height={100}
                      src={cryptoQRCode}
                      style={{ objectFit: 'cover', borderRadius: 8 }}
                    />
                    <Space>
                      <Button 
                        type="link" 
                        icon={<EyeOutlined />}
                        onClick={() => handlePreview(cryptoQRCode)}
                      >
                        预览
                      </Button>
                      <Button 
                        type="link" 
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => handleRemove('crypto')}
                      >
                        删除
                      </Button>
                    </Space>
                  </div>
                ) : (
                  <Upload {...cryptoUploadProps}>
                    <Button icon={<UploadOutlined />}>上传收款码</Button>
                  </Upload>
                )}
                <Text type="secondary">支持 JPG、PNG、GIF、WebP 格式，最大 10MB</Text>
              </Space>
            </Form.Item>
          </Space>
        </Card>

        {/* 链上地址收款配置（二） */}
        <Card title="链上地址收款配置（二）" style={{ marginBottom: 24 }}>
          <Space direction="vertical" style={{ width: '100%' }}>
            <Form.Item
              label="链名"
              name="crypto2_chain_name"
              rules={[{ required: true, message: '请输入链名' }]}
              initialValue="BSC"
            >
              <Input placeholder="如：BSC/ETH/TRON" />
            </Form.Item>
            
            <Form.Item
              label="收款地址"
              name="crypto2_address"
              rules={[{ required: true, message: '请输入收款地址' }]}
              initialValue="0xAE25E29d3baCD91B0fFd0807859531419a85375a"
            >
              <Input.TextArea 
                placeholder="请输入收款地址" 
                rows={3}
              />
            </Form.Item>
            
            <Form.Item label="线上收款码">
              <Space direction="vertical" style={{ width: '100%' }}>
                {crypto2QRCode ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <Image
                      width={100}
                      height={100}
                      src={crypto2QRCode}
                      style={{ objectFit: 'cover', borderRadius: 8 }}
                    />
                    <Space>
                      <Button 
                        type="link" 
                        icon={<EyeOutlined />}
                        onClick={() => handlePreview(crypto2QRCode)}
                      >
                        预览
                      </Button>
                      <Button 
                        type="link" 
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => handleRemove('crypto2')}
                      >
                        删除
                      </Button>
                    </Space>
                  </div>
                ) : (
                  <Upload {...crypto2UploadProps}>
                    <Button icon={<UploadOutlined />}>上传收款码</Button>
                  </Upload>
                )}
                <Text type="secondary">支持 JPG、PNG、GIF、WebP 格式，最大 10MB</Text>
              </Space>
            </Form.Item>
          </Space>
        </Card>

        <Form.Item>
          <Button 
            type="primary" 
            htmlType="submit" 
            loading={loading}
            icon={<SaveOutlined />}
          >
            保存配置
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
};

export default AdminPaymentConfig; 