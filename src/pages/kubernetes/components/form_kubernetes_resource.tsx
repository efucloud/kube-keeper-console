import { IIoK8sApiCoreV1Container } from "kubernetes-models/v1";

export interface FormIContainer {
  // Kubernetes中容器参数
  IContainer: IIoK8sApiCoreV1Container;
  // 前端的key，在前端创建时或者修改赋值时nanoid生成，不能通过容器名称或者其他字段md5生成(其他字段均是可以变的)
  efuKey: string;
  // 是否为初始化容器
  isInit: boolean;
  //创建
  createTime: number;
}