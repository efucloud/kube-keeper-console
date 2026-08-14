import { ProDescriptions } from '@ant-design/pro-components';
import { Divider, Flex, message, TableProps, Tabs, Tag } from 'antd';
import { IIoK8sApiRbacV1PolicyRule, IIoK8sApiRbacV1RoleRef, IIoK8sApiRbacV1Subject, IIoK8sApiRbacV1AggregationRule } from 'kubernetes-models/rbac.authorization.k8s.io/v1';
import { useEffect, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import Editor from '@monaco-editor/react';
import * as yaml from 'js-yaml';
import { getHeight } from '@/utils/global';

export type RulesProps = {
  name?: string;
  rules: IIoK8sApiRbacV1PolicyRule[];
  aggregationRule?: IIoK8sApiRbacV1AggregationRule
}

export const RenderRules: React.FC<RulesProps> = (props) => {
  const [activeKey, setActiveKey] = useState<string>('rule');
  const [nodes, setNodes] = useState<React.ReactNode[]>([]);
  const intl = useIntl();
  useEffect(() => {
    let items = [] as React.ReactNode[];
    for (let i = 0; i < props.rules.length; i++) {
      const rule = props.rules[i];
      items.push(<><ProDescriptions column={3}>
        <ProDescriptions.Item key='APIGroups' label={'APIGroups'}> <Flex gap="4px 0" wrap>{rule.apiGroups ? rule.apiGroups?.map((item) => <Tag key={item}>{item || <FormattedMessage id='cluster.resource.role.APIGroups.empty' />}</Tag>) : <Tag key='empty'></Tag>}</Flex></ProDescriptions.Item>
        <ProDescriptions.Item key='Resources' label={'Resources'}> <Flex gap="4px 0" wrap>{rule.resources?.map((item) => <Tag key={item}>{item}</Tag>)}</Flex></ProDescriptions.Item>
        <ProDescriptions.Item key='Verbs' label={'Verbs'}> <Flex gap="4px 0" wrap>{rule.verbs?.map((item) => <Tag key={item}>{item}</Tag>)}</Flex></ProDescriptions.Item>
      </ProDescriptions>
        <Divider />
      </>
      )


    }
    setNodes(items);
  }, [props])

  const onChange = (key: string) => {
    setActiveKey(key);
  };
  const items = (): TableProps['items'] => {
    let tabs = [];
    tabs.push({
      label: <FormattedMessage id='cluster.role.rule' />,
      key: 'rule',
      children: <>
        {nodes}
      </>
    })
    if (props.aggregationRule) {
      const content = yaml.dump(JSON.parse(JSON.stringify(props.aggregationRule || {}, null, 2)))
      tabs.push({
        label: <FormattedMessage id='cluster.role.aggregationRule' />,
        key: 'aggregationRule',
        children: <><Editor
          key='aggregationRule'
          language='yaml'
          options={{
            readOnly: true,
            tabSize: 2,
            insertSpaces: true,
          }}
          height={getHeight(content)}
          theme="vs-dark"
          defaultValue={content}
          onMount={(editor, monaco) => {
            // 拦截键盘输入
            editor.onKeyDown((e) => {
              if (!editor.getOption(monaco.editor.EditorOption.readOnly)) return;
              // 阻止所有可能修改内容的按键（可选）
              if (!e.ctrlKey && !e.metaKey && !e.altKey) {
                e.preventDefault();
                // 可选：显示自定义提示（如 Tooltip、Toast）
                message.warning(intl.formatMessage({ id: 'pages.operation.write.forbbiden' }));
              }
            });
            // 拦截粘贴
            editor.onDidPaste(() => {
              if (editor.getOption(monaco.editor.EditorOption.readOnly)) {
                message.warning(intl.formatMessage({ id: 'pages.operation.paste.forbidden' }));
              }
            });
          }}
        /></>
      })
    }
    return tabs;
  };
  return (<>
    <>{props.name}</>
    <Tabs
      activeKey={activeKey}
      items={items()}
      onChange={onChange}
    />
  </>);
}
export type RoleBindingProps = {
  roleRef: IIoK8sApiRbacV1RoleRef;
  subjects: IIoK8sApiRbacV1Subject[];
}
export const RenderRoleBinding: React.FC<RoleBindingProps> = (props) => {
  const { roleRef, subjects } = props;
  return (<>
    <ProDescriptions
      style={{ marginBottom: 16 }}
      column={3}
      title={<FormattedMessage id='cluster.rolebinding.roleRef' />}
    >
      {roleRef.kind === 'Role' && <ProDescriptions.Item key='role' label={<FormattedMessage id='cluster.rolebinding.kind.Role' />}>{roleRef.kind}</ProDescriptions.Item>}
      {roleRef.kind === 'ClusterRole' && <ProDescriptions.Item key='clusterRole' label={<FormattedMessage id='cluster.rolebinding.kind.ClusterRole' />}>{roleRef.kind}</ProDescriptions.Item>}
      <ProDescriptions.Item key='name' label={<FormattedMessage id='cluster.rolebinding.name' />}>{roleRef.name}</ProDescriptions.Item>
      <ProDescriptions.Item key='apiGroup' label={<FormattedMessage id='cluster.rolebinding.apiGroup' />}>{roleRef.apiGroup}</ProDescriptions.Item>
    </ProDescriptions>
    {subjects && <ProDescriptions
      column={3}
      title={<FormattedMessage id='cluster.rolebinding.subjects' />}
    >
      {subjects.map((item: IIoK8sApiRbacV1Subject) => {
        return (<>
          {item.kind === 'User' && <ProDescriptions.Item key='user' label={<FormattedMessage id='cluster.rolebinding.subject.kind' />}><FormattedMessage id='cluster.rolebinding.subject.kind.User' /></ProDescriptions.Item>}
          {item.kind === 'Group' && <ProDescriptions.Item key='group' label={<FormattedMessage id='cluster.rolebinding.subject.kind' />}><FormattedMessage id='cluster.rolebinding.subject.kind.Group' /></ProDescriptions.Item>}
          {item.kind === 'ServiceAccount' && <ProDescriptions.Item key='sa' label={<FormattedMessage id='cluster.rolebinding.subject.kind' />}><FormattedMessage id='cluster.rolebinding.subject.kind.ServiceAccount' /></ProDescriptions.Item>}
          <ProDescriptions.Item key='name' label={<FormattedMessage id='cluster.rolebinding.subject.name' />}>{item.name}</ProDescriptions.Item>
          <ProDescriptions.Item key='namespace' label={<FormattedMessage id='cluster.rolebinding.subject.namespace' />}>{item.namespace}</ProDescriptions.Item>

        </>)
      })}
    </ProDescriptions>}
    { }
  </>);
}