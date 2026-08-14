import { DockerOutlined } from '@ant-design/icons';
import {
  ModalForm,
  nanoid,
  ProDescriptions,
  ProForm,
  ProFormCheckbox,
  ProFormDigit,
  type ProFormInstance,
  ProFormSelect,
  ProFormSwitch,
  ProFormText,
  ProFormTextArea,
} from '@ant-design/pro-components';
import { FormattedMessage, useIntl } from '@umijs/max';
import { Button, Col, Row, Tabs } from 'antd';
import {
  IIoK8sApiCoreV1ExecAction,
  IIoK8sApiCoreV1GRPCAction,
  IIoK8sApiCoreV1HTTPGetAction,
  IIoK8sApiCoreV1Probe,
  IIoK8sApiCoreV1TCPSocketAction,
  IIoK8sApiCoreV1Volume,
  IVolumeMount,
  type IContainer,
  type IEnvVar,
  type IIoK8sApiCoreV1Container,
  type IIoK8sApiCoreV1ContainerPort,
  type IIoK8sApiCoreV1EnvVar,
} from 'kubernetes-models/v1';
import React, { useEffect, useRef, useState } from 'react';
import { getColorPrimary } from '@/utils/global';
import FormContainerPort, { ContainerPortProps } from '@/pages/kubernetes/components/form_container_port';
import ContainerEnvList, { ContaineEnvProps } from '@/pages/kubernetes/components/form_container_env';
import { debounce } from 'lodash';
import { cpuToMillicores, memoryToGi, memoryToMi } from '@/utils/cluster';
import FormContainerVolumeMounts, { ContainerIVolumeMountProps } from '@/pages/kubernetes/components/form_container_volume_mount';
import { capabilitiesOptions } from '@/utils/options';
import { TabsProps } from 'antd/lib';
import HealthCheckForm from '@/pages/kubernetes/components/form_container_health';
import { FormIContainer } from '@/pages/kubernetes/components/form_kubernetes_resource';


type ContainerProps = {
  namespace: string;
  container: FormIContainer;
  containerNames: Record<string, string>;
  action: string;
  volumes: IIoK8sApiCoreV1Volume[];
  onValuesChange: (container: FormIContainer) => void;
  timezoneSync?: boolean;
};

