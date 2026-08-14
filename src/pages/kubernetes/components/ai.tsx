import {
  CloudUploadOutlined,
  DownloadOutlined,
  LinkOutlined,
  PlusOutlined,
  RobotOutlined,
  SendOutlined,
} from '@ant-design/icons';
import { nanoid } from '@ant-design/pro-components';
import type { AttachmentsProps } from '@ant-design/x';
import { Attachments, Sender } from '@ant-design/x';
import { useIntl } from '@umijs/max';
import type { GetProp, GetRef } from 'antd';
import {
  Button,
  Drawer,
  Flex,
  FloatButton,
  Select,
  Space,
  Tag,
  Tooltip,
  theme,
} from 'antd';
import { createStyles } from 'antd-style';
import dayjs from 'dayjs';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { FaRegHandPointRight } from 'react-icons/fa';
import { useAiCopilot } from '@/hooks/useAiCopilot';
import { createAiMarkdownRenderer } from '@/pages/kubernetes/components/ai_content_markdown';
import {
  AiContentStream,
  type CopilotStyleMap,
} from '@/pages/kubernetes/components/ai_content_stream';
import type { ChatRequest } from '@/services/ai_copilot.d';
import { getCurrentViewInfo } from '@/utils/global';

export type QuicklyQuestion = {
  mode?: 'agent';
  skill: string;
  question: string;
};

export type CopilotChatProps = {
  cluster: string;
  namespace?: string;
  apiVersion?: string;
  kind?: string;
  name?: string;
  resourceContent?: string;
  view: 'list' | 'detail' | 'update' | 'create' | undefined;
  externalSkills?: string[];
  questions?: QuicklyQuestion[];
  status?: 'success' | 'error' | undefined;
  externalMessage?: {
    message: string;
    questionType?: 'log' | 'chat' | 'resource' | 'inspection';
  };
};

type SkillOption = { id: string; name: string; mode: 'agent' };

