import { appendKubernetesViewQuery } from '@/utils/global';
import { WorkspaceDetail } from "@/services/workspace";
import { PageContainer } from "@ant-design/pro-components";
import { Welcome } from "@ant-design/x";
import { FormattedMessage, useIntl, useParams } from "@umijs/max";
import { Button, Card, Tabs } from "antd";
import { TabsProps } from "antd/lib";
import React, { useEffect, useState } from "react";


export const Console: React.FC = () => {

  const code = useParams().code || '';
  const intl = useIntl();
  const [info, setInfo] = useState<WorkspaceDetail>();


  return (<PageContainer title={false} >
    <Card>
      <Welcome
        variant="borderless"
        title={
          <>
            <FormattedMessage id='workspace' />:&nbsp;&nbsp;<span style={{ fontSize: 18 }}>{info?.name}({info?.code})</span>
          </>
        }
        description={<>{info?.description}</>}
        extra={<>
          <Button
            type="primary"
            style={{ float: 'right' }}
            onClick={() => { window.location.href = appendKubernetesViewQuery(`/kubernetes/workspace/${code}`); }}
          >
            <FormattedMessage id="pages.operation.back" />
          </Button>
        </>}
      />
    </Card>
    增加云IDE开发效能统计
  </PageContainer>)
}
export default Console;