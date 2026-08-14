import { ActionType, ModalForm, ProColumns, ProForm, ProFormDateTimePicker, ProFormSelect, ProFormText, ProFormTextArea, ProTable } from '@ant-design/pro-components';
import { FormattedMessage, useIntl } from '@umijs/max';
import { Row, Col, Divider, Space, Button, Popconfirm, message } from 'antd';
import React, { useRef, useState } from 'react';
export const BaseAddress = '/system/personal/token';
import { getColorPrimary, getCurrentViewInfo } from '@/utils/global';
import { OrgGitCredentialDetail } from '@/services/org_git_credential';
import { listGitCredentials, postGitCredentials, putGitCredentials } from '@/services/personal.api';
import { DeleteOutlined, EditFilled, EditOutlined } from '@ant-design/icons';
import type { IntlShape } from 'react-intl';
import { listOrgIntegrateGit } from '@/services/org_integrate_git.api';
import { OrgIntegrateGitDetail, OrgIntegrateGitDetailList } from '@/services/org_integrate_git';
const GitIndex: React.FC = () => {
  const colorPrimary = getColorPrimary();

  const [modalVisible, setModalVisible] = useState(false);
  const [selectedInfo, setSelectedInfo] = useState<OrgGitCredentialDetail>()
  const actionRef = useRef<ActionType>(null);
  /** 新建窗口的弹窗 */
  /** 国际化配置 */
  const intl = useIntl();

  const columns: ProColumns<OrgGitCredentialDetail>[] = [
    {
      title: intl.formatMessage({ id: 'integration.git.name' }),
      dataIndex: ['provider', 'name'],
    },
    {
      title: intl.formatMessage({ id: 'integration.git.url' }),
      dataIndex: ['provider', 'url'],
    },
    {
      title: intl.formatMessage({ id: 'model.user.username' }),
      dataIndex: ['username'],
    },
    {
      title: intl.formatMessage({ id: 'model.user.email' }),
      dataIndex: ['email'],
    },
    {
      title: <FormattedMessage id="pages.operation" />,
      dataIndex: 'option',
      search: false,
      align: 'center',
      render: (_, record) => {
        const nodes = [];
        nodes.push({
          key: record.id + '-edit',
          label: <EditOutlined onClick={() => {
            setSelectedInfo(record);
            setModalVisible(true)
          }} style={{ color: colorPrimary }} />,
        });
        return nodes;
      },
    },
  ]
  return (
    <>
      <ProTable<OrgGitCredentialDetail>
        actionRef={actionRef}
        pagination={false}
        search={false}
        columns={columns}
        request={listGitCredentials}
        locale={{
          emptyText: intl.formatMessage({
            id: 'pages.not.found.data',
          }),
        }}
        toolBarRender={() => [
          <Space separator={<Divider orientation="vertical" />}>
            <Button
              type="primary"
              key="create"
              onClick={() => {
                setModalVisible(true);
              }}
            >
              <FormattedMessage id="pages.operation.create" />
            </Button>
          </Space>
        ]}
      />
      <ModalForm
        title={selectedInfo?.id ? intl.formatMessage({ id: 'pages.operation.edit' }) : intl.formatMessage({ id: 'pages.operation.create' })}
        width="40vw"
        open={modalVisible}
        initialValues={selectedInfo || {}}
        clearOnDestroy={true}
        onOpenChange={setModalVisible}
        onFinish={async (values: Record<string, any>) => {
          if (selectedInfo?.id) {
            await postGitCredentials(values)
          } else {
            await putGitCredentials({ ...selectedInfo, ...values })
          }
          setModalVisible(false);
          actionRef.current?.reload();
        }}
        modalProps={{ maskClosable: true, destroyOnHidden: true, forceRender: true }}
      >
        <ProFormSelect
          label={intl.formatMessage({ id: 'integration.git' })}
          name="providerId"
          rules={[
            {
              required: true,
              message:
                intl.formatMessage({ id: 'pages.select.text.tips' }) +
                intl.formatMessage({ id: 'integration.git' }),
            },
          ]}
          request={async (values: Record<string, string>) => {
            const res = await listOrgIntegrateGit({ name: values?.keyWords || '' }) as OrgIntegrateGitDetailList;
            return (
              res.data?.map((item: OrgIntegrateGitDetail) => ({
                label: <Space>{item.name}</Space>,
                value: item.id,
              })) || []
            );
          }}
        />
        <ProFormText
          name="username"
          label={intl.formatMessage({ id: 'model.user.username' })}
          rules={[
            {
              required: true,
              message:
                intl.formatMessage({ id: 'pages.input.text.tips' }) +
                intl.formatMessage({ id: 'model.user.username' }),
            },
          ]} />
        <ProFormText
          name="email"
          label={intl.formatMessage({ id: 'model.user.email' })}
          rules={[
            {
              required: true,
              message:
                intl.formatMessage({ id: 'pages.input.text.tips' }) +
                intl.formatMessage({ id: 'model.user.email' }),
            },
          ]} />
        <ProFormDateTimePicker
          name="privateTime"
          label={intl.formatMessage({ id: 'integration.git.privateTime' })}
          rules={[
            {
              required: true,
              message:
                intl.formatMessage({ id: 'pages.select.text.tips' }) +
                intl.formatMessage({ id: 'integration.git.privateTime' }),
            },]} />

        <ProFormTextArea
          name="privateToken"
          label={intl.formatMessage({ id: 'integration.git.privateToken' })}
          rules={[
            {
              required: true,
              message:
                intl.formatMessage({ id: 'pages.input.text.tips' }) +
                intl.formatMessage({ id: 'integration.git.privateToken' }),
            },
          ]} />
      </ModalForm>
    </>
  );
};

export default GitIndex;
