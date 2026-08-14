import { CloudUploadOutlined, CodeOutlined, InboxOutlined, QuestionCircleOutlined, } from '@ant-design/icons';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { ProCard, ProTable, StepsForm } from '@ant-design/pro-components';
import type { IIoK8sApimachineryPkgApisMetaV1ObjectMeta } from '@kubernetes-models/apimachinery/apis/meta/v1/ObjectMeta';
import Editor from '@monaco-editor/react';
import { FormattedMessage, useAccess, useIntl } from '@umijs/max';
import { Tooltip } from 'antd';
import {
  appendKubernetesViewQuery, getColorPrimary, getCurrentViewInfo, normalizeKubernetesPath } from '@/utils/global';

export const ClusterTerminal: React.FC = () => {
  const access = useAccess();
  const intl = useIntl();
  const colorPrimary = getColorPrimary();
  const { cluster } = getCurrentViewInfo();

  if (cluster !== '') {
    return (
      <Tooltip
        color={colorPrimary}
        title={<FormattedMessage id="cluster.terminal" />}
      >
        <CodeOutlined
          style={{
            color: colorPrimary,
            fontSize: 20,
            verticalAlign: 'middle',
          }}
          onClick={() => {
            window.open(normalizeKubernetesPath(appendKubernetesViewQuery('/kubernetes/cluster/terminal', { cluster })))
          }}
        />
      </Tooltip>
    );
  } else {
    return null;
  }
};
export default ClusterTerminal;
