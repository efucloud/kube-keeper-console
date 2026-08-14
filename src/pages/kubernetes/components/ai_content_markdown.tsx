import {
  CodeOutlined,
  DownOutlined,
  LoadingOutlined,
  RightOutlined,
} from '@ant-design/icons';
import { GPTVis } from '@antv/gpt-vis';
import { Flex, Tag, Typography } from 'antd';
import MarkdownIt from 'markdown-it';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { AiIntlLike } from '@/pages/kubernetes/components/ai_content_utils';

type MarkdownRenderOptions = {
  streaming?: boolean;
  requestId?: string;
};

type MarkdownSegment =
  | { type: 'markdown'; content: string }
  | { type: 'code'; language: string; content: string };

const COLLAPSIBLE_CODE_LANGUAGES = new Set([
  'json',
  'yaml',
  'yml',
  'log',
  'bash',
  'shell',
  'sh',
  'plaintext',
  'text',
]);

const createMarkdownParser = () => {
  const parser = new MarkdownIt({
    html: false,
    linkify: true,
    breaks: true,
  });

  const defaultRender =
    parser.renderer.rules.link_open ||
    ((tokens: any, idx: any, options: any, _env: any, self: any) =>
      self.renderToken(tokens, idx, options));

  parser.renderer.rules.link_open = (tokens: any, idx: any, options: any, env: any, self: any) => {
    const token = tokens[idx];
    token.attrSet('target', '_blank');
    token.attrSet('rel', 'noopener noreferrer');
    return defaultRender(tokens, idx, options, env, self);
  };

  const withStyle =
    (tag: string, style: string) =>
    (
      tokens: any,
      idx: any,
      options: any,
      _env: unknown,
      self: any,
    ) => {
      tokens[idx].attrSet('style', style);
      return self.renderToken(tokens, idx, options);
    };

  parser.renderer.rules.heading_open = withStyle(
    'heading',
    'margin:0 0 8px;line-height:1.45;color:#111827;',
  );
  parser.renderer.rules.paragraph_open = withStyle(
    'paragraph',
    'margin:0 0 8px;',
  );
  parser.renderer.rules.bullet_list_open = withStyle(
    'bullet-list',
    'margin:0 0 8px;padding-left:20px;',
  );
  parser.renderer.rules.ordered_list_open = withStyle(
    'ordered-list',
    'margin:0 0 8px;padding-left:20px;',
  );
  parser.renderer.rules.list_item_open = withStyle(
    'list-item',
    'margin:0 0 4px;',
  );
  parser.renderer.rules.blockquote_open = withStyle(
    'blockquote',
    'margin:0 0 8px;padding-left:12px;border-left:3px solid #dbeafe;color:#475467;',
  );

  return parser;
};

const normalizeStreamingMarkdown = (content: string, streaming = false) => {
  if (!streaming) {
    return content;
  }
  const fenceMatches = content.match(/```/g);
  if ((fenceMatches?.length || 0) % 2 === 1) {
    return `${content}\n\`\`\``;
  }
  return content;
};

const splitMarkdownSegments = (content: string): MarkdownSegment[] => {
  const segments: MarkdownSegment[] = [];
  const pattern = /```([^\n`]*)\n([\s\S]*?)```/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(content)) !== null) {
    if (match.index > lastIndex) {
      segments.push({
        type: 'markdown',
        content: content.slice(lastIndex, match.index),
      });
    }
    segments.push({
      type: 'code',
      language: (match[1] || 'plaintext').trim().toLowerCase(),
      content: match[2] || '',
    });
    lastIndex = pattern.lastIndex;
  }

  if (lastIndex < content.length) {
    segments.push({
      type: 'markdown',
      content: content.slice(lastIndex),
    });
  }

  return segments.filter((segment) => segment.content.trim().length > 0);
};

const looksLikeVisChartBlock = (codeStr: string) => {
  const trimmed = String(codeStr || '').trim();
  if (!trimmed) {
    return false;
  }
  return trimmed.startsWith('{') || trimmed.startsWith('[');
};

const AiContentVis: React.FC<{ codeStr: string }> = ({ codeStr }) => {
  const source = useMemo(() => codeStr.trim(), [codeStr]);
  if (!looksLikeVisChartBlock(source)) {
    return null;
  }

  return (
    <div
      style={{
        width: '100%',
        minHeight: 360,
        borderRadius: 12,
        border: '1px solid #e5edf5',
        background: '#fff',
        overflow: 'hidden',
      }}
    >
      <GPTVis>{`\n\`\`\`vis-chart\n${source}\n\`\`\``}</GPTVis>
    </div>
  );
};