export const FormContainer: React.FC<ContainerProps> = (props) => {
  const colorPrimary = getColorPrimary();
  const intl = useIntl();
  const [activeKey, setActiveKey] = useState<string>('base');
  const [imageSelectVisible, setImageSelectVisible] = useState<boolean>(false);
  const formRef = useRef<ProFormInstance>(undefined);
  const [container, setContainer] = useState<IIoK8sApiCoreV1Container>(props.container.IContainer);
  const [isInit, setIsInit] = useState<boolean>(props.container.isInit);
  const [envs, setEnvs] = useState<ContaineEnvProps[]>([]);
  const [resources, setResources] = useState<string[]>([]);
  const [activeHealthCheckKey, setHealthCheckActiveKey] = useState<string>('liveness');
  const [livenessEnable, setLivenessEnable] = useState<boolean>(false);
  const [readinessEnable, setReadinessEnable] = useState<boolean>(false);
  const [startupEnable, setStartupEnable] = useState<boolean>(false);

  useEffect(() => {
    if (props.container.IContainer.env) {
      const list = props.container?.IContainer.env?.map((item: IEnvVar) => {
        let result = {
          ...item,
          name: item.name,
          key: item.name,
        } as ContaineEnvProps;
        if (item.value) {
          result.valueType = 'direct'
        } else if (item.valueFrom?.configMapKeyRef) {
          result.valueType = 'configMapKeyRef'
        } else if (item.valueFrom?.secretKeyRef) {
          result.valueType = 'secretKeyRef'
        } else if (item.valueFrom?.fieldRef) {
          result.valueType = 'fieldRef'
        } else if (item.valueFrom?.resourceFieldRef) {
          result.valueType = 'resourceFieldRef'
        } else {
          result.valueType = 'direct'
        }
        return result;
      }) || [];
      setEnvs(list)
    }
  }, [props.container?.IContainer.env])

  const setPorts = (ports: Array<ContainerPortProps>) => {
    if (ports.length == 0 || !ports) {
      setContainer(prev => { const { ports, ...rest } = prev; return rest; });
    } else {
      let list = [] as IIoK8sApiCoreV1ContainerPort[];
      for (let i = 0; i < ports.length; i++) {
        let port = {
          containerPort: ports[i].containerPort
        } as IIoK8sApiCoreV1ContainerPort;
        if (ports[i].hostIP) {
          port.hostIP = ports[i].hostIP;
        }
        if (ports[i].hostPort) {
          port.hostPort = ports[i].hostPort;
        }
        if (ports[i].name) {
          port.name = ports[i].name;
        }
        if (ports[i].protocol) {
          port.protocol = ports[i].protocol;
        }
        list.push(port)
      }
      setContainer((prev) => ({ ...prev, ports: list }))
    }
  }

  const [volumeMounts, setVolumeMounts] = useState<ContainerIVolumeMountProps[]>(
    props.container.IContainer.volumeMounts?.map((item: IVolumeMount) => {
      return { ...item, key: nanoid() }
    }) || [],
  );
  useEffect(() => {
    if (volumeMounts.length == 0 || !volumeMounts) {
      setContainer(prev => { const { volumeMounts, ...rest } = prev; return rest; });
    } else {
      const list = [] as IVolumeMount[];
      for (let i = 0; i < volumeMounts.length; i++) {
        const { key, ...rest } = volumeMounts[i];
        let volumeMount = {
          name: rest.name,
          mountPath: rest.mountPath,
          mountPropagation: rest?.mountPropagation || 'None'
        } as IVolumeMount;
        if (rest?.readOnly && rest.readOnly === true) {
          volumeMount.readOnly = rest.readOnly
        } else {
          volumeMount.readOnly = false
        }
        if (rest?.subPath) {
          volumeMount.subPath = rest.subPath
        }
        if (rest?.subPathExpr) {
          volumeMount.subPathExpr = rest.subPathExpr
        }
        if (rest?.recursiveReadOnly) {
          volumeMount.recursiveReadOnly = rest.recursiveReadOnly
        }
        list.push(volumeMount)
      }
      setContainer((prev) => ({ ...prev, volumeMounts: list }))
    }
  }, [volumeMounts]);
  const formItemLayout = {
    labelCol: { span: 6 },
    wrapperCol: { span: 18 },
  };
  const imagePullPolicies = [
    {
      label: intl.formatMessage({
        id: 'cluster.resource.container.imagePullPolicy.Always',
      }),
      value: 'Always',
    },
    {
      label: intl.formatMessage({
        id: 'cluster.resource.container.imagePullPolicy.Never',
      }),
      value: 'Never',
    },
    {
      label: intl.formatMessage({
        id: 'cluster.resource.container.imagePullPolicy.IfNotPresent',
      }),
      value: 'IfNotPresent',
    },
  ];
  useEffect(() => {
    props.onValuesChange({
      IContainer: container,
      efuKey: props.container.efuKey,
      isInit: isInit
    } as FormIContainer);
  }, [container]);

  const checkExist = (rule: any, value: any, callback: any) => {
    const allNames = props.containerNames;
    delete allNames[props.container.efuKey];
    if (Object.values(allNames).includes(value)) {
      callback(intl.formatMessage({ id: 'cluster.resource.container.name.exist' }));
    } else {
      callback();
    }
  };

  const cpuLimitValueCheck = (rule: any, value: any, callback: any) => {
    const request = formRef.current?.getFieldValue('cpuRequest');
    if (value !== undefined && request !== undefined && value !== 0 && value < request) {
      callback(intl.formatMessage({ id: 'cluster.resource.container.resource.requestIsBiggerThanLimit' }));
    } else {
      callback();
    }
  };
  const memoryLimitValueCheck = (rule: any, value: any, callback: any) => {
    const request = formRef.current?.getFieldValue('memoryRequest');
    if (value !== undefined && request !== undefined && value !== 0 && value < request) {
      callback(intl.formatMessage({ id: 'cluster.resource.container.resource.requestIsBiggerThanLimit' }));
    } else {
      callback();
    }
  };
  const storageLimitValueCheck = (rule: any, value: any, callback: any) => {
    const request = formRef.current?.getFieldValue('ephemeralStorageRequest');
    if (value !== undefined && request !== undefined && value !== 0 && value < request) {
      callback(intl.formatMessage({ id: 'cluster.resource.container.resource.requestIsBiggerThanLimit' }));
    } else {
      callback();
    }
  };
  const cpuRequestValueCheck = (rule: any, value: any, callback: any) => {
    const limit = formRef.current?.getFieldValue('cpuLimit');
    if (value !== undefined && limit !== undefined && limit !== 0 && value > limit) {
      callback(intl.formatMessage({ id: 'cluster.resource.container.resource.requestIsBiggerThanLimit' }));
    } else {
      callback();
    }
  };
  const memoryRequestValueCheck = (rule: any, value: any, callback: any) => {
    const limit = formRef.current?.getFieldValue('memoryLimit');
    if (value !== undefined && limit !== undefined && limit !== 0 && value > limit) {
      callback(intl.formatMessage({ id: 'cluster.resource.container.resource.requestIsBiggerThanLimit' }));
    } else {
      callback();
    }
  };
  const storageRequestValueCheck = (rule: any, value: any, callback: any) => {
    const limit = formRef.current?.getFieldValue('ephemeralStorageLimit');
    if (value !== undefined && limit !== undefined && limit !== 0 && value > limit) {
      callback(intl.formatMessage({ id: 'cluster.resource.container.resource.requestIsBiggerThanLimit' }));
    } else {
      callback();
    }
  };
  function splitByLineAndTrim(input: string): string[] {
    return input
      .trim()                     // 去掉整个字符串首尾空白
      .split(/\r?\n/)            // 按换行符分割（兼容 Windows \r\n 和 Unix \n）
      .map(line => line.trim())  // 去掉每行首尾空白
      .filter(line => line !== ''); // 可选：过滤掉空行
  }

  const setContainerEnvs = (envs: ContaineEnvProps[]) => {
    setContainer((prev: IContainer) => {
      let allEnvs = [] as IIoK8sApiCoreV1EnvVar[];
      if (envs) {
        for (let i = 0; i < envs.length; i++) {
          let env = { name: envs[i].name } as IIoK8sApiCoreV1EnvVar;
          if (envs[i].value || envs[i].valueFrom) {
            if (envs[i].value) {
              env.value = envs[i].value
            } else {
              env.valueFrom = envs[i].valueFrom;
            }
            allEnvs.push(env)
          }
        }
      }
      const container = {
        ...prev,
        env: allEnvs
      };
      return container
    });
  }
  const debouncedOnValuesChange = debounce((_, values) => {
    if (values['liveness'] && values['liveness'].enable) {
      const liveness = values['liveness'];
      let probe = {} as IIoK8sApiCoreV1Probe;
      if (liveness?.httpGet) {
        const httpGet = liveness.httpGet
        probe.httpGet = {} as IIoK8sApiCoreV1HTTPGetAction;
        probe.httpGet.host = httpGet['host'] || undefined;
        probe.httpGet.path = httpGet['path'] || undefined;
        probe.httpGet.port = httpGet['port'] || undefined;
        probe.httpGet.scheme = httpGet['scheme'] || undefined;
        if (httpGet['httpHeaders'] && httpGet['httpHeaders'].length > 0) {
          probe.httpGet.httpHeaders = httpGet['httpHeaders'];
        }
      } else if (liveness?.exec) {
        probe.exec = {} as IIoK8sApiCoreV1ExecAction;
        const exec = liveness.exec
        probe.exec.command = exec['command'] || undefined
      } else if (liveness?.tcpSocket) {
        probe.tcpSocket = {} as IIoK8sApiCoreV1TCPSocketAction;
        const tcpSocket = liveness.tcpSocket
        probe.tcpSocket.host = tcpSocket['host'] || undefined
        probe.tcpSocket.port = tcpSocket['port'] || undefined
      } else if (liveness?.grpc) {
        probe.grpc = {} as IIoK8sApiCoreV1GRPCAction;
        const grpc = liveness.grpc
        probe.grpc.service = grpc['service'] || undefined
        probe.grpc.port = grpc['port'] || undefined
      }
      if (liveness['initialDelaySeconds']) {
        probe.initialDelaySeconds = Number(liveness['initialDelaySeconds'])
      } else {
        probe.initialDelaySeconds = 0
      }
      if (liveness['periodSeconds']) {
        probe.periodSeconds = Number(liveness['periodSeconds'])
      } else {
        probe.periodSeconds = 10
      }

      if (liveness['failureThreshold']) {
        probe.failureThreshold = Number(liveness['failureThreshold'])
      } else {
        probe.failureThreshold = 3
      }
      if (liveness['successThreshold']) {
        probe.successThreshold = Number(liveness['successThreshold'])
      } else {
        probe.successThreshold = 1
      }
      if (liveness['timeoutSeconds']) {
        probe.timeoutSeconds = Number(liveness['timeoutSeconds'])
      } else {
        probe.timeoutSeconds = 1
      }
      setContainer((prev: IContainer) => {
        return {
          ...prev,
          livenessProbe: probe,
        };
      });
    } else {
      setContainer((prev: IContainer) => {
        if (prev.livenessProbe) {
          const { livenessProbe, ...rest } = prev
          return {
            ...rest,
          };
        } else {
          return prev
        }
      });
    }
    if (values['readiness'] && values['readiness'].enable) {
      const readiness = values['readiness'];
      let probe = {} as IIoK8sApiCoreV1Probe;
      if (readiness?.httpGet) {
        const httpGet = readiness.httpGet
        probe.httpGet = {} as IIoK8sApiCoreV1HTTPGetAction;
        probe.httpGet.host = httpGet['host'] || undefined;
        probe.httpGet.path = httpGet['path'] || undefined;
        probe.httpGet.port = httpGet['port'] || undefined;
        probe.httpGet.scheme = httpGet['scheme'] || undefined;
        if (httpGet['httpHeaders'] && httpGet['httpHeaders'].length > 0) {
          probe.httpGet.httpHeaders = httpGet['httpHeaders'];
        }
      } else if (readiness?.exec) {
        probe.exec = {} as IIoK8sApiCoreV1ExecAction;
        const exec = readiness.exec
        probe.exec.command = exec['command'] || undefined
      } else if (readiness?.tcpSocket) {
        probe.tcpSocket = {} as IIoK8sApiCoreV1TCPSocketAction;
        const tcpSocket = readiness.tcpSocket
        probe.tcpSocket.host = tcpSocket['host'] || undefined
        probe.tcpSocket.port = tcpSocket['port'] || undefined
      } else if (readiness?.grpc) {
        probe.grpc = {} as IIoK8sApiCoreV1GRPCAction;
        const grpc = readiness.grpc
        probe.grpc.service = grpc['service'] || undefined
        probe.grpc.port = grpc['port'] || undefined
      }
      if (readiness['initialDelaySeconds']) {
        probe.initialDelaySeconds = Number(readiness['initialDelaySeconds'])
      } else {
        probe.initialDelaySeconds = 0
      }
      if (readiness['periodSeconds']) {
        probe.periodSeconds = Number(readiness['periodSeconds'])
      } else {
        probe.periodSeconds = 10
      }

      if (readiness['failureThreshold']) {
        probe.failureThreshold = Number(readiness['failureThreshold'])
      } else {
        probe.failureThreshold = 3
      }
      if (readiness['successThreshold']) {
        probe.successThreshold = Number(readiness['successThreshold'])
      } else {
        probe.successThreshold = 1
      }
      if (readiness['timeoutSeconds']) {
        probe.timeoutSeconds = Number(readiness['timeoutSeconds'])
      } else {
        probe.timeoutSeconds = 1
      }
      setContainer((prev: IContainer) => {
        return {
          ...prev,
          readinessProbe: probe,
        };
      });

    } else {
      setContainer((prev: IContainer) => {
        if (prev.readinessProbe) {
          const { readinessProbe, ...rest } = prev
          return {
            ...rest,
          };
        } else {
          return prev
        }
      });
    }
    if (values['startup'] && values['startup'].enable) {
      const startup = values['startup'];
      let probe = {} as IIoK8sApiCoreV1Probe;
      if (startup?.httpGet) {
        const httpGet = startup.httpGet
        probe.httpGet = {} as IIoK8sApiCoreV1HTTPGetAction;
        probe.httpGet.host = httpGet['host'] || undefined;
        probe.httpGet.path = httpGet['path'] || undefined;
        probe.httpGet.port = httpGet['port'] || undefined;
        probe.httpGet.scheme = httpGet['scheme'] || undefined;
        if (httpGet['httpHeaders'] && httpGet['httpHeaders'].length > 0) {
          probe.httpGet.httpHeaders = httpGet['httpHeaders'];
        }
      } else if (startup?.exec) {
        probe.exec = {} as IIoK8sApiCoreV1ExecAction;
        const exec = startup.exec
        probe.exec.command = exec['command'] || undefined
      } else if (startup?.tcpSocket) {
        probe.tcpSocket = {} as IIoK8sApiCoreV1TCPSocketAction;
        const tcpSocket = startup.tcpSocket
        probe.tcpSocket.host = tcpSocket['host'] || undefined
        probe.tcpSocket.port = tcpSocket['port'] || undefined
      } else if (startup?.grpc) {
        probe.grpc = {} as IIoK8sApiCoreV1GRPCAction;
        const grpc = startup.grpc
        probe.grpc.service = grpc['service'] || undefined
        probe.grpc.port = grpc['port'] || undefined
      }
      if (startup['initialDelaySeconds']) {
        probe.initialDelaySeconds = Number(startup['initialDelaySeconds'])
      } else {
        probe.initialDelaySeconds = 0
      }
      if (startup['periodSeconds']) {
        probe.periodSeconds = Number(startup['periodSeconds'])
      } else {
        probe.periodSeconds = 10
      }

      if (startup['failureThreshold']) {
        probe.failureThreshold = Number(startup['failureThreshold'])
      } else {
        probe.failureThreshold = 3
      }
      if (startup['successThreshold']) {
        probe.successThreshold = Number(startup['successThreshold'])
      } else {
        probe.successThreshold = 1
      }
      if (startup['timeoutSeconds']) {
        probe.timeoutSeconds = Number(startup['timeoutSeconds'])
      } else {
        probe.timeoutSeconds = 1
      }
      setContainer((prev: IContainer) => {
        return {
          ...prev,
          startupProbe: probe,
        };
      });
    } else {
      setContainer((prev: IContainer) => {
        if (prev.startupProbe) {
          const { startupProbe, ...rest } = prev
          return {
            ...rest,
          };
        } else {
          return prev
        }
      });
    }

    if (values['isInit'] !== undefined) {
      setIsInit(values['isInit'])
    }
    if (values['postStartExec']) {
      let postStartExec = values['postStartExec'].trim() as string;
      if (postStartExec.startsWith('[') && postStartExec.endsWith(']')) {
        const command = JSON.parse(postStartExec) as string[];
        if (command) {
          setContainer((prev) => ({
            ...prev, lifecycle:
              { ...prev.lifecycle, postStart: { exec: { command: command } } },
          }))
        }
      } else {

        setContainer((prev) => ({
          ...prev, lifecycle:
            { ...prev.lifecycle, postStart: { exec: { command: [postStartExec] } } },
        }))
      }
    } else {
      setContainer((prev) => {
        const { postStart, ...restLifecycle } = prev.lifecycle || {};
        return {
          ...prev,
          lifecycle: Object.keys(restLifecycle).length > 0 ? restLifecycle : undefined,
        };
      });
    }
    if (values['preStopExec']) {
      let preStopExec = values['preStopExec'].trim() as string;
      if (preStopExec.startsWith('[') && preStopExec.endsWith(']')) {
        const command = JSON.parse(preStopExec) as string[];
        if (command) {
          setContainer((prev) => ({
            ...prev, lifecycle:
              { ...prev.lifecycle, preStop: { exec: { command: command } } },
          }))
        }
      } else {
        setContainer((prev) => ({
          ...prev, lifecycle:
            { ...prev.lifecycle, preStop: { exec: { command: [preStopExec] } } },
        }))
      }
    } else {
      setContainer((prev) => {
        const { preStop, ...restLifecycle } = prev.lifecycle || {};
        return {
          ...prev,
          lifecycle: Object.keys(restLifecycle).length > 0 ? restLifecycle : undefined,
        };
      });
    }
    if (values['name'] != undefined) {
      setContainer((prev) => ({ ...prev, name: values['name'] }))
    }
    if (values['imagePullPolicy'] != undefined) {
      setContainer((prev) => ({ ...prev, imagePullPolicy: values['imagePullPolicy'] || 'Always' }))
    }
    if (values['containerStart'] != undefined) {
      if (values['containerStart'].length > 0) {
        if (values['containerStart'].includes('TTY')) {
          setContainer((prev) => ({ ...prev, tty: true }))
        } else {
          setContainer((prev) => ({ ...prev, tty: false }))
        }
        if (values['containerStart'].includes('Stdin')) {
          setContainer((prev) => ({ ...prev, stdin: true }))
        } else {
          setContainer((prev) => ({ ...prev, stdin: false }))
        }
      } else {
        setContainer((prev) => ({ ...prev, tty: false, stdin: false }))
      }
    }
    if (values['image'] != undefined && values['image'].trim().length > 0) {
      setContainer((prev) => ({ ...prev, image: values['image'].trim() }))
    } else {
      setContainer((prev) => { const { image, ...rest } = prev; return rest; });
    }
    if (values['command'] != undefined && values['command'].trim().length > 0) {
      setContainer((prev) => ({ ...prev, command: values['command'].trim() }))
    } else {
      setContainer((prev) => { const { command, ...rest } = prev; return rest; });
    }
    if (values['params'] != undefined) {
      const args = splitByLineAndTrim(values['params']);
      setContainer((prev) => ({ ...prev, args: args }))
    } else {
      setContainer((prev) => { const { args, ...rest } = prev; return rest; });
    }
    if (values['cpuRequest'] != undefined && values['cpuRequest'] != 0) {
      if (!resources.includes('requests.cpu')) {
        setResources(prev => [...prev, `requests.cpu`]);
      }
      // 如果有值，你可能想设置 cpu，而不是删除 —— 根据你的业务逻辑调整
      setContainer((prev) => ({
        ...prev,
        resources: {
          ...prev.resources,
          requests: {
            ...prev.resources?.requests,
            cpu: `${values['cpuRequest'] * 1000}m`
          },
        },
      }));
    } else {
      setResources(prev => prev.filter(item => item !== 'requests.cpu'));
      if (container.resources?.requests && container.resources?.requests['cpu']) {
        setContainer((prev: IContainer) => {
          const { cpu, ...restRequests } = prev.resources?.requests || {};
          return {
            ...prev,
            resources: {
              ...prev.resources,
              requests: Object.keys(restRequests).length > 0 ? restRequests : undefined,
            },
          };
        });
      }
    }
    if (values['cpuLimit'] != undefined && values['cpuLimit'] != 0) {
      if (!resources.includes('limits.cpu')) {
        setResources(prev => [...prev, `limits.cpu`]);
      }
      // 如果有值，你可能想设置 cpu，而不是删除 —— 根据你的业务逻辑调整
      setContainer((prev) => ({
        ...prev,
        resources: {
          ...prev.resources,
          limits: {
            ...prev.resources?.limits,
            cpu: `${values['cpuLimit'] * 1000}m`
          },
        },
      }));
    } else {
      setResources(prev => prev.filter(item => item !== 'limits.cpu'));
      if (container.resources?.limits && container.resources?.limits['cpu']) {
        setContainer((prev: IContainer) => {
          const { cpu, ...restLimits } = prev.resources?.limits || {};
          return {
            ...prev,
            resources: {
              ...prev.resources,
              limits: Object.keys(restLimits).length > 0 ? restLimits : undefined,
            },
          };
        });
      }
    }
    if (values['memoryRequest'] != undefined && values['memoryRequest'] != 0) {
      if (!resources.includes('requests.memory')) {
        setResources(prev => [...prev, `requests.memory`]);
      }
      // 如果有值，你可能想设置 cpu，而不是删除 —— 根据你的业务逻辑调整
      setContainer((prev) => ({
        ...prev,
        resources: {
          ...prev.resources,
          requests: {
            ...prev.resources?.requests,
            memory: `${values['memoryRequest']}Mi`
          },
        },
      }));
    } else {
      setResources(prev => prev.filter(item => item !== 'requests.memory'));
      if (container.resources?.requests && container.resources?.requests['memory']) {
        setContainer((prev: IContainer) => {
          const { memory, ...restRequests } = prev.resources?.requests || {};

          return {
            ...prev,
            resources: {
              ...prev.resources,
              requests: Object.keys(restRequests).length > 0 ? restRequests : undefined,
            },
          };
        });
      }
    }
    if (values['memoryLimit'] != undefined && values['memoryLimit'] != 0) {
      if (!resources.includes('limits.memory')) {
        setResources(prev => [...prev, `limits.memory`]);
      }
      // 如果有值，你可能想设置 cpu，而不是删除 —— 根据你的业务逻辑调整
      setContainer((prev) => ({
        ...prev,
        resources: {
          ...prev.resources,
          limits: {
            ...prev.resources?.limits,
            memory: `${values['memoryLimit']}Mi`
          },
        },
      }));
    } else {
      setResources(prev => prev.filter(item => item !== 'limits.memory'));
      if (container.resources?.limits && container.resources?.limits['memory']) {
        setContainer((prev: IContainer) => {
          const { memory, ...restLimits } = prev.resources?.limits || {};
          return {
            ...prev,
            resources: {
              ...prev.resources,
              limits: Object.keys(restLimits).length > 0 ? restLimits : undefined,
            },
          };
        });
      }
    }
    //---------
    if (values['ephemeralStorageRequest'] != undefined && values['ephemeralStorageRequest'] != 0) {
      if (!resources.includes('requests.ephemeral-storage')) {
        setResources(prev => [...prev, `requests.ephemeral-storage`]);
      }
      // 如果有值，你可能想设置 cpu，而不是删除 —— 根据你的业务逻辑调整
      setContainer((prev) => ({
        ...prev,
        resources: {
          ...prev.resources,
          requests: {
            ...prev.resources?.requests,
            'ephemeral-storage': `${values['ephemeralStorageRequest']}Gi`
          },
        },
      }));
    } else {
      setResources(prev => prev.filter(item => item !== 'requests.ephemeral-storage'));
      if (container.resources?.requests && container.resources?.requests['ephemeral-storage']) {
        setContainer((prev: IContainer) => {
          const { ['ephemeral-storage']: ephemeralStorage, ...restRequests } = prev.resources?.requests || {};
          return {
            ...prev,
            resources: {
              ...prev.resources,
              requests: Object.keys(restRequests).length > 0 ? restRequests : undefined,
            },
          };
        });
      }
    }
    if (values['ephemeralStorageLimit'] != undefined && values['ephemeralStorageLimit'] != 0) {
      if (!resources.includes('limits.ephemeral-storage')) {
        setResources(prev => [...prev, `limits.ephemeral-storage`]);
      }
      // 如果有值，你可能想设置 cpu，而不是删除 —— 根据你的业务逻辑调整
      setContainer((prev) => ({
        ...prev,
        resources: {
          ...prev.resources,
          limits: {
            ...prev.resources?.limits,
            'ephemeral-storage': `${values['ephemeralStorageLimit']}Gi`
          },
        },
      }));
    } else {
      setResources(prev => prev.filter(item => item !== 'limits.ephemeral-storage'));
      if (container.resources?.limits && container.resources?.limits['ephemeral-storage']) {
        setContainer((prev: IContainer) => {
          const { ['ephemeral-storage']: ephemeralStorage, ...restLimits } = prev.resources?.limits || {};
          return {
            ...prev,
            resources: {
              ...prev.resources,
              limits: Object.keys(restLimits).length > 0 ? restLimits : undefined,
            },
          };
        });
      }
    }
    if (values['runAsGroup']) {
      setContainer((prev) => ({
        ...prev, securityContext: {
          ...prev.securityContext,
          runAsGroup: Number(values['runAsGroup'])
        }
      }))
    } else {
      setContainer((prev: IContainer) => {
        const { securityContext } = prev;
        const rest = securityContext ? { ...securityContext } : {};
        delete rest.runAsGroup; // 安全删除，即使不存在也不报错
        return {
          ...prev,
          securityContext: Object.keys(rest).length > 0 ? rest : undefined,
        };
      });
    }
    if (values['runAsUser']) {
      setContainer((prev) => ({
        ...prev, securityContext: {
          ...prev.securityContext,
          runAsUser: Number(values['runAsGroup'])
        }
      }))
    } else {
      setContainer((prev: IContainer) => {
        const { securityContext } = prev;
        const rest = securityContext ? { ...securityContext } : {};
        delete rest.runAsUser; // 安全删除，即使不存在也不报错
        return {
          ...prev,
          securityContext: Object.keys(rest).length > 0 ? rest : undefined,
        };
      });
    }
    if (values['privileged']) {
      setContainer((prev) => ({
        ...prev, securityContext: {
          ...prev.securityContext,
          privileged: Boolean(values['privileged'])
        }
      }))
    } else {
      setContainer((prev: IContainer) => {
        const { securityContext } = prev;
        const rest = securityContext ? { ...securityContext } : {};
        delete rest.privileged; // 安全删除，即使不存在也不报错
        return {
          ...prev,
          securityContext: Object.keys(rest).length > 0 ? rest : undefined,
        };
      });
    }
    if (values['runAsNonRoot']) {
      setContainer((prev) => ({
        ...prev, securityContext: {
          ...prev.securityContext,
          runAsNonRoot: Boolean(values['runAsNonRoot'])
        }
      }))
    } else {
      setContainer((prev: IContainer) => {
        const { securityContext } = prev;
        const rest = securityContext ? { ...securityContext } : {};
        delete rest.runAsNonRoot; // 安全删除，即使不存在也不报错
        return {
          ...prev,
          securityContext: Object.keys(rest).length > 0 ? rest : undefined,
        };
      });
    }
    if (values['capabilitiesDrop']) {
      setContainer((prev) => ({
        ...prev, securityContext: {
          ...prev.securityContext,
          capabilities: {
            add: prev.securityContext?.capabilities?.add || undefined,
            drop: values['capabilitiesDrop'] as Array<string>,
          }
        }
      }))
    } else {
      setContainer((prev) => ({
        ...prev, securityContext: {
          ...prev.securityContext,
          capabilities: {
            add: prev.securityContext?.capabilities?.add || undefined,
            drop: undefined,
          }
        }
      }))
    }
    if (values['capabilitiesAdd']) {
      setContainer((prev) => ({
        ...prev, securityContext: {
          ...prev.securityContext,
          capabilities: {
            drop: prev.securityContext?.capabilities?.drop || undefined,
            add: values['capabilitiesAdd'] as Array<string>,
          }
        }
      }))
    } else {
      setContainer((prev) => ({
        ...prev, securityContext: {
          ...prev.securityContext,
          capabilities: {
            drop: prev.securityContext?.capabilities?.drop || undefined,
            add: undefined,
          }
        }
      }))
    }
  }, 1000);

  const healthCheckItems: TabsProps['items'] = [
    {
      label: <FormattedMessage id='cluster.resource.container.health.livenessProbe' />,
      key: 'liveness',
      children: <>
        <Row gutter={64} key='liveness'>
          <Col lg={12} md={12} sm={24}>
            <ProFormSwitch
              name={['liveness', "enable"]}
              fieldProps={{
                defaultValue: livenessEnable
              }}
              onChange={setLivenessEnable}
              label={<FormattedMessage id='pages.operation.enable' />}
            />
          </Col>
        </Row>
        {livenessEnable && <HealthCheckForm
          prefixField='liveness'
          probe={props.container.IContainer.livenessProbe}
        />}
      </>
    },
    {
      label: <FormattedMessage id='cluster.resource.container.health.readinessProbe' />,
      key: 'readiness',
      children: <>
        <Row gutter={64} key='readiness'>
          <Col lg={12} md={12} sm={24}>
            <ProFormSwitch
              name={['readiness', "enable"]}
              fieldProps={{
                defaultValue: readinessEnable
              }}
              onChange={setReadinessEnable}
              label={<FormattedMessage id='pages.operation.enable' />}
            />
          </Col>
        </Row>
        {readinessEnable && <HealthCheckForm
          prefixField='readiness'
          probe={props.container.IContainer.readinessProbe}
        />}
      </>
    },
    {
      label: <FormattedMessage id='cluster.resource.container.health.startupProbe' />,
      key: 'startup',
      children: <>
        <Row gutter={64} key='startup'>
          <Col lg={12} md={12} sm={24}>
            <ProFormSwitch
              name={['startup', "enable"]}
              fieldProps={{
                defaultValue: startupEnable
              }}
              onChange={setStartupEnable}
              label={<FormattedMessage id='pages.operation.enable' />}
            />
          </Col>
        </Row>
        {startupEnable && <HealthCheckForm
          prefixField='startup'
          probe={props.container.IContainer.startupProbe}
        />}
      </>
    },
  ];
  return (
    <>
      <ProForm
        formRef={formRef}
        submitter={false}
        request={async () => {
          return { ...props.container.IContainer, isInit: isInit }
        }}
        onValuesChange={(_, allValues) => { debouncedOnValuesChange(_, allValues) }}
        {...formItemLayout}
        layout='horizontal'
      >
        <Tabs
          key='container'
          tabBarGutter={2}
          tabPlacement="start"
          onChange={(key) => { setActiveKey(key); }}
          activeKey={activeKey}
          items={[
            {
              label: intl.formatMessage({ id: 'cluster.resource.container.form.base' }),
              key: `base`,
              children: (
                <div>
                  <Row gutter={64}>
                    <Col lg={12} md={12} sm={24} >
                      <ProFormText
                        layout='vertical'
                        label={intl.formatMessage({ id: 'cluster.resources.pod.container.name' })}
                        name="name"
                        rules={[
                          {
                            max: 255,
                            message: intl.formatMessage({ id: 'pages.input.text.max.length' }, { max: 255 }),
                          },
                          {
                            required: true,
                            message:
                              intl.formatMessage({ id: 'pages.input.text.tips' }) +
                              intl.formatMessage({ id: 'cluster.resources.pod.container.name' }),
                          },
                          {
                            message: <FormattedMessage id="cluster.resource.data.format.invalid" />,
                            pattern: /^[a-z0-9]([-a-z0-9]*[a-z0-9])?$/,
                          },
                          { validator: checkExist },
                        ]}
                        placeholder={`${intl.formatMessage({ id: 'pages.input.example' })}: eucloud-container`}
                      />
                    </Col>
                    <Col lg={12} md={12} sm={24} >
                      <ProFormSelect
                        label={intl.formatMessage({ id: 'cluster.resource.container.imagePullPolicy' })}
                        name="imagePullPolicy"
                        options={imagePullPolicies}
                        rules={[
                          {
                            required: true,
                            message:
                              intl.formatMessage({ id: 'pages.input.text.tips' }) +
                              intl.formatMessage({ id: 'cluster.resource.container.imagePullPolicy' }),
                          },
                        ]}
                      />
                    </Col>
                  </Row>
                  <Row gutter={64} >
                    <Col lg={12} md={12} sm={12}>
                      <ProFormSwitch
                        fieldProps={{
                          defaultValue: props.container.isInit,
                        }}
                        label={intl.formatMessage({ id: 'cluster.resource.container.isInit' })}
                        name="isInit"
                      />
                    </Col>
                  </Row>
                  <Row gutter={64} >
                    <Col lg={12} md={12} sm={12}>
                      <ProFormCheckbox.Group
                        label={intl.formatMessage({ id: 'cluster.resource.container.start' })}
                        name="containerStart"
                        layout="horizontal"
                        options={['TTY', 'Stdin']}
                      />
                    </Col>

                  </Row>
                  <Row gutter={64} >
                    <Col lg={12} md={12} sm={24} offset={0} >
                      <ProFormText
                        label={intl.formatMessage({
                          id: 'cluster.resources.pod.container.image',
                        })}
                        name="image"
                        width={750}
                        rules={[
                          {
                            required: true,
                            message:
                              intl.formatMessage({ id: 'pages.input.text.tips' }) + intl.formatMessage({ id: 'cluster.resources.pod.container.image' }),
                          },
                        ]}
                        fieldProps={{
                          suffix: (<Button
                            style={{ color: colorPrimary, fontSize: 12 }}
                            icon={<DockerOutlined style={{ color: colorPrimary }} />}
                            size='small'
                            type='text'
                            onClick={() => setImageSelectVisible(true)}
                          >
                            <FormattedMessage id="cluster.resource.container.image.select" />
                          </Button>)
                        }}
                      />
                    </Col>
                  </Row>
                  <Row gutter={64} >
                    <Col lg={12} md={12} sm={24} offset={0}>
                      <ProFormText
                        width={750}
                        label={intl.formatMessage({ id: 'cluster.resource.container.form.start.command' })}
                        placeholder={intl.formatMessage({ id: 'cluster.resource.container.form.start.command.placeholder' })}
                        name="command"
                      />
                    </Col>
                  </Row>
                  <Row gutter={64} >
                    <Col lg={12} md={12} sm={24} offset={0}>
                      <ProFormTextArea
                        label={intl.formatMessage({ id: 'cluster.resource.container.form.start.params' })}
                        placeholder={intl.formatMessage({ id: 'cluster.resource.container.form.start.params.placeholder' })}
                        name="params"
                      />
                    </Col>
                  </Row>
                </div>
              ),
            },
            {
              label: intl.formatMessage({ id: 'cluster.resource.container.form.port' }),
              key: `port`,
              children: (
                <div>
                  <Row gutter={16} style={{ marginBottom: 16 }}>
                    <Col lg={24} md={24} sm={24}>
                      <FormContainerPort
                        ports={
                          props.container.IContainer.ports?.map((item) => {
                            return {
                              ...item,
                              key: nanoid(),
                            };
                          }) || []
                        }
                        setPorts={setPorts} />
                    </Col>
                  </Row>
                </div>
              ),
            },
            {
              label: intl.formatMessage({ id: 'cluster.resource.container.form.resource' }),
              key: `resource`,
              children: (
                <div>
                  <Row gutter={64}>
                    <Col lg={12} md={12} sm={24} >
                      <ProFormDigit
                        fieldProps={{
                          precision: 2,     // ✅ 保留2位小数
                          step: 0.01,       // ✅ 步长0.01，支持点击增减小数
                          defaultValue: cpuToMillicores(props.container.IContainer.resources?.requests ? props.container.IContainer.resources?.requests['cpu'] : 0)
                        }}
                        rules={[
                          {
                            validator: cpuRequestValueCheck,
                          },
                        ]}
                        allowClear
                        label={intl.formatMessage({ id: 'cluster.resource.container.resource.cpu.request' })}
                        name="cpuRequest"
                        addonAfter="Cores"
                        max={2000}
                      />
                    </Col>
                    <Col lg={12} md={12} sm={24} >
                      <ProFormDigit
                        allowClear
                        label={intl.formatMessage({ id: 'cluster.resource.container.resource.cpu.limit' })}
                        name="cpuLimit"
                        fieldProps={{
                          precision: 2,     // ✅ 保留2位小数
                          step: 0.01,       // ✅ 步长0.01，支持点击增减小数
                          defaultValue: cpuToMillicores(props.container.IContainer.resources?.limits ? props.container.IContainer.resources?.limits['cpu'] : 0)
                        }}
                        rules={[
                          {
                            validator: cpuLimitValueCheck,
                          },
                        ]}
                        addonAfter="Cores"
                        max={2000}
                      />
                    </Col>

                    <Col lg={12} md={12} sm={24} >
                      <ProFormDigit
                        allowClear
                        label={intl.formatMessage({ id: 'cluster.resource.container.resource.memory.request' })}
                        name="memoryRequest"
                        fieldProps={{
                          defaultValue: memoryToMi(props.container.IContainer.resources?.requests ? props.container.IContainer.resources?.requests['memory'] : 0)
                        }}
                        rules={[
                          {
                            validator: memoryRequestValueCheck,
                          },
                        ]}
                        addonAfter="MiB"
                        max={2097152}
                      />
                    </Col>
                    <Col lg={12} md={12} sm={24} >
                      <ProFormDigit
                        allowClear
                        label={intl.formatMessage({ id: 'cluster.resource.container.resource.memory.limit' })}
                        name="memoryLimit"
                        fieldProps={{
                          defaultValue: memoryToMi(props.container.IContainer.resources?.limits ? props.container.IContainer.resources?.limits['memory'] : 0)
                        }}
                        rules={[
                          {
                            validator: memoryLimitValueCheck,
                          },
                        ]}
                        addonAfter="MiB"
                        max={2097152}
                      />
                    </Col>
                    <Col lg={12} md={12} sm={24} >
                      <ProFormDigit
                        allowClear
                        label={intl.formatMessage({ id: 'cluster.resource.container.resource.ephemeralStorage.request' })}
                        name="ephemeralStorageRequest"
                        fieldProps={{
                          precision: 1,
                          step: 0.1,
                          defaultValue: memoryToGi(props.container.IContainer.resources?.requests ? props.container.IContainer.resources?.requests['ephemeral-storage'] : 0)
                        }}
                        rules={[
                          {
                            validator: storageRequestValueCheck,
                          },
                        ]}
                        addonAfter="GiB"
                        max={2097152}
                      />
                    </Col>
                    <Col lg={12} md={12} sm={24} >
                      <ProFormDigit
                        allowClear
                        label={intl.formatMessage({ id: 'cluster.resource.container.resource.ephemeralStorage.limit' })}
                        name="ephemeralStorageLimit"
                        fieldProps={{
                          precision: 1,
                          step: 0.1,
                          defaultValue: memoryToGi(props.container.IContainer.resources?.limits ? props.container.IContainer.resources?.limits['ephemeral-storage'] : 0)
                        }}
                        rules={[
                          {
                            validator: storageLimitValueCheck,
                          },
                        ]}
                        addonAfter="GiB"
                        max={2097152}
                      />
                    </Col>
                  </Row>
                </div>
              ),
            },
            {
              label: intl.formatMessage({
                id: 'cluster.resource.container.form.env',
              }),
              key: `env`,
              children: <div>
                <Row gutter={16} style={{ marginBottom: 16 }}>
                  <Col lg={24} md={24} sm={24}>
                    <ContainerEnvList namespace={props.namespace} envs={envs} setEnvs={setContainerEnvs} containerResource={resources} />
                  </Col>
                </Row>
              </div>,
            },
            {
              label: intl.formatMessage({ id: 'cluster.resource.container.form.lifeCycle' }),
              key: `lifeCycle`,
              children: <div>
                <Row gutter={64}>
                  <Col span={12} >
                    <ProFormTextArea
                      name='postStartExec'
                      fieldProps={{ defaultValue: props.container.IContainer?.lifecycle?.postStart?.exec?.command }}
                      label={intl.formatMessage({ id: 'cluster.resource.container.lifecyle.postStart' })}
                    />
                  </Col>
                  <Col span={12} >
                    <ProFormTextArea
                      name='preStopExec'
                      fieldProps={{ defaultValue: props.container.IContainer?.lifecycle?.preStop?.exec?.command }}
                      label={intl.formatMessage({ id: 'cluster.resource.container.lifecyle.preStop' })}
                    />
                  </Col>
                  <Col span={24}>
                    <ProDescriptions column={1}>
                      <ProDescriptions.Item valueType='code' label={intl.formatMessage({ id: 'cluster.resource.example' }) + '1'}>{`echo hello world`}</ProDescriptions.Item>
                      <ProDescriptions.Item valueType='code' label={intl.formatMessage({ id: 'cluster.resource.example' }) + '2'}>{`["/bin/sh", "-c", "echo hello world"]`}</ProDescriptions.Item>
                    </ProDescriptions>
                  </Col>
                </Row>
              </div>,
            },
            {
              label: intl.formatMessage({ id: 'cluster.resource.container.form.healthCheck' }),
              key: `healthCheck`,
              children: <div>
                <Tabs
                  centered
                  size='small'
                  key='health-check'
                  activeKey={activeHealthCheckKey}
                  items={healthCheckItems}
                  onChange={(key) => setHealthCheckActiveKey(key)}
                />
              </div>,
            },
            {
              label: intl.formatMessage({ id: 'cluster.resource.container.form.storage' }),
              key: `storage`,
              children: <div>
                <FormContainerVolumeMounts
                  volumeMounts={volumeMounts}
                  volumes={props.volumes}
                  setVolumeMounts={setVolumeMounts}
                  timezoneSync={props.timezoneSync}
                />
              </div>,
            },
            {
              label: intl.formatMessage({ id: 'cluster.resource.container.form.security' }),
              key: `security`,
              children: <div>
                <Row gutter={64}>
                  <Col span={18}  >
                    <ProFormSwitch
                      allowClear
                      label={intl.formatMessage({ id: 'cluster.resource.container.form.security.privileged' })}
                      name="privileged"
                      fieldProps={{
                        defaultValue: props.container.IContainer.securityContext?.privileged,
                      }}
                    />
                    <ProFormDigit
                      allowClear
                      label={intl.formatMessage({ id: 'cluster.resource.container.form.security.runAsGroup' })}
                      name="runAsGroup"
                      fieldProps={{
                        defaultValue: props.container.IContainer.securityContext?.runAsUser,
                      }}
                    />
                    <ProFormSwitch
                      allowClear
                      label={intl.formatMessage({ id: 'cluster.resource.container.form.security.runAsNonRoot' })}
                      name="runAsNonRoot"
                      fieldProps={{
                        defaultValue: props.container.IContainer.securityContext?.runAsNonRoot,
                      }}
                    />
                    <ProFormDigit
                      allowClear
                      label={intl.formatMessage({ id: 'cluster.resource.container.form.security.runAsUser' })}
                      name="runAsUser"
                      fieldProps={{
                        defaultValue: props.container.IContainer.securityContext?.runAsUser,
                      }}
                    />
                    <ProFormSelect
                      mode="multiple"
                      allowClear
                      label={intl.formatMessage({ id: 'cluster.resource.container.form.security.capabilities.add' })}
                      name="capabilitiesAdd"
                      fieldProps={{
                        defaultValue: props.container.IContainer.securityContext?.capabilities?.add || [],
                      }}
                      options={capabilitiesOptions}
                    />
                    <ProFormSelect
                      mode="multiple"
                      allowClear
                      label={intl.formatMessage({ id: 'cluster.resource.container.form.security.capabilities.drop' })}
                      name="capabilitiesDrop"
                      fieldProps={{
                        defaultValue: props.container.IContainer.securityContext?.capabilities?.add || [],
                      }}
                      options={capabilitiesOptions}
                    />
                  </Col>
                </Row>
              </div>
            },
          ]}
        />
      </ProForm>
      <ModalForm
        title={intl.formatMessage({
          id: 'cluster.resource.container.image.select',
        })}
        width="60vw"
        open={imageSelectVisible}
        clearOnDestroy={true}
        onOpenChange={setImageSelectVisible}
        onFinish={async (values: Record<string, any>) => { }}
        modalProps={{ maskClosable: true, destroyOnHidden: true, forceRender: true }}
      ></ModalForm>
    </>
  );
};
