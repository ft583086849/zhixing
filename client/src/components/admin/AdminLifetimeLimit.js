import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { 
  Card, 
  Button, 
  Progress, 
  Typography, 
  Alert, 
  Modal, 
  Form, 
  InputNumber, 
  Switch, 
  message 
} from 'antd';
import { 
  SettingOutlined,
  InfoCircleOutlined
} from '@ant-design/icons';
import { getLifetimeLimitInfo, updateLifetimeLimitConfig } from '../../store/slices/lifetimeLimitSlice';

const { Title, Text } = Typography;

const AdminLifetimeLimit = () => {
  const dispatch = useDispatch();
  const { totalLimit, soldCount, remainingCount, isActive, loading } = useSelector((state) => state.lifetimeLimit);
  const [form] = Form.useForm();
  const [configModalVisible, setConfigModalVisible] = useState(false);

  useEffect(() => {
    dispatch(getLifetimeLimitInfo());
  }, [dispatch]);

  const salesProgress = totalLimit > 0 ? (soldCount / totalLimit) * 100 : 0;

  const handleOpenConfig = () => {
    form.setFieldsValue({
      total_limit: totalLimit,
      is_active: isActive
    });
    setConfigModalVisible(true);
  };

  const handleSaveConfig = async (values) => {
    try {
      await dispatch(updateLifetimeLimitConfig(values)).unwrap();
      message.success('配置保存成功');
      setConfigModalVisible(false);
    } catch (error) {
      message.error('配置保存失败');
    }
  };

  return (
    <div>
      <Title level={2}>永久授权限量管理</Title>

      {/* 限量状态卡片 */}
      <Card style={{ marginBottom: 16 }}>
        <div style={{ textAlign: 'center' }}>
          <Title level={3}>销售进度</Title>
          <Progress
            type="circle"
            percent={salesProgress}
            status={remainingCount === 0 ? 'exception' : 'active'}
            strokeColor={{
              '0%': '#108ee9',
              '100%': '#87d068',
            }}
          />
          <Text type="secondary">
            已售 {soldCount} / {totalLimit} ({salesProgress.toFixed(1)}%)
          </Text>
        </div>
      </Card>

      {/* 限量状态提示 */}
      {remainingCount <= 10 && remainingCount > 0 && (
        <Alert
          message="限量提醒"
          description={`永久授权仅剩余 ${remainingCount} 个，请及时关注库存情况。`}
          type="warning"
          showIcon
          style={{ marginTop: 16 }}
        />
      )}

      {remainingCount === 0 && (
        <Alert
          message="已售罄"
          description="永久授权已全部售出，用户将无法选择终身选项。"
          type="error"
          showIcon
          style={{ marginTop: 16 }}
        />
      )}

      {/* 配置按钮 */}
      <Card style={{ marginTop: 16 }}>
        <Button 
          type="primary" 
          icon={<SettingOutlined />}
          onClick={handleOpenConfig}
          loading={loading}
        >
          调整限量设置
        </Button>
        <Text type="secondary" style={{ marginLeft: 16 }}>
          <InfoCircleOutlined /> 可以调整总限量和启用/禁用限量功能
        </Text>
      </Card>

      {/* 配置模态框 */}
      <Modal
        title="永久授权限量配置"
        open={configModalVisible}
        onCancel={() => setConfigModalVisible(false)}
        footer={null}
        width={500}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSaveConfig}
        >
          <Form.Item
            name="total_limit"
            label="总限量"
            rules={[
              { required: true, message: '请输入总限量' },
              { type: 'number', min: soldCount, message: `总限量不能小于已售数量（${soldCount}）` }
            ]}
          >
            <InputNumber
              min={soldCount}
              max={1000}
              style={{ width: '100%' }}
              placeholder="请输入总限量"
            />
          </Form.Item>

          <Form.Item
            name="is_active"
            label="启用限量"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} style={{ marginRight: 8 }}>
              保存配置
            </Button>
            <Button onClick={() => setConfigModalVisible(false)}>
              取消
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default AdminLifetimeLimit; 