const useCopilotStyle = createStyles(({ css }) => ({
  copilotShell: css`
    height: 100%;
    display: grid;
    grid-template-rows: 1fr auto;
    background: radial-gradient(
        circle at top left,
        rgba(235, 244, 255, 0.9),
        transparent 24%
      ),
      linear-gradient(180deg, #f8fafc 0%, #ffffff 22%, #ffffff 100%);
    border-left: 1px solid #e5edf5;
    overflow: hidden;
  `,
  tagRail: css`
    margin-top: 12px;
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  `,
  body: css`
    min-height: 0;
    overflow: hidden;
  `,
  mainPanel: css`
    height: 100%;
    min-height: 0;
    overflow-y: auto;
    padding: 18px 24px 20px;
  `,
  stream: css`
    max-width: 980px;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    gap: 16px;
  `,
  overview: css`
    display: flex;
    flex-direction: column;
    gap: 14px;
    padding: 0 0 20px;
    border-bottom: 1px solid #edf2f7;
  `,
  contextRail: css`
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    flex-wrap: wrap;
  `,
  contextStats: css`
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
  `,
  suggestionPanel: css`
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  `,
  suggestionButton: css`
    border-radius: 999px !important;
    min-height: 42px;
    padding-inline: 16px !important;
    background: #ffffff !important;
    border: 1px solid #dbe5f0 !important;
    color: #0f172a !important;
    box-shadow: 0 6px 16px rgba(15, 23, 42, 0.04);
    transition: transform 0.18s ease, box-shadow 0.18s ease,
      border-color 0.18s ease !important;

    &:hover {
      transform: translateY(-1px);
      border-color: #93c5fd !important;
      box-shadow: 0 16px 32px rgba(37, 99, 235, 0.12);
    }
  `,
  runSection: css`
    display: flex;
    flex-direction: column;
    gap: 8px;
  `,
  questionRow: css`
    align-self: flex-end;
    max-width: min(78%, 720px);
    display: flex;
    flex-direction: row-reverse;
    align-items: flex-start;
    gap: 2px;
  `,
  questionAvatar: css`
    flex-shrink: 0;
    background: #e2e8f0 !important;
    color: #475467 !important;
    border: 1px solid #d7dee8;
    box-shadow: 0 4px 10px rgba(15, 23, 42, 0.04);
  `,
  questionBubble: css`
    flex: 1;
    min-width: 0;
    padding: 6px 10px;
    border-radius: 16px;
    background: #ffffff;
    color: #111827;
    border: 1px solid #e5e7eb;
    box-shadow: 0 10px 28px rgba(15, 23, 42, 0.06);
    white-space: pre-wrap;
    word-break: break-word;
  `,
  questionText: css`
    margin: 0;
    font-size: 14px;
    line-height: 1.45;
    color: #111827;
    white-space: pre-wrap;
    word-break: break-word;
  `,
  answerBubble: css`
    max-width: 100%;
    .ant-bubble-content {
      background: transparent !important;
      border: none !important;
      border-radius: 0 !important;
      box-shadow: none !important;
      padding: 0 !important;
    }
  `,
  runChrome: css`
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 8px 0 4px;
  `,
  timelineStack: css`
    display: flex;
    flex-direction: column;
    gap: 8px;
  `,
  stepRow: css`
    display: flex;
    align-items: flex-start;
    gap: 12px;
    padding: 8px 0 8px 4px;
  `,
  stepCard: css`
    border-radius: 18px;
    background: linear-gradient(180deg, #fcfdff 0%, #f8fbff 100%);
    border: 1px solid #e7eef6;
    box-shadow: 0 10px 24px rgba(15, 23, 42, 0.04);
    overflow: hidden;
  `,
  stepSummary: css`
    list-style: none;
    cursor: pointer;
    user-select: none;
    padding: 8px 12px;
    &::-webkit-details-marker {
      display: none;
    }
  `,
  stepPanel: css`
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 0 12px 10px;
  `,
  stepRail: css`
    padding-top: 2px;
  `,
  stepContent: css`
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 6px;
  `,
  stepMeta: css`
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: nowrap;
    min-width: 0;
  `,
  stepTitle: css`
    display: inline-block;
    min-width: 0;
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    word-break: normal;
  `,
  stepText: css`
    font-size: 13px;
    line-height: 1.7;
    color: #5e6a72;
    white-space: pre-wrap;
    word-break: break-word;
  `,
  stepReasonBlock: css`
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding-bottom: 2px;
  `,
  stepReasonText: css`
    font-size: 13px;
    line-height: 1.7;
    color: #334155;
    white-space: normal;
    word-break: break-word;
  `,
  traceDetails: css`
    border-radius: 18px;
    background: linear-gradient(180deg, #fbfdff 0%, #f8fbff 100%);
    border: 1px solid #e7eef6;
    box-shadow: 0 10px 24px rgba(15, 23, 42, 0.04);
  `,
  traceSummary: css`
    list-style: none;
    padding: 10px 12px;
    cursor: pointer;
    user-select: none;
    &::-webkit-details-marker {
      display: none;
    }
  `,
  traceSummaryRow: css`
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    flex-wrap: nowrap;
    min-width: 0;
  `,
  traceSummaryMain: css`
    min-width: 0;
    flex: 1;
    display: flex;
    align-items: center;
    gap: 8px;
  `,
  traceTitle: css`
    min-width: 0;
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 13px;
    font-weight: 600;
    color: #1f2937;
  `,
  tracePreviewInline: css`
    max-width: min(48%, 420px);
    flex-shrink: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    text-align: right;
    font-size: 12px;
    line-height: 1.6;
    color: #667085;
  `,
  tracePreview: css`
    font-size: 12px;
    line-height: 1.6;
    color: #667085;
  `,
  traceReasonText: css`
    font-size: 12px;
    line-height: 1.6;
    color: #667085;
    white-space: normal;
    word-break: break-word;
  `,
  tracePanel: css`
    padding: 0 12px 10px;
    display: flex;
    flex-direction: column;
    gap: 8px;
  `,
  tracePanelPlain: css`
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 0 0 0 24px;
  `,
  traceLabel: css`
    font-size: 12px;
    font-weight: 700;
    color: #8b7454;
  `,
  senderDock: css`
    padding: 16px 22px 20px;
    border-top: 1px solid #e8eef5;
    background: rgba(255, 255, 255, 0.96);
    backdrop-filter: blur(10px);
    flex-shrink: 0;
  `,
  monoBox: css`
    margin: 0;
    padding: 10px 12px;
    border-radius: 14px;
    background: #fafafa;
    border: 1px solid #f0f0f0;
    white-space: pre-wrap;
    word-break: break-word;
    font-size: 12px;
    line-height: 1.6;
  `,
  errorPanel: css`
    padding: 14px 16px;
    border-radius: 18px;
    background: rgba(255, 241, 240, 0.86);
  `,
  commentaryPanel: css`
    align-self: flex-start;
    max-width: min(88%, 760px);
    padding: 8px 12px;
    border-radius: 999px;
    background: rgba(248, 250, 252, 0.96);
    border: 1px solid #e6edf5;
    color: #475467;
    box-shadow: 0 8px 18px rgba(15, 23, 42, 0.04);
  `,
  approvalCard: css`
    border-radius: 22px;
    background: linear-gradient(180deg, #fffdf8 0%, #fff7e6 100%);
    border: 1px solid #ffd08a;
    box-shadow: 0 18px 40px rgba(180, 83, 9, 0.08);
    padding: 14px;
  `,
  visPanel: css`
    width: 100%;
    min-height: 360px;
    border-radius: 18px;
    border: 1px solid #f0f0f0;
    background: #fff;
    overflow: hidden;
  `,
}));

