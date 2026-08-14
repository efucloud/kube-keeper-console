// 多个页面需要使用的国际化内容
export default {
  'model.cluster_role_template': '集群角色模板',
  'model.cluster_role_template.category': '角色类型',
  'model.cluster_role_template.name': '名称',
  'model.cluster_role_template.name.description':
    '将会作为集群ClusterRole名称显示',
  'model.cluster_role_template.description': '模板描述',
  'model.cluster_role_template.enable.description':
    '被禁用后将会将由此模版在集群中创建的ClusterRole或Role删除',
  'model.cluster_role_template.list.title': '集群角色模版',
  'model.cluster_role_template.list.subTitle':
    '系统内置集群ClusterRole和Role模板，方便快速创建集群角色和绑定角色',
  'model.cluster_role_template.rules': '许可规则',
  'model.cluster_role_template.rules.description':
    '当创建ClusterRole或Role时，将会自动添加以下规则，绑定用户后，用户可以操作的集群资源',
  'model.cluster_role_template.bind.user': '绑定用户',
  'model.cluster_role_template.bind.user.description': '直接从集群中获取的数据',
};
