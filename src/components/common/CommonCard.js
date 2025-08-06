
import React from 'react';
import { Card } from 'antd';

const CommonCard = ({
  title,
  extra,
  children,
  loading = false,
  bordered = true,
  size = 'default',
  style = {},
  className = '',
  ...props
}) => {
  return (
    <Card
      title={title}
      extra={extra}
      loading={loading}
      bordered={bordered}
      size={size}
      style={style}
      className={`common-card ${className}`}
      {...props}
    >
      {children}
    </Card>
  );
};

export default CommonCard;
