import { CloudUploadOutlined, InboxOutlined, QuestionCircleOutlined } from '@ant-design/icons';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { ProTable, StepsForm } from '@ant-design/pro-components';
import type { IIoK8sApimachineryPkgApisMetaV1ObjectMeta } from '@kubernetes-models/apimachinery/apis/meta/v1/ObjectMeta';
import Editor from '@monaco-editor/react';
import { FormattedMessage, useAccess, useIntl } from '@umijs/max';
import type { RadioChangeEvent, UploadProps } from 'antd';
import { Badge, Button, Divider, Empty, Modal, message, Radio, Select, Tag, Tooltip, Upload } from 'antd';
import * as yaml from 'js-yaml';
import debounce from 'lodash/debounce';
import { useEffect, useRef, useState } from 'react';
import { clusterServerGroupsCheck } from '@/services/cluster.api';
import type { ClusterNamespaceDetail, ClusterNamespaceDetailList } from '@/services/cluster_namespace';
import { clusterPostProxy } from '@/services/cluster_proxy.api';
import type { ClusterServerGroupCheck, ClusterServerGroupChecks } from '@/services/kubernetes';
import { syncClusterNamespace } from '@/services/cluster.api';
import { canAccessClusterNamespaces } from '@/services/personal.api';
import { getColorPrimary, getCurrentViewInfo, getHeight, splitYamlFiles } from '@/utils/global';

const { Dragger } = Upload;
type ImportDataType = {
  key: string;
  kind: string;
  apiVersion: string;
  name: string;
  scope: 'Namespaced' | 'Cluster';
  namespace?: string;
  metadata?: IIoK8sApimachineryPkgApisMetaV1ObjectMeta;
  content: string;
  checkStatus: 'checkSuccess' | 'checkFailed' | 'uncheck';
  execStatus:
  | 'created'
  | 'createdFailed'
  | 'deleted'
  | 'deletedFailed'
  | 'unexec';
  invalid: boolean;
  plural: string;
  message?: string;
};
const getResourceInfo = (content: string): ImportDataType | undefined => {
  try {
    const resource = yaml.load(content);
    if (!resource || !(resource instanceof Object)) {
      return undefined;
    }
    resource.name = resource?.metadata?.name || '';
    return resource;
  } catch {
    return undefined;
  }
};

const stripMarkdownCodeFence = (raw: string): string => {
  const normalized = raw.replace(/\r\n/g, '\n').trim();
  if (!normalized.startsWith('```')) {
    return normalized;
  }
  const lines = normalized.split('\n');
  if (lines.length >= 2 && lines[0].trim().startsWith('```') && lines[lines.length - 1].trim() === '```') {
    return lines.slice(1, -1).join('\n').trim();
  }
  return normalized;
};

