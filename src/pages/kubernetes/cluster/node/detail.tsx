import { PageContainer } from '@ant-design/pro-components';
import {
  FormattedMessage,
  Outlet,
  useIntl,
  useModel,
  useNavigate,
} from '@umijs/max';
import { Button, Card, Col, Divider, Row, Typography } from 'antd';
import React, { useEffect, useState } from 'react';

const { Text, Link, Title, Paragraph } = Typography;

import crypto from 'crypto';

const IndexDashboard: React.FC = () => {
  return (
    <PageContainer
      title={false}
      content={<div style={{ textAlign: 'center' }}>节点管理</div>}
    ></PageContainer>
  );
};

export default IndexDashboard;
