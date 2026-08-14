import React, { useState } from 'react';
import {
  ProFormSwitch,
  ProFormSelect,
  ProFormText,
  ProFormDigit,
  ProFormGroup,
  ProFormList,
  ProFormTextArea,
} from '@ant-design/pro-components';
import { Row, Col, Divider, Tabs } from 'antd';
import { FormattedMessage, useIntl } from '@umijs/max';
import { getColorPrimary } from '@/utils/global';
import { IIoK8sApiCoreV1Probe } from 'kubernetes-models/v1';
import { CopyOutlined, DeleteFilled } from '@ant-design/icons';
const colorPrimary = getColorPrimary();
const checkOptions = [
  { label: <FormattedMessage id='cluster.resource.container.health.check.method.httpGet' />, value: 'httpGet' },
  { label: <FormattedMessage id='cluster.resource.container.health.check.method.exec' />, value: 'exec' },
  { label: <FormattedMessage id='cluster.resource.container.health.check.method.tcpSocket' />, value: 'tcpSocket' },
  { label: <FormattedMessage id='cluster.resource.container.health.check.method.grpc' />, value: 'grpc' }
];

type HealthCheckFormProps = {
  probe: IIoK8sApiCoreV1Probe | undefined,
  prefixField: string
}
const HealthCheckForm: React.FC<HealthCheckFormProps> = (props) => {
  const [healthCheckMethod, setHealthCheckMethod] = useState<string>('httpGet');
  const intl = useIntl();
  return (<>
    <Row gutter={64}  >
      <Col lg={12} md={12} sm={24}>
        <>
          <ProFormSelect
            name={[`${props.prefixField}`, 'healthCheckMethod']}
            fieldProps={{
              defaultValue: healthCheckMethod,
            }}
            label={<FormattedMessage id='cluster.resource.container.health.check.method' />}
            options={checkOptions}
            onChange={setHealthCheckMethod}
            rules={[{
              required: true, message: <><FormattedMessage id='pages.select.text.tips' />
                <FormattedMessage id='cluster.resource.container.health.check.method' /></>
            }]}
          />
          {healthCheckMethod === 'httpGet' &&
            <>
              <ProFormSelect
                name={[`${props.prefixField}`, 'httpGet', 'scheme']}
                label={<FormattedMessage id='cluster.resource.container.health.check.method.httpGet.schema' />}
                rules={[{
                  required: true, message: <><FormattedMessage id='pages.input.text.tips' />
                    <FormattedMessage id='cluster.resource.container.health.check.method.httpGet.schema' /></>
                }]}
                options={['HTTP', 'HTTPS']}
              />
              <ProFormText
                name={[`${props.prefixField}`, 'httpGet', 'path']}
                label={<FormattedMessage id='cluster.resource.container.health.check.method.httpGet.path' />}
                rules={[{
                  required: true, message: <><FormattedMessage id='pages.input.text.tips' />
                    <FormattedMessage id='cluster.resource.container.health.check.method.httpGet.path' /></>
                }]}
              />
              <ProFormDigit
                name={[`${props.prefixField}`, 'httpGet', 'port']}
                label={<FormattedMessage id='cluster.resource.container.health.check.method.httpGet.port' />}
                rules={[{
                  required: true, message: <><FormattedMessage id='pages.input.text.tips' />
                    <FormattedMessage id='cluster.resource.container.health.check.method.httpGet.port' /></>
                }]}
                placeholder='1-65535'
                min={1}
                max={65535}
              />
              <ProFormList
                name={[`${props.prefixField}`, 'httpGet', 'httpHeaders']}
                label={<FormattedMessage id='cluster.resource.container.health.check.method.httpGet.httpHeaders' />}
                initialValue={[]}
                deleteIconProps={{
                  Icon: DeleteFilled,
                }}
                copyIconProps={{ Icon: CopyOutlined }}
              >
                <ProFormGroup key="headers">
                  <ProFormText
                    name={['name']}
                    label={<FormattedMessage id='cluster.resource.container.health.check.method.httpGet.httpHeaders.key' />}
                  />
                  <ProFormText
                    name={['value']}
                    label={<FormattedMessage id='cluster.resource.container.health.check.method.httpGet.httpHeaders.value' />}
                  />
                </ProFormGroup>
              </ProFormList>
            </>
          }
          {healthCheckMethod === 'exec' && <>
            <ProFormTextArea
              name={[`${props.prefixField}`, 'exec', 'command']}
              label={<FormattedMessage id='cluster.resource.container.health.check.method.exec.command' />}
              placeholder={intl.formatMessage({ id: 'cluster.resource.container.health.check.method.exec.command.description' })}
              rules={[{
                required: true, message: <><FormattedMessage id='pages.input.text.tips' />
                  <FormattedMessage id='cluster.resource.container.health.check.method.exec.command' /></>
              }]}
            />
          </>}
          {healthCheckMethod === 'tcpSocket' && <>
            <ProFormText
              name={[`${props.prefixField}`, 'tcpSocket', 'host']}
              label={<FormattedMessage id='cluster.resource.container.health.check.method.tcpSocket.host' />}
              rules={[{
                required: true, message: <><FormattedMessage id='pages.input.text.tips' />
                  <FormattedMessage id='cluster.resource.container.health.check.method.tcpSocket.host' /></>
              }]}
            />
            <ProFormDigit

              name={[`${props.prefixField}`, 'tcpSocket', 'port']}
              label={<FormattedMessage id='cluster.resource.container.health.check.method.tcpSocket.port' />}
              rules={[{
                required: true, message: <><FormattedMessage id='pages.input.text.tips' />
                  <FormattedMessage id='cluster.resource.container.health.check.method.tcpSocket.port' /></>
              }]}
            />
          </>}
          {healthCheckMethod === 'grpc' && <>
            <ProFormText
              name={[`${props.prefixField}`, 'grpc', 'server']}
              label={<FormattedMessage id='cluster.resource.container.health.check.method.grpc.server' />}
              rules={[{
                required: true, message: <><FormattedMessage id='pages.input.text.tips' />
                  <FormattedMessage id='cluster.resource.container.health.check.method.grpc.server' /></>
              }]}
            />
            <ProFormDigit
              name={[`${props.prefixField}`, 'grpc', 'port']}
              label={<FormattedMessage id='cluster.resource.container.health.check.method.grpc.port' />}
              rules={[{
                required: true, message: <><FormattedMessage id='pages.input.text.tips' />
                  <FormattedMessage id='cluster.resource.container.health.check.method.grpc.port' /></>
              }]}
            />
          </>}
        </>
      </Col>
      <Col lg={12} md={12} sm={24}>
        <ProFormDigit
          name={[`${props.prefixField}`, 'initialDelaySeconds']}
          label={<FormattedMessage id='cluster.resource.container.health.check.initialDelaySeconds' />}
          tooltip={{
            color: colorPrimary,
            title: <FormattedMessage id='cluster.resource.container.health.check.initialDelaySeconds.tooltip' />,
          }}
          initialValue={5}
          min={0}
          fieldProps={{ precision: 0 }}
        />

        <ProFormDigit
          name={[`${props.prefixField}`, 'periodSeconds']}
          label={<FormattedMessage id='cluster.resource.container.health.check.periodSeconds' />}
          tooltip={{
            color: colorPrimary,
            title: <FormattedMessage id='cluster.resource.container.health.check.periodSeconds.tooltip' />,
          }}
        />
        <ProFormDigit
          name={[`${props.prefixField}`, 'failureThreshold']}
          label={<FormattedMessage id='cluster.resource.container.health.check.failureThreshold' />}
          tooltip={{
            color: colorPrimary,
            title: <FormattedMessage id='cluster.resource.container.health.check.failureThreshold.tooltip' />,
          }}
        />
        <ProFormDigit
          name={[`${props.prefixField}`, 'successThreshold']}
          label={<FormattedMessage id='cluster.resource.container.health.check.successThreshold' />}
          tooltip={{
            color: colorPrimary,
            title: <FormattedMessage id='cluster.resource.container.health.check.successThreshold.tooltip' />,
          }}
        />
        <ProFormDigit
          name={[`${props.prefixField}`, 'timeoutSeconds']}
          label={<FormattedMessage id='cluster.resource.container.health.check.timeoutSeconds' />}
          tooltip={{
            color: colorPrimary,
            title: <FormattedMessage id='cluster.resource.container.health.check.timeoutSeconds.tooltip' />,
          }}
        />

      </Col>
    </Row>
  </>)
};
export default HealthCheckForm