const splitImportDocuments = (raw: string): string[] => {
  const normalized = stripMarkdownCodeFence(raw || '');
  if (!normalized) {
    return [];
  }

  const strictDocs = splitYamlFiles(normalized);
  if (strictDocs.length > 0) {
    return strictDocs;
  }

  // Fallback: support separators with indentation or inline comments.
  return normalized
    .split(/^\s*---(?:\s+#.*)?\s*$/gm)
    .map((doc) => doc.trim())
    .filter((doc) => doc !== '');
};

const buildImportResourceList = (documents: string[]): ImportDataType[] => {
  const result: ImportDataType[] = [];
  for (let i = 0; i < documents.length; i++) {
    const item = getResourceInfo(documents[i]);
    if (
      item &&
      item.apiVersion !== '' &&
      item.kind != '' &&
      item.name != ''
    ) {
      item.key = `${item.apiVersion}/${item.kind}/${item.name}`;
      item.checkStatus = 'uncheck';
      item.execStatus = 'unexec';
      item.content = documents[i];
      try {
        const con = yaml.load(documents[i]);
        delete con?.metadata?.namespace;
        delete con?.metadata?.generation;
        delete con?.status;
        delete con?.metadata?.resourceVersion;
        delete con?.metadata?.selfLink;
        delete con?.metadata?.uid;
        delete con?.metadata?.finalizers;
        delete con?.metadata?.managedFields;
        delete con?.metadata?.creationTimestamp;
        item.content = yaml.dump(con);
      } catch { }
      result.push(item);
    }
  }
  return result;
};

const parseTextResources = (rawContent: string, mode: string): ImportDataType[] => {
  let data = '';
  if (mode === 'json') {
    try {
      data = yaml.dump(JSON.parse(rawContent || '{}'));
    } catch {
      return [];
    }
  } else {
    data = rawContent;
  }
  return buildImportResourceList(splitImportDocuments(data));
};

export const ClusterImport: React.FC = () => {
  const [importKey, setImportKey] = useState<string>('');
  const access = useAccess();
  const intl = useIntl();
  const colorPrimary = getColorPrimary();
  const { cluster, namespace } = getCurrentViewInfo();
  const [userNamespaces, setUserNamespaces] = useState<ClusterNamespaceDetail[]>([]);
  const [selectedNamespace, setSelectedNamespace] = useState<string>(namespace || '');
  const [content, setContent] = useState<string>('');
  const [visible, setVisible] = useState<boolean>(false);
  const [method, setMethod] = useState<string>('text');
  const [lang, setLang] = useState<string>('yaml');
  const [resources, setResources] = useState<ImportDataType[]>([]);
  const [checkResult, setCheckResult] = useState<ClusterServerGroupCheck[]>([]);
  const [files, setFiles] = useState<{ [key: string]: string }>({});
  const actionRef = useRef<ActionType>(null);
  const [step, setStep] = useState(0);
  const [searchNamespace, setSearchNamespace] = useState<string>('');
  const debouncedNamespaceChange = debounce((value) => { setSearchNamespace(value); }, 1000);
  const [batchDeploy, setBatchDeploy] = useState<boolean>(false);
  const onFinish = async () => { };
  const onMethodChange = (e: RadioChangeEvent) => {
    setMethod(e.target.value);
  };
  const syncNamespace = async () => {
    await syncClusterNamespace({
      cluster: cluster,
    });
  };
  const searchNamespaceList = async () => {
    const res = (await canAccessClusterNamespaces({
      cluster: cluster,
      search: searchNamespace,
    })) as ClusterNamespaceDetailList;
    setUserNamespaces(res.data || []);
  };

  useEffect(() => {
    searchNamespaceList();
  }, [searchNamespace]);
  useEffect(() => {
    const waitCheck = {} as Record<string, ClusterServerGroupCheck>;
    for (let i = 0; i < resources.length; i++) {
      waitCheck[`${resources[i].apiVersion}|${resources[i].kind}`] = {
        apiVersion: resources[i].apiVersion,
        kind: resources[i].kind,
      } as ClusterServerGroupCheck;
    }
    const waits = [] as ClusterServerGroupCheck[];
    const keys = Object.keys(waitCheck);
    for (let i = 0; i < keys.length; i++) {
      waits.push(waitCheck[keys[i]]);
    }
    setCheckResult(waits);
  }, [resources]);
  const checkClusterResource = async () => {
    const res = (await clusterServerGroupsCheck(
      { cluster },
      checkResult,
    )) as ClusterServerGroupChecks;
    setCheckResult(res);
    const results = {} as Record<string, ClusterServerGroupCheck>;
    for (let i = 0; i < res.length; i++) {
      results[`${res[i].apiVersion}|${res[i].kind}`] = res[
        i
      ] as ClusterServerGroupCheck;
    }
    const resList = resources;

    for (let i = 0; i < resList.length; i++) {
      const key = `${resList[i].apiVersion}|${resList[i].kind}`;
      const item = results[key];
      if (item) {
        resList[i].invalid = false;
        resList[i].scope = item.scope || 'Namespaced';
        resList[i].plural = item.plural || '';
        if (item.scope === 'Namespaced') {
          resList[i].namespace = selectedNamespace;
          resList[i].metadata.namespace = selectedNamespace;
          try {
            const con = yaml.load(resList[i].content);
            con.metadata.namespace = selectedNamespace;
            resList[i].content = yaml.dump(con);
          } catch { }
        }
      } else {
        resList[i].invalid = true;
      }
    }
    setResources(resList);
  };

  useEffect(() => {
    setResources(parseTextResources(content, lang));
  }, [content, lang]);

  const processFiles = (): boolean => {
    if (method === 'text') {
      const reList = parseTextResources(content, lang);
      setResources(reList);
      if (reList.length === 0) {
        message.error(
          `${intl.formatMessage({ id: 'cluster.resources.not.empty' })}; ${intl.formatMessage({ id: 'cluster.resources.format.check' })}`,
        );
        return false;
      }
      if (!selectedNamespace) {
        message.error(intl.formatMessage({ id: 'cluster.resources.import.namespace.required' }));
        return false;
      }
      return true;
    }

    const reList = [] as ImportDataType[];
    const keys = Object.keys(files);
    for (let i = 0; i < keys.length; i++) {
      try {
        let fileContent = '' as string;
        if (keys[i].endsWith('.json')) {
          fileContent = yaml.dump(JSON.parse(files[keys[i]] || '{}'));
        } else {
          fileContent = files[keys[i]];
        }
        const list = splitImportDocuments(fileContent);
        reList.push(...buildImportResourceList(list));
      } catch {
        message.error(intl.formatMessage({ id: 'cluster.resources.format.check' }));
        return false
      }
    }
    setResources(reList);
    if (reList.length === 0) {
      message.error(intl.formatMessage({ id: 'cluster.resources.import.file.required' }))
      return false
    }
    if (!selectedNamespace) {
      message.error(intl.formatMessage({ id: 'cluster.resources.import.namespace.required' }))
      return false
    }
    return true
  };
  const importResource = async (
    check: boolean,
    index: number,
    record: ImportDataType,
  ) => {
    let requestAddress = '';
    let api = 'api';
    if (record.apiVersion !== 'v1') {
      api = 'apis';
    }
    if (record.scope === 'Namespaced') {
      if (record.namespace === '') {
        record.invalid = true;
        if (check) {
          record.checkStatus = 'checkFailed';
        }
      }
      requestAddress = `${api}/${record.apiVersion}/namespaces/${record.namespace}/${record.plural}`;
    } else {
      requestAddress = `${api}/${record.apiVersion}/${record?.plural}`;
    }
    const params = {

      cluster: cluster,
      address: requestAddress,
    };
    if (check) {
      params['EfuTest'] = 'true';
    }
    const requestData = yaml.load(record.content);
    clusterPostProxy(params, requestData)
      .then((res) => {
        if (check) {
          const reslist = resources;
          reslist[index].checkStatus = 'checkSuccess';
          setResources((prev) =>
            prev
              .filter((item) => item.key !== reslist[index].key)
              .concat(reslist[index]),
          );
        } else {
          const reslist = resources;
          reslist[index].execStatus = 'created';
          setResources((prev) =>
            prev
              .filter((item) => item.key !== reslist[index].key)
              .concat(reslist[index]),
          );
        }
      })
      .catch((err) => {
        const { response } = err;
        record.message = response?.data?.message || '';
        record.invalid = true;
        if (check) {
          const reslist = resources;
          reslist[index].checkStatus = 'checkFailed';
          setResources((prev) =>
            prev
              .filter((item) => item.key !== reslist[index].key)
              .concat(reslist[index]),
          );
        } else {
          const reslist = resources;
          reslist[index].execStatus = 'createdFailed';
          setResources((prev) =>
            prev
              .filter((item) => item.key !== reslist[index].key)
              .concat(reslist[index]),
          );
        }
      })
      .finally(() => {
        actionRef.current?.reload();
      });
  };

  const onChange = (e: RadioChangeEvent) => {
    if (e.target.value === 'yaml') {
      if (content === undefined) {
        setContent('');
      } else {
        setContent(yaml.dump(JSON.parse(content) || {}));
      }
    } else if (e.target.value === 'json') {
      if (resources.length <= 1) {
        setContent(JSON.stringify(yaml.load(content), null, 2));
      }
    }
    if (resources.length > 1) {
      setLang('yaml');
    } else {
      setLang(e.target.value);
    }
  };
  const props: UploadProps = {
    name: 'file',
    multiple: true,
    accept: '.yaml,.yml,.json',
    action: undefined,
    onChange(info) {
      const fileDatas = files;
      for (let i = 0; i < info.fileList.length; i++) {
        info.fileList[i].originFileObj?.arrayBuffer().then((buffer) => {
          const te = new TextDecoder().decode(buffer);
          if (te) {
            fileDatas[info.fileList[i]?.originFileObj?.name] = te;
            setFiles(fileDatas);
          }
        });
      }
    },
    onRemove(info) {
      const fileDatas = files;
      delete fileDatas[info.name];
      setFiles(fileDatas);
    },
  };
  const expandedRowRender = (record: ImportDataType): React.ReactNode => {
    return (
      <>
        <Editor
          key={record.key}
          language="yaml"
          height={getHeight(record.content)}
          options={{
            readOnly: true,
            tabSize: 2,
            insertSpaces: true,
          }}
          theme="vs-dark"
          defaultValue={record.content}
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
        />
      </>
    );
  };
  const columns: ProColumns<ImportDataType>[] = [
    {
      title: <FormattedMessage id="cluster.resource.name" />,
      dataIndex: 'name',
    },
    {
      title: <FormattedMessage id="cluster.resource.scope" />,
      dataIndex: 'scope',
    },
    {
      title: <FormattedMessage id="cluster.namespace" />,
      dataIndex: 'namespace',
    },
    {
      title: <FormattedMessage id="cluster.resource.apiVersion" />,
      dataIndex: 'apiVersion',
    },
    {
      title: <FormattedMessage id="cluster.resource.kind" />,
      dataIndex: 'kind',
    },
    {
      title: <FormattedMessage id="cluster.resources.import.valid" />,
      dataIndex: 'invalid',
      hidden: step < 1,
      render: (dom, entity) => {
        if (entity.invalid) {
          return <FormattedMessage id="cluster.boolean.false" />;
        } else {
          return <FormattedMessage id="cluster.boolean.true" />;
        }
      },
    },
    {
      title: (
        <FormattedMessage id="cluster.resources.import.validate.resource.check.status" />
      ),
      dataIndex: 'checkStatus',
      hidden: step < 2,
      render: (dom, entity) => {
        if (entity.checkStatus === 'checkSuccess') {
          return (
            <Badge
              status="success"
              text={
                <FormattedMessage id="cluster.resources.import.status.checkSuccess" />
              }
            />
          );
        } else if (entity.checkStatus === 'checkFailed') {
          return (
            <>
              <Badge
                status="error"
                text={
                  <FormattedMessage id="cluster.resources.import.status.checkFailed" />
                }
              />
              &nbsp;&nbsp;
              <Tooltip color={colorPrimary} title={entity.message}>
                <QuestionCircleOutlined />
              </Tooltip>
            </>
          );
        } else {
          return (
            <Badge
              status="default"
              text={
                <FormattedMessage id="cluster.resources.import.status.uncheck" />
              }
            />
          );
        }
      },
    },
    {
      title: (
        <FormattedMessage id="cluster.resources.import.validate.resource.exec.status" />
      ),
      dataIndex: 'execStatus',
      hidden: step < 3,
      render: (dom, entity) => {
        if (entity.execStatus === 'created') {
          return (
            <Badge
              status="success"
              text={
                <FormattedMessage id="cluster.resources.import.status.execSuccess" />
              }
            />
          );
        } else if (entity.execStatus === 'createdFailed') {
          return (
            <>
              <Badge
                status="error"
                text={
                  <FormattedMessage id="cluster.resources.import.status.execFailed" />
                }
              />
              &nbsp;&nbsp;
              <Tooltip color={colorPrimary} title={entity.message}>
                <QuestionCircleOutlined />
              </Tooltip>
            </>
          );
        } else if (entity.execStatus === 'deleted') {
          return (
            <Badge
              status="success"
              text={
                <FormattedMessage id="cluster.resources.import.status.deleted" />
              }
            />
          );
        } else if (entity.execStatus === 'deletedFailed') {
          return (
            <Badge
              status="error"
              text={
                <FormattedMessage id="cluster.resources.import.status.deletedFailed" />
              }
            />
          );
        } else {
          return (
            <Badge
              status="default"
              text={
                <FormattedMessage id="cluster.resources.import.status.unexec" />
              }
            />
          );
        }
      },
    },
    {
      title: <FormattedMessage id="pages.operation" />,
      dataIndex: 'option',
      search: false,
      align: 'center',
      hidden: step > 2,
      render: (_, record) => {
        const nodes = [];
        nodes.push(
          <a
            className="danger"
            key="delete"
            onClick={() => {
              setResources(resources.filter((item) => item.key !== record.key));
            }}
          >
            <FormattedMessage id="pages.operation.delete" />
          </a>,
        );
        return nodes;
      },
    },
  ];
  if (cluster !== '') {
    return (
      <>
        <span
          onClick={() => {
            setVisible(true);
            setImportKey(importKey + 1);
            setFiles({});
            setResources([]);
          }}
        >
          <Tooltip
            color={colorPrimary}
            title={<FormattedMessage id="cluster.resources.import" />}
          >
            <CloudUploadOutlined
              style={{
                color: colorPrimary,
                fontSize: 20,
                verticalAlign: 'middle',
              }}
            />
          </Tooltip>
        </span>
        <Modal
          key={importKey}
          title={<FormattedMessage id="cluster.resources.import" />}
          width="90vw"
          open={visible}
          destroyOnHidden={true}
          onCancel={() => {
            setVisible(false);
            setContent('');
            setFiles({});
            setResources([]);
          }}
          onOk={() => {
            onFinish();
            setVisible(false);
            setContent('');
            setFiles({});
            setResources([]);
          }}
          footer={false}
        >
          <StepsForm
            submitter={{
              render: (props) => {
                if (props.step === 0) {
                  return (
                    <div>
                      <br />
                      <Button
                        onClick={() => {
                          if (processFiles()) {
                            props.onSubmit();
                            setStep(1);
                          };

                        }}
                        type="primary"
                      >
                        <FormattedMessage id="pages.operation.next" />
                      </Button>
                    </div>
                  );
                } else if (props.step === 1) {
                  return (
                    <div>
                      <br />
                      <Button
                        onClick={() => {
                          props.onPre();
                          setStep(0);
                        }}
                        type="primary"
                      >
                        <FormattedMessage id="pages.operation.prev" />
                      </Button>
                      &nbsp;&nbsp;
                      <Button
                        disabled={resources.length === 0}
                        onClick={() => {
                          checkClusterResource();
                          props.onSubmit();
                          setStep(2);
                        }}
                        type="primary"
                      >
                        <FormattedMessage id="pages.operation.next" />
                      </Button>
                    </div>
                  );
                } else if (props.step === 2) {
                  return (
                    <div>
                      <br />
                      <Button
                        onClick={() => {
                          props.onPre();
                          setStep(1);
                        }}
                        type="primary"
                      >
                        <FormattedMessage id="pages.operation.prev" />
                      </Button>
                      &nbsp;&nbsp;
                      <Button
                        disabled={resources.length === 0}
                        onClick={() => {
                          props.onSubmit();
                          setStep(3);
                        }}
                        type="primary"
                      >
                        <FormattedMessage id="pages.operation.next" />
                      </Button>
                    </div>
                  );
                } else if (props.step === 3) {
                  return (
                    <div>
                      <br />
                      <Button
                        onClick={() => {
                          props.onPre();
                          setStep(2);
                        }}
                        type="primary"
                      >
                        <FormattedMessage id="pages.operation.prev" />
                      </Button>

                    </div>
                  );
                }
                return null;
              },
            }}
          >
            <StepsForm.StepForm
              title={intl.formatMessage({ id: 'cluster.resources.import.input' })}
            >
              <div style={{ display: 'flex', alignContent: 'center' }}>
                <Radio.Group onChange={onMethodChange} value={method}>
                  <Radio value="text">
                    <FormattedMessage id="cluster.resources.import.text" />
                  </Radio>
                  <Radio value="file">
                    <FormattedMessage id="cluster.resources.import.file" />
                  </Radio>
                </Radio.Group>
                {resources.length > 0 && (
                  <Tag color={colorPrimary}>
                    <>
                      <FormattedMessage id="cluster.resources.number" />
                      :&nbsp; {resources.length || 0}
                    </>
                  </Tag>
                )}
                {resources.length == 0 && content !== '' && (
                  <Tag color="red">
                    <>
                      <FormattedMessage id="cluster.resources.not.empty" />
                      ;&nbsp; &nbsp;
                      <FormattedMessage id="cluster.resources.format.check" />
                    </>
                  </Tag>
                )}
                <>
                  <span>
                    <FormattedMessage id="cluster.resources.import.targetNamespace" />
                    :&nbsp;
                  </span>
                  <Select
                    showSearch={{
                      filterOption: false,
                      onSearch: (value) => {
                        debouncedNamespaceChange(value)
                      }
                    }}
                    notFoundContent={intl.formatMessage({ id: 'pages.no.data' })}
                    allowClear
                    placeholder={<FormattedMessage id="cluster.namespace.select" />}
                    size="small"
                    defaultValue={selectedNamespace}
                    style={{ minWidth: 300 }}
                    onChange={(value) => {
                      setSelectedNamespace(value);
                    }}
                    popupRender={(menu) => {
                      if (userNamespaces.length == 0) {
                        return (
                          <div style={{ padding: 16, textAlign: 'center' }}>
                            <Empty description={intl.formatMessage({ id: 'pages.no.data' })} image={Empty.PRESENTED_IMAGE_SIMPLE} />
                            <Button
                              type="primary"
                              onClick={syncNamespace}
                            >
                              <FormattedMessage id='cluster.namespace.sync' />
                            </Button>
                          </div>
                        );
                      }
                      return menu
                    }}
                  >
                    {userNamespaces?.map((item: ClusterNamespaceDetail) => {
                      return (
                        <Select.Option key={item.namespace} value={item.namespace}>
                          {item.namespace}
                        </Select.Option>
                      );
                    })}
                  </Select>

                </>
              </div>
              <Divider style={{ margin: 10 }} />
              {method === 'text' && (
                <>
                  {resources.length < 2 && (
                    <Radio.Group onChange={onChange} value={lang}>
                      <Radio value="yaml">Yaml</Radio>
                      <Radio value="json">Json</Radio>
                    </Radio.Group>
                  )}
                  <Editor
                    key={lang}
                    language={lang}
                    height="40vh"
                    options={{
                      tabSize: 2,
                      insertSpaces: true,
                    }}
                    theme="vs-dark"
                    onChange={(value) => {
                      setContent(value || '');
                    }}
                    defaultValue={content}
                  />
                </>
              )}
              {method === 'file' && (
                <>
                  <Dragger {...props}>
                    <p className="ant-upload-drag-icon">
                      <InboxOutlined />
                    </p>
                    <p className="ant-upload-text">
                      <FormattedMessage id="cluster.resources.import.file.method" />
                    </p>
                    <p className="ant-upload-hint">
                      <FormattedMessage id="cluster.resources.import.file.method.description" />
                    </p>
                  </Dragger>
                </>
              )}
            </StepsForm.StepForm>
            <StepsForm.StepForm
              title={intl.formatMessage({
                id: 'cluster.resources.import.preview',
              })}
            >
              <ProTable<ImportDataType>
                key='import-preview'
                scroll={{ x: 'max-content' }}
                rowKey="key"
                columns={columns}
                dataSource={resources}
                search={false}
                options={false}
                expandable={{ expandedRowRender: expandedRowRender }}
                pagination={{
                  showQuickJumper: true,
                  showSizeChanger: true,
                  locale: {
                    items_per_page: intl.formatMessage({
                      id: 'pages.pagination.items_per_page',
                    }),
                    jump_to: intl.formatMessage({
                      id: 'pages.pagination.jump_to',
                    }),
                    page: intl.formatMessage({ id: 'pages.pagination.page' }),
                  },
                }}
                locale={{
                  emptyText: intl.formatMessage({
                    id: 'pages.not.found.data',
                  }),
                }}
              />
            </StepsForm.StepForm>
            <StepsForm.StepForm
              title={intl.formatMessage({
                id: 'cluster.resources.import.validate.resource',
              })}
            >
              <ProTable<ImportDataType>
                key='validate-resource'
                scroll={{ x: 'max-content' }}
                actionRef={actionRef}
                rowKey="key"
                columns={columns}
                dataSource={resources}
                search={false}
                options={false}
                expandable={{ expandedRowRender: expandedRowRender }}
                pagination={{
                  showQuickJumper: true,
                  showSizeChanger: true,
                  locale: {
                    items_per_page: intl.formatMessage({
                      id: 'pages.pagination.items_per_page',
                    }),
                    jump_to: intl.formatMessage({
                      id: 'pages.pagination.jump_to',
                    }),
                    page: intl.formatMessage({ id: 'pages.pagination.page' }),
                  },
                }}
                locale={{
                  emptyText: intl.formatMessage({
                    id: 'pages.not.found.data',
                  }),
                }}
                toolBarRender={() => [
                  <Button
                    size="small"
                    key="check"
                    type="primary"
                    onClick={() => {
                      for (let i = 0; i < resources.length; i++) {
                        if (!resources[i].invalid) {
                          importResource(true, i, resources[i]);
                        }
                      }
                    }}
                  >
                    <FormattedMessage id="cluster.resources.import.batch.check" />
                  </Button>,
                ]}
              />
            </StepsForm.StepForm>

            <StepsForm.StepForm
              title={intl.formatMessage({
                id: 'cluster.resources.import.exec',
              })}
            >
              <ProTable<ImportDataType>
                key='import-exec'
                scroll={{ x: 'max-content' }}
                rowKey="key"
                columns={columns}
                dataSource={resources}
                search={false}
                options={false}
                expandable={{ expandedRowRender: expandedRowRender }}
                pagination={{
                  showQuickJumper: true,
                  showSizeChanger: true,
                  locale: {
                    items_per_page: intl.formatMessage({
                      id: 'pages.pagination.items_per_page',
                    }),
                    jump_to: intl.formatMessage({
                      id: 'pages.pagination.jump_to',
                    }),
                    page: intl.formatMessage({ id: 'pages.pagination.page' }),
                  },
                }}
                locale={{
                  emptyText: intl.formatMessage({ id: 'pages.not.found.data' }),
                }}
                toolBarRender={() => [
                  <Tooltip
                    color={colorPrimary}
                    title={intl.formatMessage({ id: 'cluster.resources.import.batch.exec.description' })}
                  >
                    <Button
                      size="small"
                      key="exec"
                      type="primary"
                      disabled={batchDeploy}
                      onClick={() => {
                        setBatchDeploy(true);
                        for (let i = 0; i < resources.length; i++) {
                          if (!resources[i].invalid) {
                            importResource(false, i, resources[i]);
                          }
                        }
                      }}
                    >
                      <FormattedMessage id="cluster.resources.import.batch.exec" />
                    </Button>
                  </Tooltip>

                ]}
              />
            </StepsForm.StepForm>
          </StepsForm>
        </Modal>
      </>
    );
  } else {
    return null;
  }
};
export default ClusterImport;