const createCodePreview = (content: string, maxLen = 96) => {
  const normalized = content.replace(/\s+/g, ' ').trim();
  if (!normalized) {
    return 'waiting for code output';
  }
  if (normalized.length <= maxLen) {
    return normalized;
  }
  return `${normalized.slice(0, maxLen)}...`;
};

const formatCodeLabel = (language: string) => {
  const normalized = (language || 'code').toLowerCase();
  switch (normalized) {
    case 'json':
      return 'json';
    case 'yaml':
    case 'yml':
      return 'yaml';
    case 'log':
      return 'logs';
    case 'bash':
    case 'sh':
    case 'shell':
      return 'toolOutput';
    case 'plaintext':
    case 'text':
      return 'toolOutput';
    default:
      return 'toolOutput';
  }
};

const CollapsedCodeBlock: React.FC<{
  language: string;
  codeStr: string;
  streaming?: boolean;
  intl?: AiIntlLike;
  children: React.ReactNode;
}> = ({ language, codeStr, streaming, intl, children }) => {
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (streaming) {
      setExpanded(false);
    }
  }, [streaming, codeStr]);

  const preview = useMemo(() => createCodePreview(codeStr), [codeStr]);
  const labelKey = formatCodeLabel(language);
  const labelMap: Record<string, { id: string; defaultMessage: string }> = {
    json: { id: 'copilot.code.label.json', defaultMessage: 'JSON' },
    yaml: { id: 'copilot.code.label.yaml', defaultMessage: 'YAML' },
    logs: { id: 'copilot.code.label.logs', defaultMessage: 'Logs' },
    toolOutput: {
      id: 'copilot.code.label.toolOutput',
      defaultMessage: 'Tool output',
    },
  };
  const label = intl
    ? intl.formatMessage(labelMap[labelKey] || labelMap.toolOutput)
    : labelMap[labelKey]?.defaultMessage || labelMap.toolOutput.defaultMessage;

  return (
    <div
      style={{
        borderRadius: 12,
        border: '1px solid #eef2f6',
        background: '#fafbfc',
        overflow: 'hidden',
      }}
    >
      <button
        type="button"
        onClick={() => setExpanded((prev) => !prev)}
        style={{
          width: '100%',
          border: 'none',
          background: 'transparent',
          padding: '8px 10px',
          textAlign: 'left',
          cursor: 'pointer',
        }}
      >
        <Flex align="center" justify="space-between" gap={10}>
          <Flex align="center" gap={8} style={{ minWidth: 0, flex: 1 }}>
            <div
              style={{
                width: 22,
                height: 22,
                borderRadius: 999,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: streaming ? '#eef4ff' : '#f3f4f6',
                color: streaming ? '#4f6fa8' : '#7c8797',
                flexShrink: 0,
              }}
            >
              {streaming ? <LoadingOutlined /> : <CodeOutlined />}
            </div>
            <Flex vertical gap={2} style={{ minWidth: 0, flex: 1 }}>
              <Flex align="center" gap={8} wrap={false}>
                <Typography.Text
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: '#1f2937',
                    lineHeight: 1.2,
                  }}
                >
                  {label}
                </Typography.Text>
                <Typography.Text
                  type="secondary"
                  style={{
                    fontSize: 10,
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {language || 'code'}
                </Typography.Text>
              </Flex>
              <Typography.Text
                type="secondary"
                style={{
                  fontSize: 11,
                  minWidth: 0,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  fontFamily:
                    'ui-monospace, SFMono-Regular, SF Mono, Menlo, Monaco, Consolas, monospace',
                }}
              >
                {preview}
              </Typography.Text>
            </Flex>
          </Flex>
          <Flex align="center" gap={8} style={{ flexShrink: 0 }}>
            {streaming ? (
              <Tag
                color="processing"
                style={{
                  marginInlineEnd: 0,
                  borderRadius: 999,
                  paddingInline: 6,
                  fontSize: 10,
                  lineHeight: '18px',
                }}
              >
                {intl?.formatMessage({
                  id: 'copilot.code.streaming',
                  defaultMessage: 'streaming',
                }) || 'streaming'}
              </Tag>
            ) : null}
            <Typography.Text type="secondary" style={{ fontSize: 11 }}>
              {expanded
                ? intl?.formatMessage({
                    id: 'copilot.code.hide',
                    defaultMessage: 'Hide',
                  }) || 'Hide'
                : intl?.formatMessage({
                    id: 'copilot.code.view',
                    defaultMessage: 'View',
                  }) || 'View'}
            </Typography.Text>
            <span style={{ color: '#a8b1be', display: 'inline-flex', fontSize: 11 }}>
              {expanded ? <DownOutlined /> : <RightOutlined />}
            </span>
          </Flex>
        </Flex>
      </button>
      {expanded ? (
        <div
          style={{
            padding: '0 10px 10px',
            borderTop: '1px solid #eef2f7',
            background: '#ffffff',
          }}
        >
          {children}
        </div>
      ) : null}
    </div>
  );
};

