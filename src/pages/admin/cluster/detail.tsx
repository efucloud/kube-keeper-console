import { PageContainer, ProDescriptions } from '@ant-design/pro-components';
import { useParams, useIntl, useNavigate, FormattedMessage, Access, useAccess } from '@umijs/max';
import { Card, Space, Button, Tooltip, Tag } from 'antd';
import { EditOutlined, QuestionCircleOutlined } from '@ant-design/icons';
import React, { useEffect, useState } from 'react';
import type { ClusterDetail } from '@/services/cluster.d';
import { getClusterById } from '@/services/cluster.api';
import { getColorPrimary } from '@/utils/global';

const ClusterDetailIndex: React.FC = () => {
  const access = useAccess();
  const navigate = useNavigate();
  const intl = useIntl();
  const params = useParams();
  const [info, setUserInfo] = useState<ClusterDetail>();
  const colorPrimary = getColorPrimary();
  const getUserInfo = async () => {
    const data = await getClusterById({ id: params.id || '' });
    setUserInfo(data as ClusterDetail);
  };
  const BaseAddress = `/admin/cluster`;
  useEffect(() => {
    getUserInfo();
  }, [params.id]);


  return (
    <PageContainer title={intl.formatMessage({ id: 'menu.cluster' })} header={{ breadcrumb: {}, onBack: () => window.history.back() }} >
      {info && <>
        <Card variant={'borderless'} >
          <ProDescriptions column={3} title={intl.formatMessage({ id: 'pages.detail.baseinfo' })}
            extra={
              <Space>
                <Access accessible={access.adminAccess === true}>
                  <Button type={'primary'} icon={<EditOutlined />} block
                    onClick={() => {
                      navigate(
                        {
                          pathname: `${BaseAddress}/update/${params.id}`,
                        },
                        { replace: true },
                      );
                    }}
                  ><FormattedMessage id="pages.operation.edit" /></Button>
                </Access>
              </Space>
            }>
            <ProDescriptions.Item label={intl.formatMessage({ id: 'model.cluster.name' })} >{info.name}</ProDescriptions.Item>
            <ProDescriptions.Item label={intl.formatMessage({ id: 'model.cluster.code' })} >{info.code}</ProDescriptions.Item>
            <ProDescriptions.Item copyable ellipsis label={intl.formatMessage({ id: 'model.cluster.apiserver' })} >{info.apiServer}</ProDescriptions.Item>
            <ProDescriptions.Item label={intl.formatMessage({ id: 'model.cluster.enable' })}
              valueEnum={{
                false: {
                  text: intl.formatMessage({ id: 'model.enable.false' }),
                  status: 'Error',
                },
                true: {
                  text: intl.formatMessage({ id: 'model.enable.true' }),
                  status: 'Success',
                },
              }}
            >{info?.enable}</ProDescriptions.Item>

          </ProDescriptions>
          <ProDescriptions column={1} >
            <ProDescriptions.Item valueType='textarea' label={intl.formatMessage({ id: 'model.cluster.description' })} >{info.description}</ProDescriptions.Item>
          </ProDescriptions>
        </Card>
        <Card variant={'borderless'} style={{ marginTop: 16 }} >
          <ProDescriptions column={3} title={<><FormattedMessage id='cluster.features' />&nbsp;&nbsp;<Tooltip color={colorPrimary} title={<FormattedMessage id='cluster.features.description' />}><QuestionCircleOutlined /></Tooltip></>}>
            <ProDescriptions.Item >{info.features?.map((item: string) => <Tag key={item}>{item}</Tag>)}</ProDescriptions.Item>
          </ProDescriptions>
        </Card>
      </>
      }
    </PageContainer>
  );
};
export default ClusterDetailIndex;



