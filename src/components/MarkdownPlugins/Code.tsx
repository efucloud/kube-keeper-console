import { getColorPrimary } from '@/utils/global';
import { CopyOutlined } from '@ant-design/icons';
import  HighlightCode from '@ant-design/x-markdown';
import { useIntl } from '@umijs/max';
import { message } from 'antd';

const Code = (props) => {
  const { class: className, children } = props;
  const lang = className?.match(/language-(\w+)/)?.[1] || '';
  const intl = useIntl();
  const handleCopy = (codeText: string) => {
    navigator.clipboard.writeText(codeText).then(
      () => {
        message.success(intl.formatMessage({ id: 'pages.operation.copy.code.success' }));
      },
      (err) => {
        message.error(intl.formatMessage({ id: 'pages.operation.copy.code.failed' }));
        console.error('复制失败:', err);
      }
    );
  };
  if ((!lang || lang === '') && children.indexOf('\n') === -1) {
    return <code>{children}</code>;
  }
  return <div style={{ position: 'relative' }}>
    <HighlightCode lang={lang} style={{ backgroundColor: '#f6f8fa' }}>{children}</HighlightCode>
    {(lang && lang !== '') && <button
      style={{
        position: 'absolute',
        top: '5px',
        right: '5px',
        border: 'none',
        backgroundColor: 'transparent',
        cursor: 'pointer',
      }}
      onClick={() => handleCopy(children)}
    >
      <CopyOutlined style={{ fontSize: '16px', color: getColorPrimary() }} />
    </button>}
  </div>;
};
export default Code;