const PlainCodeBlock: React.FC<{
  codeStr: string;
  language?: string;
  label?: string;
}> = ({ codeStr, language, label }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
    {(label || language) && (
      <Flex justify="space-between" align="center" wrap gap={8}>
        {label ? (
          <Tag
            color="processing"
            style={{ width: 'fit-content', marginInlineEnd: 0 }}
          >
            {label}
          </Tag>
        ) : null}
        {language ? (
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            {language}
          </Typography.Text>
        ) : null}
      </Flex>
    )}
    <pre
      style={{
        margin: 0,
        padding: '10px 12px',
        borderRadius: 12,
        background: '#f8fafc',
        color: '#0f172a',
        border: '1px solid #e5edf5',
        overflowX: 'auto',
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
        fontSize: 12,
        lineHeight: 1.65,
      }}
    >
      <code>{codeStr}</code>
    </pre>
  </div>
);

const MarkdownHtmlBlock: React.FC<{ html: string }> = ({ html }) => (
  <div
    style={{
      color: '#111827',
      fontSize: 14,
      lineHeight: 1.85,
      wordBreak: 'break-word',
      margin: 0,
    }}
    dangerouslySetInnerHTML={{ __html: html }}
  />
);

const shouldCollapseCodeBlock = (lang: string) =>
  COLLAPSIBLE_CODE_LANGUAGES.has((lang || 'plaintext').toLowerCase());

const renderSpecialCodeBlock = (
  lang: string,
  codeStr: string,
  intl?: AiIntlLike,
  streaming = false,
) => {
  const normalizedLang = (lang || 'plaintext').toLowerCase();
  const normalizedCode =
    normalizedLang === 'vis' || normalizedLang === 'mermaid'
      ? codeStr.trim()
      : codeStr.replace(/\n$/, '');

  if (normalizedLang === 'vis') {
    return <AiContentVis codeStr={normalizedCode} />;
  }

  if (normalizedLang === 'log') {
    const block = (
      <PlainCodeBlock
        codeStr={normalizedCode}
        language="log"
      />
    );
    return (
      <CollapsedCodeBlock
        language={normalizedLang}
        codeStr={normalizedCode}
        streaming={streaming}
        intl={intl}
      >
        {block}
      </CollapsedCodeBlock>
    );
  }

  if (normalizedLang === 'mermaid') {
    return (
      <PlainCodeBlock
        codeStr={normalizedCode}
        language="mermaid"
        label={
          intl?.formatMessage({
            id: 'copilot.code.label.mermaid',
            defaultMessage: 'mermaid source',
          }) || 'mermaid source'
        }
      />
    );
  }

  const block = (
    <PlainCodeBlock
      codeStr={normalizedCode}
      language={normalizedLang || 'plaintext'}
    />
  );

  if (shouldCollapseCodeBlock(normalizedLang)) {
    return (
      <CollapsedCodeBlock
        language={normalizedLang}
        codeStr={normalizedCode}
        streaming={streaming}
        intl={intl}
      >
        {block}
      </CollapsedCodeBlock>
    );
  }

  return block;
};

export const createAiMarkdownRenderer = (intl?: AiIntlLike) => {
  const parser = createMarkdownParser();

  return (content: string, options?: MarkdownRenderOptions) => {
    const normalized = normalizeStreamingMarkdown(
      content,
      Boolean(options?.streaming),
    );
    const segments = splitMarkdownSegments(normalized);

    if (segments.length === 0) {
      return null;
    }

    const nodes: React.ReactNode[] = [];
    for (let index = 0; index < segments.length; index += 1) {
      const segment = segments[index];
      if (segment.type === 'code') {
        nodes.push(
          <React.Fragment key={`code-${index}`}>
            {renderSpecialCodeBlock(
              segment.language,
              segment.content,
              intl,
              Boolean(options?.streaming),
            )}
          </React.Fragment>,
        );
        continue;
      }

      const html = parser.render(segment.content);
      if (!html.trim()) {
        continue;
      }
      nodes.push(<MarkdownHtmlBlock key={`md-${index}`} html={html} />);
    }

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {nodes}
      </div>
    );
  };
};
