import React, { useMemo } from 'react';
import { Mermaid } from '@ant-design/x';
import { Card } from 'antd';
import { type MermaidDirection, normalizeMermaidDirection } from '@/pages/kubernetes/components/ai_markdown_components';

type PlanStep = {
  id?: string;
  title?: string;
  tool?: string;
  reason?: string;
  args?: Record<string, any>;
};

type PlanResult = {
  mode?: string;
  goal?: string;
  cluster?: string;
  namespace?: string;
  skillId?: string;
  steps?: PlanStep[];
};

const planRegex = /```json\s*([\s\S]*?)```/g;

const isPlanResult = (data: unknown): data is PlanResult => {
  if (!data || typeof data !== 'object') {
    return false;
  }
  const plan = data as PlanResult;
  return Array.isArray(plan.steps) && plan.steps.length > 0;
};

export const extractPlanFromContent = (content?: string): PlanResult | null => {
  if (!content) {
    return null;
  }

  const blocks = Array.from(content.matchAll(planRegex));
  for (const block of blocks) {
    const body = block[1]?.trim();
    if (!body) {
      continue;
    }
    try {
      const parsed = JSON.parse(body);
      if (isPlanResult(parsed)) {
        return parsed;
      }
    } catch {}
  }

  try {
    const parsed = JSON.parse(content);
    if (isPlanResult(parsed)) {
      return parsed;
    }
  } catch {
    return null;
  }

  return null;
};

export const stripPlanFromContent = (content?: string): string => {
  if (!content) {
    return '';
  }
  if (!extractPlanFromContent(content)) {
    return content;
  }
  return content.replace(planRegex, '').trim();
};

const escapeLabel = (value: string): string => {
  return value.replace(/"/g, '\\"').replace(/\n/g, '<br/>');
};

const toMermaidGraph = (plan: PlanResult, direction: MermaidDirection): string => {
  const steps = plan.steps || [];
  if (steps.length === 0) {
    return `graph ${direction}\nA[No Plan]`;
  }

  const lines: string[] = [];
  lines.push(`graph ${direction}`);

  steps.forEach((step, index) => {
    const nodeId = `S${index + 1}`;
    const title = step.title || `步骤 ${index + 1}`;
    const stepNo = step.id || `${index + 1}`;
    const toolLine = step.tool ? `<br/>tool: ${step.tool}` : '';
    const label = escapeLabel(`${stepNo}. ${title}${toolLine}`);
    lines.push(`${nodeId}["${label}"]`);
  });

  for (let i = 0; i < steps.length - 1; i += 1) {
    lines.push(`S${i + 1} --> S${i + 2}`);
  }

  return normalizeMermaidDirection(lines.join('\n'), direction);
};

export type PlanFlowChartProps = {
  content?: string;
  direction?: MermaidDirection;
};

export const PlanFlowChart: React.FC<PlanFlowChartProps> = ({ content, direction = 'TD' }) => {
  const plan = useMemo(() => extractPlanFromContent(content), [content]);
  const chart = useMemo(() => {
    if (!plan) {
      return '';
    }
    return toMermaidGraph(plan, direction);
  }, [plan, direction]);

  if (!plan || !chart) {
    return null;
  }

  return (
    <Card
      size="small"
      title={`Plan: ${plan.goal || '执行计划'}`}
      style={{ marginBottom: 8 }}
      bodyStyle={{ padding: 12 }}
    >
      <div style={{ width: '100%', overflow: 'auto' }}>
        <Mermaid
          style={{
            width: '100%',
            height: 'auto',
            display: 'block',
            margin: '0 auto',
            maxWidth: 'none',
          }}
        >
          {chart}
        </Mermaid>
      </div>
    </Card>
  );
};

export default PlanFlowChart;
