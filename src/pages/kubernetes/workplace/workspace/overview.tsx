export interface Info {
  workspace: string;
}

export const WorkspaceOverView: React.FC<Info> = (props) => {
  return (<>{props.workspace}</>)
}
export default WorkspaceOverView