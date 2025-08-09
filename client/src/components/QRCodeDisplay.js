import React from 'react';
import QRCode from 'qrcode';
import { Card, Typography, Button, Space, message } from 'antd';
import { ShareAltOutlined, CopyOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

const QRCodeDisplay = ({ address, chainName = 'BSC/TRC20' }) => {
  const [qrCodeUrl, setQrCodeUrl] = React.useState('');

  React.useEffect(() => {
    if (address) {
      QRCode.toDataURL(address, {
        width: 200,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      }).then(url => {
        setQrCodeUrl(url);
      }).catch(err => {
        console.error('生成QR码失败:', err);
      });
    }
  }, [address]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(address);
      message.success('地址已复制到剪贴板');
    } catch (err) {
      message.error('复制失败');
    }
  };

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: '收款地址',
          text: `链名: ${chainName}\n地址: ${address}`,
        });
      } else {
        await navigator.clipboard.writeText(`链名: ${chainName}\n地址: ${address}`);
        message.success('收款信息已复制到剪贴板');
      }
    } catch (err) {
      message.error('分享失败');
    }
  };

  if (!address) {
    return null;
  }

  return (
    <Card className="card-container" role="region">
      <div style={{ textAlign: 'center' }}>
        <Title level={4} style={{ marginBottom: 16 }}>
          仅支持 {chainName} 资产
        </Title>
        
        <div style={{ 
          display: 'inline-block', 
          padding: '20px', 
          border: '2px solid #f0f0f0',
          borderRadius: '8px',
          marginBottom: '20px'
        }}>
          {qrCodeUrl && (
            <img 
              src={qrCodeUrl} 
              alt="QR Code" 
              style={{ 
                display: 'block',
                maxWidth: '200px',
                width: '100%'
              }} 
            />
          )}
        </div>
        
        <div style={{ marginBottom: '20px' }}>
          <Text type="secondary" style={{ fontSize: '14px' }}>
            钱包地址
          </Text>
          <div style={{ 
            wordBreak: 'break-all', 
            fontSize: '12px',
            marginTop: '8px',
            padding: '8px',
            backgroundColor: '#f5f5f5',
            borderRadius: '4px'
          }}>
            {address}
          </div>
        </div>
        
        <Space>
          <Button 
            type="primary" 
            icon={<ShareAltOutlined />}
            onClick={handleShare}
            tabIndex={0}
          >
            分享
          </Button>
          <Button 
            icon={<CopyOutlined />}
            onClick={handleCopy}
            tabIndex={0}
          >
            复制
          </Button>
        </Space>
      </div>
    </Card>
  );
};

export default QRCodeDisplay; 