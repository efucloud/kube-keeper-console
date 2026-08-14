import { FormattedMessage, useIntl } from '@umijs/max';
import type { InputNumberProps } from 'antd';
import { Alert, InputNumber, Modal, message } from 'antd';
import React, { useState } from 'react';
import { clusterPatchProxy } from '@/services/cluster_proxy.api';
import type { PatchSubsetValue } from '@/services/common';
import { getClusterResource } from '@/utils/cluster';

export type PatchReplicasProps = {
  key: string;
  cluster: string;
  kind: string;
  name: string;
  address: string; //请求资源地址
  replicas: number;
  visible: boolean;
  setVisible: (visible: boolean) => void;
};

const PatchReplicas: React.FC<PatchReplicasProps> = (props) => {
  const intl = useIntl();
  const [visible, setVisible] = useState<boolean>(props.visible);
  const [replicas, setReplicas] = useState<number>(props.replicas);

  const onFinish = async () => {
    const patchs = {} as { [key: string]: string };
    const patchData = {} as PatchSubsetValue;
    patchData.path = `/spec/replicas`;
    patchData.value = replicas;
    patchData.op = 'replace';
    const params = {

      cluster: props.cluster,
      address: props.address,
    };
    await clusterPatchProxy(params, [patchData] as PatchSubsetValue[]);
    message.success(intl.formatMessage({ id: 'cluster.pages.operation.success' }));
    props.setVisible(false);
  };
  const onChange: InputNumberProps['onChange'] = (value) => {
    setReplicas(value as number);
  };
  return (
    <Modal
      okText={intl.formatMessage({ id: 'pages.operation.confirm' })}
      cancelText={intl.formatMessage({ id: 'pages.operation.cancel' })}
      key={props.key}
      title={<FormattedMessage id="cluster.patch.replicas" />}
      width="30vw"
      open={visible}
      onCancel={() => {
        setVisible(false);
        props.setVisible(false);
      }}
      onOk={() => {
        onFinish();
        setVisible(false);
      }}
    >
      <Alert
        title={
          <>
            {<FormattedMessage id="resource.cluster.owner" />}&nbsp;:&nbsp;
            {props.cluster}&nbsp;&nbsp;&nbsp;&nbsp;
            <FormattedMessage id="cluster.resource.kind" />
            &nbsp;:&nbsp;{getClusterResource(props.kind)}
            &nbsp;&nbsp;&nbsp;&nbsp;
            {<FormattedMessage id="cluster.resource.name" />}&nbsp;:&nbsp;
            {props.name}&nbsp;&nbsp;&nbsp;&nbsp;
          </>
        }
        type="warning"
      />
      <br />
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <span style={{ marginRight: '10px' }}>
          <FormattedMessage id="cluster.replicas" />
        </span>
        <InputNumber defaultValue={replicas} onChange={onChange} min={0} />
      </div>
    </Modal>
  );
};
export default PatchReplicas;
