import Editor from '@monaco-editor/react';
import { useIntl } from '@umijs/max';
import { message } from 'antd';
import { getHeight } from '@/utils/global';

type ReadOnlyYamlEditorProps = {
  content: string;
};

const ReadOnlyYamlEditor: React.FC<ReadOnlyYamlEditorProps> = ({ content }) => {
  const intl = useIntl();

  return (
    <Editor
      key={content}
      language="yaml"
      height={getHeight(content)}
      options={{
        readOnly: true,
        tabSize: 2,
        insertSpaces: true,
        minimap: { enabled: false },
        scrollBeyondLastLine: false,
      }}
      theme="vs-dark"
      defaultValue={content}
      onMount={(editor, monaco) => {
        editor.onKeyDown((e) => {
          if (!editor.getOption(monaco.editor.EditorOption.readOnly)) return;
          if (!e.ctrlKey && !e.metaKey && !e.altKey) {
            e.preventDefault();
            message.warning(intl.formatMessage({ id: 'pages.operation.write.forbbiden' }));
          }
        });
        editor.onDidPaste(() => {
          if (editor.getOption(monaco.editor.EditorOption.readOnly)) {
            message.warning(intl.formatMessage({ id: 'pages.operation.paste.forbidden' }));
          }
        });
      }}
    />
  );
};

export default ReadOnlyYamlEditor;
