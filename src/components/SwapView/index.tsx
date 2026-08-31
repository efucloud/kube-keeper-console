import { FormattedMessage, useIntl, useAccess } from '@umijs/max';
import { message, Select, Space, Empty, Button, Divider } from 'antd';
import type { SelectProps } from 'antd/lib';
import debounce from 'lodash/debounce';
import React, { useEffect, useState } from 'react';
import type { ClusterServerGroup, UserAccessCluster, UserAccessClusterList } from '@/services/kubernetes';
import { canAccessClusterNamespaces, canAccessClusters } from '@/services/personal.api';
import { appendKubernetesViewQuery, getCurrentViewInfo, saveClusterApiVersions, saveClusterFeatures, saveClusterVersion } from '@/utils/global';
import { ClusterNamespaceDetail, ClusterNamespaceDetailList } from "@/services/cluster_namespace";
import { syncClusterNamespace } from "@/services/cluster.api";
import { clusterServerGroups, getClusterInfo } from "@/services/cluster.api";
import { ClusterDetail } from '@/services/cluster';

export const SwapView: React.FC = () => {
  const { cluster, namespace, isCluster } = getCurrentViewInfo();
  const [clusterList, setClusterLit] = useState<SelectProps['options']>([]);
  const [searchCluster, setSearchCluster] = useState<string>('');
  const [userNamespaces, setUserNamespaces] = useState<ClusterNamespaceDetail[]>([]);
  const [searchNamespace, setSearchNamespace] = useState<string>('');
  const intl = useIntl();
  const access = useAccess();
  const debouncedHandleClusterChange = debounce((value) => {
    setSearchCluster(value);
  }, 1000);
  const debouncedNamespaceChange = debounce((value) => { setSearchNamespace(value); }, 1000);

  const listNamespaces = async () => {
    const params = { cluster, search: searchNamespace };
    const data = (await canAccessClusterNamespaces(params)) as ClusterNamespaceDetailList;
    setUserNamespaces(data.data || []);
  };
  useEffect(() => {
    if (cluster && cluster !== '' && cluster !== '-') {
      listNamespaces();
    }
  }, [searchNamespace]);
  const searchClusterList = async () => {
    const res = (await canAccessClusters({
      search: searchCluster,
    })) as UserAccessClusterList;

    if (res.data) {
      const options: NonNullable<SelectProps['options']> = [];
      for (let i = 0; i < res.data.length; i++) {
        options.push({
          label: `${res.data[i].name}(${res.data[i].code})`,
          value: res.data[i].code,
        });
      }
      setClusterLit(options);
      res.data.map((item: UserAccessCluster) => {
        saveClusterVersion(item.code, `${item.version?.major || 0}.${item.version?.minor || 0}`)
        saveClusterFeatures(item.code, item?.features || []);
        //获取集群资源
        clusterServerGroups({ cluster: item.code }).then(
          (res) => {
            const groups = res as string;
            saveClusterApiVersions(item.code, groups);
          }
        );
      });
    } else {
      setClusterLit([]);
    }

  };
  const getInfo = async () => {
    if (cluster) {
      const data = await getClusterInfo({
        cluster,
      }) as ClusterDetail;
      if (data?.features && data?.features.length > 0) {
        saveClusterFeatures(cluster, data?.features || []);
      }
      //获取集群资源
      clusterServerGroups({ cluster: cluster }).then((res) => {
        const groups = res as string;
        saveClusterApiVersions(cluster, groups);
      });
    }

  };
  useEffect(() => {
    getInfo()
  }, []);
  const syncNamespace = async () => {
    await syncClusterNamespace({ cluster });
    message.success(intl.formatMessage({ id: 'cluster.namespace.sync.success' }));
  };
  useEffect(() => {
    searchClusterList();
  }, [searchCluster]);

  const onClusterSelected = (value: string) => {
    window.location.href = appendKubernetesViewQuery('/kubernetes/cluster/dashboard/overview', { cluster: value });
  };
  if (isCluster && cluster && cluster !== '') {
    return (
      <>
        <Space.Compact>
          <Select
            showSearch={{
              filterOption: false,
              onSearch: (value) => {
                debouncedHandleClusterChange(value);
              }
            }}
            placeholder={<FormattedMessage id="cluster.select" />}
            defaultActiveFirstOption={false}
            defaultValue={cluster}
            style={{ minWidth: 150 }}
            options={clusterList}
            onSelect={onClusterSelected}
            notFoundContent={intl.formatMessage({ id: 'pages.no.data' })}
          />
        </Space.Compact>
      </>
    );

  } else if (namespace !== undefined && namespace !== null && namespace) {
    return <Space separator={<Divider orientation="vertical" />}>
      <div><FormattedMessage id="cluster" />:&nbsp;<a onClick={() => window.open(appendKubernetesViewQuery('/kubernetes/cluster/dashboard/overview', { cluster }))}>{cluster}</a></div>
      <div
        style={{ display: 'flex', alignItems: 'center' }}>
        {/* <Access accessible={access.clusterAccess === true} > */}

        {/* </Access> */}
        <FormattedMessage id="cluster.namespace" />:&nbsp; <Select
          key={cluster}
          notFoundContent={intl.formatMessage({ id: 'pages.no.data' })}
          showSearch={{ filterOption: false, onSearch: (value) => { debouncedNamespaceChange(value); } }}
          defaultValue={namespace}
          style={{ minWidth: 200 }}
          onChange={(value) => {
            const currentPath = appendKubernetesViewQuery(`${window.location.pathname}${window.location.search}`).split('?')[0];
            const targetPath = currentPath.startsWith('/kubernetes/namespace/')
              ? currentPath
              : '/kubernetes/namespace/dashboard/overview';

            window.location.href = appendKubernetesViewQuery(targetPath, {
              cluster,
              namespace: value,
            });
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
        </Select></div>
    </Space>
  } else {
    return null;
  }

};
