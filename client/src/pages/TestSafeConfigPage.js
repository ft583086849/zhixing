import React, { useState, useEffect } from 'react';
import { Card, Button, Alert, Descriptions, Tag, Space, Spin } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';

// 测试两种配置
import { supabase as supabaseOld } from '../config/supabase'; // 原配置
import supabaseSafe from '../config/supabase-safe'; // 新配置

const TestSafeConfigPage = () => {
  const [loading, setLoading] = useState(false);
  const [testResults, setTestResults] = useState({
    oldConfig: null,
    safeConfig: null,
    comparison: null
  });

  // 测试原配置
  const testOldConfig = async () => {
    try {
      const { data, error } = await supabaseOld
        .from('admins')
        .select('count', { count: 'exact', head: true });
      
      return { success: !error, error: error?.message, count: data };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  // 测试新配置
  const testSafeConfig = async () => {
    try {
      const { data, error } = await supabaseSafe
        .from('admins')
        .select('count', { count: 'exact', head: true });
      
      return { success: !error, error: error?.message, count: data };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  // 运行完整测试
  const runFullTest = async () => {
    setLoading(true);
    
    const [oldResult, safeResult] = await Promise.all([
      testOldConfig(),
      testSafeConfig()
    ]);

    // 比较结果
    const comparison = {
      bothWork: oldResult.success && safeResult.success,
      sameResult: JSON.stringify(oldResult) === JSON.stringify(safeResult),
      recommendation: ''
    };

    if (comparison.bothWork && comparison.sameResult) {
      comparison.recommendation = '✅ 新配置完全兼容，可以安全替换！';
    } else if (safeResult.success && !oldResult.success) {
      comparison.recommendation = '⚠️ 新配置正常但旧配置失败，建议使用新配置';
    } else if (!safeResult.success) {
      comparison.recommendation = '❌ 新配置有问题，请检查环境变量';
    } else {
      comparison.recommendation = '⚠️ 结果不一致，需要进一步检查';
    }

    setTestResults({
      oldConfig: oldResult,
      safeConfig: safeResult,
      comparison
    });
    
    setLoading(false);
  };

  useEffect(() => {
    runFullTest();
  }, []);

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <Card title="🔧 配置兼容性测试" extra={
        <Button type="primary" onClick={runFullTest} loading={loading}>
          重新测试
        </Button>
      }>
        <Alert
          message="配置迁移测试"
          description="此页面用于验证新的环境变量配置与原硬编码配置的兼容性。"
          type="info"
          showIcon
          style={{ marginBottom: 24 }}
        />

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <Spin size="large" tip="正在测试配置..." />
          </div>
        ) : (
          <>
            <Descriptions bordered column={1} style={{ marginBottom: 24 }}>
              <Descriptions.Item label="原配置 (硬编码)">
                <Space>
                  {testResults.oldConfig?.success ? (
                    <>
                      <CheckCircleOutlined style={{ color: '#52c41a' }} />
                      <span>连接成功</span>
                      <Tag color="success">正常</Tag>
                    </>
                  ) : (
                    <>
                      <CloseCircleOutlined style={{ color: '#f5222d' }} />
                      <span>连接失败</span>
                      <Tag color="error">{testResults.oldConfig?.error}</Tag>
                    </>
                  )}
                </Space>
              </Descriptions.Item>

              <Descriptions.Item label="新配置 (环境变量)">
                <Space>
                  {testResults.safeConfig?.success ? (
                    <>
                      <CheckCircleOutlined style={{ color: '#52c41a' }} />
                      <span>连接成功</span>
                      <Tag color="success">正常</Tag>
                    </>
                  ) : (
                    <>
                      <CloseCircleOutlined style={{ color: '#f5222d' }} />
                      <span>连接失败</span>
                      <Tag color="error">{testResults.safeConfig?.error}</Tag>
                    </>
                  )}
                </Space>
              </Descriptions.Item>

              <Descriptions.Item label="对比结果">
                <Space direction="vertical" style={{ width: '100%' }}>
                  <div>
                    两种配置都能工作: {testResults.comparison?.bothWork ? '✅ 是' : '❌ 否'}
                  </div>
                  <div>
                    返回结果一致: {testResults.comparison?.sameResult ? '✅ 是' : '❌ 否'}
                  </div>
                </Space>
              </Descriptions.Item>

              <Descriptions.Item label="建议">
                <Alert
                  message={testResults.comparison?.recommendation || '等待测试结果...'}
                  type={testResults.comparison?.bothWork ? 'success' : 'warning'}
                  showIcon
                />
              </Descriptions.Item>
            </Descriptions>

            {testResults.comparison?.bothWork && testResults.comparison?.sameResult && (
              <Alert
                message="下一步操作"
                description={
                  <div>
                    <p>配置验证通过！现在可以安全地进行迁移：</p>
                    <ol>
                      <li>先在一个测试页面中将 <code>import supabase from &apos;../config/supabase&apos;</code></li>
                      <li>替换为 <code>import supabase from &apos;../config/supabase-safe&apos;</code></li>
                      <li>测试功能是否正常</li>
                      <li>确认无误后，批量替换所有文件</li>
                    </ol>
                  </div>
                }
                type="success"
                showIcon
                style={{ marginTop: 24 }}
              />
            )}
          </>
        )}
      </Card>
    </div>
  );
};

export default TestSafeConfigPage;