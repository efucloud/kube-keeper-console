import { useParams } from "@umijs/max";
import { useEffect, useState } from "react";
import { PageContainer } from "@ant-design/pro-components";
import NamespaceIndex from "@/pages/kubernetes/workspace/namespace";
import { ClusterNamespaceDetail, ClusterNamespaceDetailList } from "@/services/cluster_namespace";
import { getWorkspaceNamespaces } from "@/services/personal.api";

export interface NamespaceListProps {
  clusterNamespaces: ClusterNamespaceDetail[];
}

export const Index: React.FC = () => {
  const code = useParams().code || '';
  const [workspaceNamespaces, setWorkspaceNamespaces] = useState<ClusterNamespaceDetail[]>([]);
  const [display, setDisplay] = useState<boolean>(false);

  const fetchWorkspaceNamespaces = async () => {
    const res = await getWorkspaceNamespaces({ workspace: code }) as ClusterNamespaceDetailList;
    setWorkspaceNamespaces(res.data || []);
    setDisplay(true);
  }

  useEffect(() => {
    fetchWorkspaceNamespaces();
  }, [code]);

  return (<>
    <PageContainer key={`${code}`} title={false}>
      {display && <NamespaceIndex clusterNamespaces={workspaceNamespaces} />}
    </PageContainer>
  </>)
}
export default Index