export const AICopilot: React.FC<CopilotChatProps> = (props) => {
  const intl = useIntl();
  const { styles } = useCopilotStyle();
  const viewStyles = styles as CopilotStyleMap;
  const { token } = theme.useToken();
  const { namespace } = getCurrentViewInfo();
  const mainPanelRef = useRef<HTMLDivElement | null>(null);
  const streamEndRef = useRef<HTMLDivElement | null>(null);
  const attachmentsRef = useRef<GetRef<typeof Attachments>>(null);
  const [openCopilot, setOpenCopilot] = useState(false);
  const [drawerSize, setDrawerSize] = useState<number>(860);
  const [attachmentsOpen, setAttachmentsOpen] = useState(false);
  const [files, setFiles] = useState<GetProp<AttachmentsProps, 'items'>>([]);
  const [inputValue, setInputValue] = useState('');
  const [questions, setQuestions] = useState<QuicklyQuestion[]>(
    props.questions || [],
  );
  const [skills, setSkills] = useState<SkillOption[]>([]);
  const [selectedSkill, setSelectedSkill] = useState<string>('k8s-default');
  const {
    loading,
    sendMessage,
    cancelRequest,
    sessionId,
    runList,
  } = useAiCopilot({
    cluster: props.cluster,
    namespace: props.namespace,
  });
  const markdownRenderer = useMemo(
    () => createAiMarkdownRenderer(intl),
    [intl],
  );

  useEffect(() => {
    const filterSkills: SkillOption[] = [
      {
        id: 'k8s-default',
        name: intl.formatMessage({ id: 'copilot.chat.skill.k8s-default' }),
        mode: 'agent',
      },
    ];
    if (namespace) {
      filterSkills.push({
        id: 'k8s-namespace-inspect',
        name: intl.formatMessage({
          id: 'copilot.chat.skill.k8s-namespace-inspect',
        }),
        mode: 'agent',
      });
    } else {
      filterSkills.push({
        id: 'k8s-cluster-inspect',
        name: intl.formatMessage({
          id: 'copilot.chat.skill.k8s-cluster-inspect',
        }),
        mode: 'agent',
      });
    }
    if (props.externalSkills?.includes('k8s-log-diagnose-from-user-content')) {
      filterSkills.push({
        id: 'k8s-log-diagnose-from-user-content',
        name: intl.formatMessage({
          id: 'copilot.chat.skill.k8s-log-diagnose-from-user-content',
        }),
        mode: 'agent',
      });
    }
    if (props.externalSkills?.includes('k8s-troubleshoot')) {
      filterSkills.push({
        id: 'k8s-troubleshoot',
        name: intl.formatMessage({ id: 'copilot.chat.skill.k8s-troubleshoot' }),
        mode: 'agent',
      });
    }
    setSkills(filterSkills);
  }, [intl, namespace, props.externalSkills]);

  useEffect(() => {
    const defaultQuestions = [...(props.questions || [])];
    if (props.view) {
      defaultQuestions.push({
        mode: 'agent',
        skill: 'k8s-default',
        question: intl.formatMessage({
          id: 'copilot.cluster.resource.describe',
        }),
      });
    }
    if (props.status === 'error') {
      defaultQuestions.push({
        mode: 'agent',
        skill: 'k8s-troubleshoot',
        question: intl.formatMessage({
          id: 'copilot.chat.skill.k8s-troubleshoot',
        }),
      });
    }
    setQuestions(
      defaultQuestions.filter(
        (item, index, self) =>
          index ===
          self.findIndex(
            (candidate) =>
              candidate.question === item.question &&
              candidate.skill === item.skill,
          ),
      ),
    );
  }, [intl, props.questions, props.status, props.view]);

  useEffect(() => {
    if (!props.externalMessage?.message) {
      return;
    }
    setOpenCopilot(true);
    const requestId = nanoid();
    const request: ChatRequest = {
      requestId,
      sessionId,
      message: props.externalMessage.message,
      mode: 'agent',
      skillId:
        props.externalMessage.questionType === 'log'
          ? 'k8s-log-diagnose-from-user-content'
          : selectedSkill,
      kind: props.kind,
      name: props.name,
      apiVersion: props.apiVersion,
      namespace: props.namespace || '',
    };
    sendMessage(request);
  }, [props.externalMessage?.message]);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      streamEndRef.current?.scrollIntoView({
        block: 'end',
        behavior: 'auto',
      });
      const panel = mainPanelRef.current;
      if (panel) {
        panel.scrollTop = panel.scrollHeight;
      }
    });
    return () => window.cancelAnimationFrame(frame);
  }, [runList, loading]);

  const applySkillSelection = (skillId: string) => {
    setSelectedSkill(skillId);
  };

  const submitQuestion = (messageText: string, skillId?: string) => {
    const requestId = nanoid();
    const request: ChatRequest = {
      requestId,
      sessionId,
      message: messageText,
      mode: 'agent',
      skillId: skillId || selectedSkill,
      namespace: props.namespace || '',
      kind: props.kind,
      name: props.name,
      apiVersion: props.apiVersion || '',
    };
    sendMessage(request);
  };

  const saveDataToFile = () => {
    const content = runList
      .map((run, index) => {
        const answer = run.stream
          .filter((item) => item.kind === 'message')
          .map((item) =>
            run.messages.find((message) => message.id === item.messageId),
          )
          .filter(
            (message): message is NonNullable<typeof message> =>
              Boolean(message && message.role === 'assistant' && message.text.trim()),
          )
          .map((message) => message.text.trim())
          .join('\n\n');
        return `# ${intl.formatMessage({ id: 'copilot.chat.user.question' })}${
          index + 1
        }\n${run.question}\n\n# ${intl.formatMessage({
          id: 'copilot.chat.assistant.answer',
        })}${index + 1}\n${answer}\n`;
      })
      .join('\n');
    const dataBlob = new Blob([content], {
      type: 'text/markdown;charset=utf-8',
    });
    const url = URL.createObjectURL(dataBlob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${dayjs().format('YYYY-MM-DD-HH-mm-ss')}.md`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const sendHeader = (
    <Sender.Header
      styles={{ content: { padding: 0 } }}
      open={attachmentsOpen}
      onOpenChange={setAttachmentsOpen}
      forceRender
    >
      <Attachments
        multiple
        ref={attachmentsRef}
        beforeUpload={() => false}
        accept=".yaml,.yml,.json"
        items={files}
        onChange={({ fileList }) => setFiles(fileList)}
        placeholder={(type) =>
          type === 'drop'
            ? { title: intl.formatMessage({ id: 'copilot.uploadFile' }) }
            : {
                icon: <CloudUploadOutlined />,
                title: intl.formatMessage({ id: 'copilot.uploadFile' }),
                description: intl.formatMessage({
                  id: 'copilot.uploadFile.description',
                }),
              }
        }
      />
    </Sender.Header>
  );

  const chatSender = (
    <div className={styles.senderDock}>
      <Flex vertical gap="middle">
        <Flex gap={10} wrap>
          <Select
            disabled={loading}
            style={{ minWidth: 220 }}
            placeholder={intl.formatMessage({ id: 'copilot.skills' })}
            value={selectedSkill}
            onChange={(value) => applySkillSelection(String(value))}
            options={skills.map((item) => ({
              label: item.name,
              value: item.id,
            }))}
          />
          {runList.length > 0 && (
            <Button
              disabled={loading}
              icon={<DownloadOutlined />}
              onClick={saveDataToFile}
            >
              {intl.formatMessage({ id: 'copilot.messages.download' })}
            </Button>
          )}
        </Flex>
        <Sender
          style={{
            borderRadius: 20,
            border: '1px solid #dbe5f0',
            background:
              'linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(248,250,252,0.98) 100%)',
            boxShadow: '0 18px 40px rgba(15, 23, 42, 0.06)',
          }}
          value={inputValue}
          submitType="shiftEnter"
          onChange={setInputValue}
          header={sendHeader}
          autoSize={{ minRows: 2, maxRows: 6 }}
          placeholder={intl.formatMessage({ id: 'copilot.input.placeholder' })}
          prefix={
            <Button
              type="text"
              icon={<LinkOutlined style={{ color: token.colorText }} />}
              onClick={() => setAttachmentsOpen(!attachmentsOpen)}
            />
          }
          suffix={(_, info) => {
            const { SendButton, LoadingButton } = info.components;
            if (loading) {
              return (
                <Tooltip
                  color={token.colorPrimary}
                  title={intl.formatMessage({
                    id: 'copilot.click.cancel.chat',
                  })}
                >
                  <LoadingButton />
                </Tooltip>
              );
            }
            return <SendButton icon={<SendOutlined />} disabled={loading} />;
          }}
          onSubmit={() => {
            if (!inputValue.trim()) {
              return;
            }
            submitQuestion(inputValue, selectedSkill);
            setInputValue('');
          }}
          onCancel={cancelRequest}
        />
      </Flex>
    </div>
  );

  const overviewPanel = (
    <div className={styles.overview}>
      <div className={styles.contextRail}>
        <Space size={[8, 8]} wrap>
          <Tag color="blue">{props.cluster}</Tag>
          {props.namespace && <Tag color="cyan">{props.namespace}</Tag>}
          {props.kind && <Tag>{props.kind}</Tag>}
          {props.name && <Tag>{props.name}</Tag>}
        </Space>
      </div>
      {questions.length > 0 && runList.length === 0 && (
        <div className={styles.suggestionPanel}>
          {questions.map((item) => (
            <Button
              key={`${item.skill}-${item.question}`}
              size="small"
              type="default"
              className={styles.suggestionButton}
              icon={<FaRegHandPointRight style={{ fontSize: 14 }} />}
              onClick={() => {
                const skillId = item.skill || selectedSkill;
                applySkillSelection(skillId);
                submitQuestion(item.question, skillId);
              }}
            >
              {item.question}
            </Button>
          ))}
        </div>
      )}
    </div>
  );

  const mainPanel = (
    <div ref={mainPanelRef} className={styles.mainPanel}>
      <div className={styles.stream}>
        {overviewPanel}
        {runList.length > 0 &&
          runList.map((run) => (
            <AiContentStream
              key={run.requestId}
              run={run}
              styles={viewStyles}
              intl={intl}
              markdownRenderer={markdownRenderer}
            />
          ))}
        <div ref={streamEndRef} />
      </div>
    </div>
  );

  return (
    <>
      {openCopilot && props.cluster ? (
        <Drawer
          className="ai-drawer"
          destroyOnHidden
          title={intl.formatMessage({ id: 'copilot.name' })}
          size={drawerSize}
          open={openCopilot}
          onClose={() => setOpenCopilot(false)}
          resizable={{ onResize: (newSize) => setDrawerSize(newSize) }}
          styles={{
            header: {
              padding: '14px 20px',
              borderBottom: '1px solid #e8eef5',
              background: 'rgba(255,255,255,0.94)',
              backdropFilter: 'blur(10px)',
            },
            body: { padding: 0, height: '100%', overflow: 'hidden' },
          }}
          extra={
            <Button
              type="text"
              icon={<PlusOutlined />}
              onClick={() => setInputValue('')}
            />
          }
        >
          <div className={styles.copilotShell}>
            <div className={styles.body}>{mainPanel}</div>
            {chatSender}
          </div>
        </Drawer>
      ) : (
        <FloatButton
          className="ai-float-btn"
          onClick={() => setOpenCopilot(true)}
          shape="circle"
          type="primary"
          style={{ insetInlineEnd: 94 }}
          icon={<RobotOutlined />}
        />
      )}
    </>
  );
};

export default AICopilot;
