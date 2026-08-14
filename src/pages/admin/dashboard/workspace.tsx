import type { ActionType } from '@ant-design/pro-components';
import { PageContainer, ProList } from '@ant-design/pro-components';
import { FormattedMessage, useIntl, useNavigate } from '@umijs/max';
import { Input, Tag, Typography } from 'antd';

const { Text, Paragraph, Link } = Typography;

import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import debounce from 'lodash/debounce';
import { type FC, useEffect, useRef, useState } from 'react';

dayjs.extend(relativeTime);

import type {
  WorkspaceDetail,
  WorkspaceDetailList,
} from '@/services/workspace';
import { listWorkspace } from '@/services/workspace.api';

const WorkspaceDashboard: React.FC = () => {
  const actionRef = useRef<ActionType>(null);
  const intl = useIntl();
  const navigate = useNavigate();
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');

  const [workspaces, setWorkspaces] = useState<WorkspaceDetail[]>([]);
  const listWorkspaces = async () => {
    const res = (await listWorkspace({
      search: search,
    })) as WorkspaceDetailList;
    if (res && res.data) {
      setWorkspaces(res.data);
    }
  };
  const debouncedHandleChange = debounce((value) => {
    setSearch(value);
    setTotal(0);
  }, 1000);
  useEffect(() => {
    listWorkspaces();
  }, [search]);
  return (
    <PageContainer
      title={false}
      content={
        <div style={{ textAlign: 'center' }}>
          <Input
            placeholder={intl.formatMessage({
              id: 'pages.input.name',
            })}
            size="large"
            allowClear={true}
            style={{ maxWidth: 522, width: '100%' }}
            onChange={(e) => {
              debouncedHandleChange(e.target.value);
            }}
          />
        </div>
      }
    >
      <ProList<WorkspaceDetail>
        showActions="hover"
        ghost={true}
        rowSelection={false}
        grid={{ gutter: 16, column: 1 }}
        locale={{
          emptyText: intl.formatMessage({ id: 'pages.not.found.data' }),
        }}
        onItem={(record: WorkspaceDetail) => {
          return {
            onMouseEnter: () => {
              // console.log(record);
            },
            onClick: () => {
              window.location.pathname = `/kubernetes/${record.code}/workplace`;
            },
          };
        }}
        pagination={{
          defaultPageSize: 10,
          showSizeChanger: true,
        }}
        metas={{
          title: {},
          subTitle: {},
          type: {},
          avatar: {},
          actions: {},
          content: {},
        }}
        dataSource={workspaces.map((item: WorkspaceDetail) => ({
          title: item.name,
          code: item.code,
          actions: [
            <a
              href={`/kubernetes/alert/list?workspaceId=${item.id}`}
              key="records"
            >
              <FormattedMessage id="model.workspace.alert.records" />
            </a>,
          ],
          subTitle: <Tag color="#5BD8A6">{item.code}</Tag>,
          avatar: '/xingzhuang.svg',
          content: (
            <Typography>
              <Paragraph>{item.name}</Paragraph>
            </Typography>
          ),
        }))}
      />
    </PageContainer>
  );
};

export default WorkspaceDashboard;
