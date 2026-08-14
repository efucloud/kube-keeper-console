import { DiffEditor } from '@monaco-editor/react';

import * as yaml from 'js-yaml';
import { useEffect, useState } from 'react';
export type ResourceEditorProps = {
  key: string;
  cluster: string;
  kind: string;
  name: string;
  address: string; //请求资源地址
  original: any;
  edit: boolean;
  modified: any;
};

const ResourceDiffEditor: React.FC<ResourceEditorProps> = (props) => {
  const [originalContent, setOriginalContent] = useState<string>('');
  const [modifiedContent, setModifiedContent] = useState<string>('');
  const [language, setLanguage] = useState<string>('yaml');
  const [success, setSuccess] = useState<boolean>(false);
  useEffect(() => {
    setOriginalContent(yaml.dump(props.original));
    setModifiedContent(yaml.dump(props.modified));
  }, [props.original, props.modified]);

  return (
    <div>
      <DiffEditor
        key="diff"
        height="60vh"
        theme="vs-dark"
        language={language}
        original={originalContent}
        modified={modifiedContent}
        options={{
          readOnly: true, // 设置为只读（可选）
          renderSideBySide: true, // 并排显示
          enableSplitViewResizing: true,
          wordWrap: 'on',
        }}
      />
    </div>
  );
};
export default ResourceDiffEditor;
