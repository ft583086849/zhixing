import React from 'react';

const TestEnvPage = () => {
  return (
    <div style={{ padding: '20px' }}>
      <h2>环境变量测试</h2>
      <p>REACT_APP_ENABLE_NEW_STATS: {process.env.REACT_APP_ENABLE_NEW_STATS || 'undefined'}</p>
      <p>当前值: {process.env.REACT_APP_ENABLE_NEW_STATS === 'true' ? '启用新统计' : '使用旧统计'}</p>
    </div>
  );
};

export default TestEnvPage;