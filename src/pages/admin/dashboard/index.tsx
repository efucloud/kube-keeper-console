import { PageContainer } from '@ant-design/pro-components';
import {
  FormattedMessage,
  Outlet,
  useIntl,
  useModel,
  useNavigate,
} from '@umijs/max';
import { Button, Card, Col, Divider, Row, Typography } from 'antd';
import crypto from 'crypto';
import React, { useEffect, useState } from 'react';

const IndexDashboard: React.FC = () => {
  return (
    <PageContainer
      title={false}
      content={
        <div style={{ textAlign: 'center' }}>
          组织用户数量，工作空间数量，历史告警数量，近7天告警数量，近30天告警数量，近7天告警趋势，近30天告警趋势，当天告警数量，当天告警趋势
          已处理告警数量，未处理告警数量
        </div>
      }
    ></PageContainer>
  );
};

export default IndexDashboard;
